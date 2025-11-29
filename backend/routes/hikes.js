const express = require("express");
const Hike = require("../models/Hike");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const hikes = await Hike.find().sort({ date: 1 });
    res.json(hikes);
  } catch (err) {
    console.error("Fetch hikes error:", err);
    res.status(500).json({ message: "Unable to fetch hikes." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { title, location, difficulty, date, spotsLeft, imageUrl, description } =
      req.body;

    if (!title || !location || !date) {
      return res
        .status(400)
        .json({ message: "title, location and date are required." });
    }

    const hike = await Hike.create({
      title,
      location,
      difficulty,
      date,
      spotsLeft,
      imageUrl,
      description,
    });

    res.status(201).json(hike);
  } catch (err) {
    console.error("Create hike error:", err);
    res.status(500).json({ message: "Unable to create hike." });
  }
});

module.exports = router;

