const express = require("express");
const Hike = require("../models/Hike");
const { authenticateToken } = require("../middleware/auth");
const { createContentLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// GET /api/hikes - Get all hikes with pagination
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const hikes = await Hike.find()
      .sort({ date: 1 })
      .limit(limit)
      .skip(skip);
    
    const total = await Hike.countDocuments();
    
    res.json({
      hikes,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Fetch hikes error:", err);
    res.status(500).json({ message: "Unable to fetch hikes." });
  }
});

// POST /api/hikes - Create hike (requires authentication)
router.post("/", authenticateToken, createContentLimiter, async (req, res) => {
  try {
    const { title, location, difficulty, date, spotsLeft, imageUrl, description } =
      req.body;

    // Validation
    if (!title || !location || !date) {
      return res.status(400).json({
        message: "title, location and date are required.",
      });
    }

    // Validate difficulty range
    const difficultyNum = Number(difficulty);
    if (isNaN(difficultyNum) || difficultyNum < 1 || difficultyNum > 5) {
      return res.status(400).json({
        message: "Difficulty must be a number between 1 and 5.",
      });
    }

    // Validate date format
    const hikeDate = new Date(date);
    if (isNaN(hikeDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    // Validate spotsLeft
    const spots = Number(spotsLeft);
    if (isNaN(spots) || spots < 0) {
      return res.status(400).json({
        message: "Spots left must be a non-negative number.",
      });
    }

    // Sanitize inputs
    const sanitizedTitle = title.trim();
    const sanitizedLocation = location.trim();
    const sanitizedDescription = description ? description.trim() : undefined;

    // Use authenticated user's information
    const hike = await Hike.create({
      userId: req.user._id,
      title: sanitizedTitle,
      location: sanitizedLocation,
      difficulty: difficultyNum,
      date: hikeDate,
      spotsLeft: spots || 0,
      imageUrl: imageUrl || undefined,
      description: sanitizedDescription,
    });

    res.status(201).json(hike);
  } catch (err) {
    console.error("Create hike error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(err.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }
    res.status(500).json({ message: "Unable to create hike." });
  }
});

module.exports = router;
