const express = require("express");
const Review = require("../models/Review");
const { authenticateToken } = require("../middleware/auth");
const { createContentLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// GET /api/reviews - Get all reviews
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error("Fetch reviews error:", err);
    res.status(500).json({ message: "Unable to fetch reviews." });
  }
});

// GET /api/reviews/latest - Get latest reviews with pagination
router.get("/latest", async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(limit);
    res.json(reviews);
  } catch (err) {
    console.error("Fetch latest reviews error:", err);
    res.status(500).json({ message: "Unable to fetch latest reviews." });
  }
});

// POST /api/reviews - Create review (requires authentication)
router.post("/", authenticateToken, createContentLimiter, async (req, res) => {
  try {
    const { locationName, rating, comment } = req.body;

    // Validate user has a name
    if (!req.user || !req.user.name || !req.user.name.trim()) {
      return res.status(400).json({
        message: "User profile is incomplete. Please update your profile with a name.",
      });
    }

    // Validation
    if (!locationName || !locationName.trim()) {
      return res.status(400).json({
        message: "Location name is required.",
      });
    }

    if (!rating) {
      return res.status(400).json({
        message: "Rating is required.",
      });
    }

    // Validate rating range
    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be a number between 1 and 5." });
    }

    // Sanitize inputs
    const sanitizedLocationName = locationName.trim();
    const sanitizedComment = comment ? comment.trim() : undefined;

    // Use authenticated user's information
    const review = await Review.create({
      userId: req.user._id,
      userName: req.user.name.trim(),
      locationName: sanitizedLocationName,
      rating: ratingNum,
      comment: sanitizedComment,
    });

    res.status(201).json(review);
  } catch (err) {
    console.error("Create review error:", err);
    if (err.name === "ValidationError") {
      // Extract specific validation errors
      const errors = Object.values(err.errors).map((e) => e.message);
      return res.status(400).json({
        message: errors.join(", "),
      });
    }
    res.status(500).json({ message: "Unable to submit review." });
  }
});

module.exports = router;
