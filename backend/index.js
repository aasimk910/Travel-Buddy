// backend/index.js
// Main entry point for the Travel Buddy Express server.
// Sets up middleware, routes, Socket.IO, and connects to MongoDB.

// #region Imports
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");           // Cross-Origin Resource Sharing middleware
const helmet = require("helmet");       // Adds various HTTP security headers
const compression = require("compression"); // Gzip compression for responses
const dotenv = require("dotenv");
const http = require("http");
const { Server } = require("socket.io"); // Real-time bidirectional communication

// #endregion Imports

// #region Config
dotenv.config(); // loads .env from backend folder

const app = express();
const server = http.createServer(app); // Wraps Express app for Socket.IO support

// Whitelist of allowed origins for CORS (frontend URLs)
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

// Initialize Socket.IO server with the same CORS policy
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

// === Config ===
const PORT = process.env.PORT || 5000;        // Server listen port
const MONGO_URI = process.env.MONGO_URI;      // MongoDB connection string
const MONGO_DB_NAME = process.env.MONGO_DB_NAME; // Optional database name override

// Fail fast if no database URI is configured
if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not defined in .env");
  process.exit(1);
}

console.log("🚀 Starting Travel Buddy backend...");

// === Middlewares ===
// Trust the first proxy (needed for rate limiting behind load balancers/nginx)
app.set("trust proxy", 1);
app.use(helmet()); // Security headers (XSS, CSP, etc.)
app.use(compression()); // Gzip response compression for faster transfers
app.use(cors(corsOptions));             // Enable CORS for all routes
app.options("*", cors(corsOptions));    // Handle preflight OPTIONS for all routes
app.use(express.json({ limit: "10mb" })); // Parse JSON bodies up to 10 MB

// Apply global rate limiting to all /api/* endpoints
const { apiLimiter } = require("./middleware/rateLimiter");
app.use("/api/", apiLimiter);
// #endregion Middlewares

// #region Routes
// === Routes ===
// Health-check root endpoint
app.get("/", (req, res) => {
  res.send("Travel Buddy API is running ✅");
});

// Mount all feature-specific API route modules
app.use("/api/auth", require("./routes/auth"));           // Authentication (signup, login, Google, password reset)
app.use("/api/users", require("./routes/users"));         // User profile management & onboarding
app.use("/api/reviews", require("./routes/reviews"));     // Travel location reviews
app.use("/api/photos", require("./routes/photos"));       // Photo uploads & gallery
app.use("/api/hikes", require("./routes/hikes"));         // Hike CRUD & join/leave
app.use("/api/trips", require("./routes/trips"));         // Trip join functionality
app.use("/api/itinerary", require("./routes/itinerary")); // AI-powered itinerary generation
app.use("/api/expenses", require("./routes/expenses"));   // Hike expense splitting
app.use("/api/products", require("./routes/products"));   // Shop products (read-only)
app.use("/api/orders", require("./routes/orders"));       // Shop order management
app.use("/api/admin", require("./routes/admin"));         // Admin panel CRUD operations
app.use("/api/payment", require("./routes/payment"));     // General Khalti payment gateway
app.use("/api/payments", require("./routes/khalti-payments")); // Hotel booking Khalti payments
app.use("/api/rooms", require("./routes/rooms"));         // E2E encrypted chat room keys
app.use("/api/hotels", require("./routes/hotels"));       // Hotel & package management
app.use("/api/bookings", require("./routes/bookings"));   // Hotel booking CRUD
app.use("/api/stats", require("./routes/stats"));         // Public site statistics
app.use("/api/messages", require("./routes/messages"));   // Chat message history
app.use("/api/user-trips", require("./routes/user-trips")); // User's joined trips/hikes

// 404 handler — catches any unmatched routes
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler — logs and returns a generic 500
app.use((err, req, res, next) => {
  console.error("💥 Server error:", err);
  res.status(500).json({ error: "Something went wrong on the server" });
});
// #endregion Routes

// #region Socket.IO
// === Socket.IO ===
// Initialize real-time chat and E2E key exchange via socket events
const { initSocket } = require("./utils/socket");
initSocket(io);
// #endregion Socket.IO

// #region Database
// === DB helpers ===
// Checks if the MongoDB URI already includes a database name after the host
function mongoUriHasDbName(uri) {
  const withoutProtocol = uri.replace(/^mongodb(\+srv)?:\/\//, "");
  const firstSlash = withoutProtocol.indexOf("/");
  if (firstSlash === -1) return false;
  const afterSlash = withoutProtocol.slice(firstSlash + 1);
  if (!afterSlash || afterSlash.startsWith("?")) return false;
  return Boolean(afterSlash.split("?")[0]);
}

// Connects to MongoDB and starts the HTTP server
async function startServer() {
  try {
    const connectOptions = {};
    // If the URI doesn't specify a DB, use the MONGO_DB_NAME env var (default: travelbuddy)
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
// #endregion Database

// #region Error Handling
// === Handle unhandled promise rejections ===
// Prevents silent failures from unhandled async errors
process.on("unhandledRejection", (reason, promise) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
});

// Crashes the process on synchronous exceptions to avoid undefined state
process.on("uncaughtException", (err) => {
  console.error("❌ Uncaught Exception:", err);
  process.exit(1);
});
// #endregion Error Handling

startServer();
