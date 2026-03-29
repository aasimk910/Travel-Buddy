// backend/controllers/statsController.js
const Hike = require("../models/Hike");
const User = require("../models/User");
const Photo = require("../models/Photo");

const getStats = async (req, res) => {
  try {
    const now = new Date();
    const [hikeCount, userCount, photoCount, upcomingHikes] = await Promise.all([
      Hike.countDocuments(),
      User.countDocuments(),
      Photo.countDocuments(),
      Hike.countDocuments({ date: { $gte: now } }),
    ]);
    res.json({ hikeCount, userCount, photoCount, upcomingHikes });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ message: "Unable to fetch stats." });
  }
};

module.exports = { getStats };
