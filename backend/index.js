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

// Simple test route
app.get("/", (req, res) => {
  res.send("Travel Buddy API is running ✅");
});

// ⬇️ later you can mount your routes like this:
// const authRoutes = require("./routes/auth");
// app.use("/api/auth", authRoutes);

// 404 handler for unknown routes
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found" });
});

// Global error handler (optional but useful)
app.use((err, req, res, next) => {
  console.error("💥 Server error:", err);
  res.status(500).json({ error: "Something went wrong on the server" });
});

// === Start server & connect DB ===
async function startServer() {
  try {
    await mongoose.connect(MONGO_URI, {
      dbName: "travelbuddy", // this will be your DB name
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
