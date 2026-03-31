// backend/controllers/statsController.js
// Returns public site-wide statistics (hike count, user count, photo count, upcoming hikes).

// #region Imports
const Hike = require("../models/Hike");
const User = require("../models/User");
const Photo = require("../models/Photo");

// #endregion Imports

// Aggregates key platform metrics in parallel and returns them as JSON.
const getStats = async (req, res) => {
  try {
    const now = new Date();
    // Run all count queries concurrently for faster response
    const [hikeCount, userCount, photoCount, upcomingHikes] = await Promise.all([
      Hike.countDocuments(),
      User.countDocuments(),
      Photo.countDocuments(),
      Hike.countDocuments({ date: { $gte: now } }), // Only future hikes
    ]);
    res.json({ hikeCount, userCount, photoCount, upcomingHikes });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Unable to fetch stats." });
  }
};

// #region Exports
module.exports = { getStats };
// #endregion Exports
