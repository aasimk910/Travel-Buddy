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
      .populate("hotels")
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

// GET /api/hikes/:id - Get a single hike by ID
router.get("/:id", async (req, res) => {
  try {
    const hike = await Hike.findById(req.params.id)
      .populate("userId", "name email")
      .populate("participants", "name email")
      .populate({
        path: "hotels",
        populate: {
          path: "packages",
        },
      });
    if (!hike) {
      return res.status(404).json({ message: "Hike not found." });
    }
    res.json(hike);
  } catch (err) {
    console.error("Fetch hike error:", err);
    res.status(500).json({ message: "Unable to fetch hike." });
  }
});

// POST /api/hikes - Create hike (requires authentication)
router.post("/", authenticateToken, createContentLimiter, async (req, res) => {
  try {
    const { title, location, coordinates, difficulty, date, spotsLeft, imageUrl, description } =
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
      coordinates: coordinates || undefined,
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

// POST /api/hikes/:id/join - Join a hike
router.post("/:id/join", authenticateToken, async (req, res) => {
  try {
    const hikeId = req.params.id;
    const userId = req.user._id;

    const hike = await Hike.findById(hikeId);
    if (!hike) {
      return res.status(404).json({ message: "Hike not found." });
    }

    // Check if user already joined
    if (hike.participants && hike.participants.some(p => p.equals(userId))) {
      return res.status(400).json({ message: "You have already joined this hike." });
    }

    // Check spots availability
    if (hike.spotsLeft <= 0) {
      return res.status(400).json({ message: "No spots left for this hike." });
    }

    // Add user to participants and decrement spots
    hike.participants = hike.participants || [];
    hike.participants.push(userId);
    hike.spotsLeft -= 1;
    await hike.save();

    res.json({ message: "Successfully joined the hike!", hike });
  } catch (err) {
    console.error("Join hike error:", err);
    res.status(500).json({ message: "Unable to join hike." });
  }
});

// POST /api/hikes/:id/leave - Leave a hike
router.post("/:id/leave", authenticateToken, async (req, res) => {
  try {
    const hikeId = req.params.id;
    const userId = req.user._id;

    const hike = await Hike.findById(hikeId);
    if (!hike) {
      return res.status(404).json({ message: "Hike not found." });
    }

    // Check if user is a participant
    if (!hike.participants || !hike.participants.some(p => p.equals(userId))) {
      return res.status(400).json({ message: "You are not a participant of this hike." });
    }

    // Remove user from participants and increment spots
    hike.participants = hike.participants.filter(p => !p.equals(userId));
    hike.spotsLeft += 1;
    await hike.save();

    res.json({ message: "Successfully left the hike!", hike });
  } catch (err) {
    console.error("Leave hike error:", err);
    res.status(500).json({ message: "Unable to leave hike." });
  }
});

module.exports = router;
