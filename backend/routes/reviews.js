const express = require("express");
const Review = require("../models/Review");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    console.error("Fetch reviews error:", err);
    res.status(500).json({ message: "Unable to fetch reviews." });
  }
});

router.get("/latest", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 }).limit(10);
    res.json(reviews);
  } catch (err) {
    console.error("Fetch latest reviews error:", err);
    res.status(500).json({ message: "Unable to fetch latest reviews." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userName, locationName, rating, comment } = req.body;

    if (!userName || !locationName || !rating) {
      return res
        .status(400)
        .json({ message: "userName, locationName and rating are required." });
    }

    const review = await Review.create({
      userName,
      locationName,
      rating,
      comment,
    });

    res.status(201).json(review);
  } catch (err) {
    console.error("Create review error:", err);
    res.status(500).json({ message: "Unable to submit review." });
  }
});

module.exports = router;

