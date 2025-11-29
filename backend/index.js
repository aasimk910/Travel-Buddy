// backend/index.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config(); // loads .env from backend folder

const app = express();

// === Config ===
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ MONGO_URI is not defined in .env");
  process.exit(1);
}

console.log("🚀 Starting Travel Buddy backend...");

// === Middlewares ===
app.use(cors());
app.use(express.json());

// === Routes ===
app.get("/", (req, res) => {
  res.send("Travel Buddy API is running ✅");
});

const authRoutes = require("./routes/auth");
const reviewRoutes = require("./routes/reviews");
const photoRoutes = require("./routes/photos");
const hikeRoutes = require("./routes/hikes");
const tripRoutes = require("./routes/trips");

app.use("/api/auth", authRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/photos", photoRoutes);
app.use("/api/hikes", hikeRoutes);
app.use("/api/trips", tripRoutes);

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("💥 Server error:", err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

// === Start server & connect DB ===
async function startServer() {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: "travelbuddy",
    });
    console.log("✅ Connected to MongoDB");

    app.listen(PORT, () => {
      console.log(`✨ Server running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

startServer();

module.exports = app;
