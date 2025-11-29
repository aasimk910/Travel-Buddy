const express = require("express");
const Photo = require("../models/Photo");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const photos = await Photo.find().sort({ createdAt: -1 });
    res.json(photos);
  } catch (err) {
    console.error("Fetch photos error:", err);
    res.status(500).json({ message: "Unable to fetch photos." });
  }
});

router.get("/latest", async (req, res) => {
  try {
    const photos = await Photo.find().sort({ createdAt: -1 }).limit(12);
    res.json(photos);
  } catch (err) {
    console.error("Fetch latest photos error:", err);
    res.status(500).json({ message: "Unable to fetch latest photos." });
  }
});

router.post("/", async (req, res) => {
  try {
    const { userName, caption, imageData } = req.body;

    if (!userName || !imageData) {
      return res
        .status(400)
        .json({ message: "userName and imageData are required." });
    }

    const photo = await Photo.create({
      userName,
      caption,
      imageData,
    });

    res.status(201).json(photo);
  } catch (err) {
    console.error("Create photo error:", err);
    res.status(500).json({ message: "Unable to upload photo." });
  }
});

module.exports = router;

