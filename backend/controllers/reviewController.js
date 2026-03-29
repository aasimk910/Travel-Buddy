// backend/controllers/reviewController.js
const Review = require("../models/Review");

const getReviews = async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error("Fetch reviews error:", err);
    res.status(500).json({ message: "Unable to fetch reviews." });
  }
};

const getLatestReviews = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const reviews = await Review.find().sort({ createdAt: -1 }).limit(limit);
    res.json(reviews);
  } catch (err) {
    console.error("Fetch latest reviews error:", err);
    res.status(500).json({ message: "Unable to fetch latest reviews." });
  }
};

const createReview = async (req, res) => {
  try {
    const { locationName, rating, comment } = req.body;

    if (!req.user || !req.user.name || !req.user.name.trim()) {
      return res.status(400).json({
        message: "User profile is incomplete. Please update your profile with a name.",
      });
    }

    if (!locationName || !locationName.trim()) {
      return res.status(400).json({ message: "Location name is required." });
    }

    if (!rating) {
      return res.status(400).json({ message: "Rating is required." });
    }

    const ratingNum = Number(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ message: "Rating must be a number between 1 and 5." });
    }

    const review = await Review.create({
      userId: req.user._id,
      userName: req.user.name.trim(),
      locationName: locationName.trim(),
      rating: ratingNum,
      comment: comment ? comment.trim() : undefined,
    });

    res.status(201).json(review);
  } catch (err) {
    console.error("Create review error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(err.errors).map((e) => e.message).join(", "),
      });
    }
    res.status(500).json({ message: "Unable to submit review." });
  }
};

module.exports = { getReviews, getLatestReviews, createReview };
