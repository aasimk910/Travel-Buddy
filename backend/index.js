// backend/index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const compression = require("compression");
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io");

dotenv.config(); // loads .env from backend folder

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5000",
].filter(Boolean);

// Single reusable CORS options object — avoids duplicating the origin callback
const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (same-origin, mobile apps, curl)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin '${origin}' not allowed`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// === Config ===
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not defined in .env");
  process.exit(1);
}

console.log("🚀 Starting Travel Buddy backend...");

// === Middlewares ===
// Trust the first proxy (needed for rate limiting behind load balancers/nginx)
app.set("trust proxy", 1);
app.use(helmet()); // Security headers
app.use(compression()); // Gzip response compression
app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // Handle preflight for all routes
app.use(express.json({ limit: "10mb" }));

// Rate limiting
const { apiLimiter } = require("./middleware/rateLimiter");
app.use("/api/", apiLimiter);

// === Routes ===
app.get("/", (req, res) => {
  res.send("Travel Buddy API is running ✅");
});

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/photos", require("./routes/photos"));
app.use("/api/hikes", require("./routes/hikes"));
app.use("/api/trips", require("./routes/trips"));
app.use("/api/itinerary", require("./routes/itinerary"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/products", require("./routes/products"));
app.use("/api/orders", require("./routes/orders"));
app.use("/api/admin", require("./routes/admin"));
app.use("/api/payment", require("./routes/payment"));
app.use("/api/payments", require("./routes/khalti-payments"));
app.use("/api/rooms", require("./routes/rooms"));
app.use("/api/hotels", require("./routes/hotels"));
app.use("/api/bookings", require("./routes/bookings"));
app.use("/api/stats", require("./routes/stats"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/user-trips", require("./routes/user-trips"));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("💥 Server error:", err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

// === Socket.IO ===
const { initSocket } = require("./utils/socket");
initSocket(io);

// === DB helpers ===
function mongoUriHasDbName(uri) {
  const withoutProtocol = uri.replace(/^mongodb(\+srv)?:\/\//, "");
  const firstSlash = withoutProtocol.indexOf("/");
  if (firstSlash === -1) return false;
  const afterSlash = withoutProtocol.slice(firstSlash + 1);
  if (!afterSlash || afterSlash.startsWith("?")) return false;
  return Boolean(afterSlash.split("?")[0]);
}

async function startServer() {
  try {
    const connectOptions = {};
    if (!mongoUriHasDbName(MONGO_URI)) {
      connectOptions.dbName = MONGO_DB_NAME || "travelbuddy";
    }

    await mongoose.connect(MONGO_URI, connectOptions);
    console.log("✅ Connected to MongoDB");

    server.listen(PORT, () => {
      console.log(`✨ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

// === Handle unhandled promise rejections ===
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});

startServer();

module.exports = app;
