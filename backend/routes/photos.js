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
    const { userName, caption, imageData, images } = req.body;

    const imageArray = Array.isArray(images)
      ? images.filter(Boolean)
      : imageData
      ? [imageData]
      : [];

    if (!userName || imageArray.length === 0) {
      return res
        .status(400)
        .json({ message: "userName and at least one image are required." });
    }

    const photo = await Photo.create({
      userName,
      caption,
      images: imageArray,
    });

    res.status(201).json(photo);
  } catch (err) {
    console.error("Create photo error:", err);
    res.status(500).json({ message: "Unable to upload photo." });
  }
});

// NOTE: In a real app you would verify the authenticated user before deleting.
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Photo.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ message: "Photo not found." });
    }

    res.json({ message: "Photo deleted.", id });
  } catch (err) {
    console.error("Delete photo error:", err);
    res.status(500).json({ message: "Unable to delete photo." });
  }
});

module.exports = router;

