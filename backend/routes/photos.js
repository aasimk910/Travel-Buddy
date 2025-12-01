const express = require("express");
const mongoose = require("mongoose");
const Photo = require("../models/Photo");
const { authenticateToken } = require("../middleware/auth");
const { createContentLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// GET /api/photos - Get all photos or filter by userName
router.get("/", async (req, res) => {
  try {
    const { userName } = req.query;
    let query = {};
    if (userName) {
      query = { userName };
    }
    const photos = await Photo.find(query).sort({ createdAt: -1 });
    res.json(photos);
  } catch (err) {
    console.error("Fetch photos error:", err);
    res.status(500).json({ message: "Unable to fetch photos." });
  }
});

// GET /api/photos/latest - Get latest photos with pagination
router.get("/latest", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const photos = await Photo.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
    
    const total = await Photo.countDocuments();
    
    res.json({
      photos,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Fetch latest photos error:", err);
    res.status(500).json({ message: "Unable to fetch latest photos." });
  }
});

// POST /api/photos - Create photo (requires authentication)
router.post("/", authenticateToken, createContentLimiter, async (req, res) => {
  try {
    const { caption, imageData, images } = req.body;

    const imageArray = Array.isArray(images)
      ? images.filter(Boolean)
      : imageData
      ? [imageData]
      : [];

    if (imageArray.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one image is required." });
    }

    // Validate image data (basic check for base64)
    for (const img of imageArray) {
      if (typeof img !== "string" || !img.startsWith("data:image/")) {
        return res.status(400).json({
          message: "Invalid image format. Images must be base64 encoded.",
        });
      }
    }

    // Use authenticated user's information
    const photo = await Photo.create({
      userId: req.user._id,
      userName: req.user.name,
      caption: caption?.trim() || undefined,
      images: imageArray,
    });

    res.status(201).json(photo);
  } catch (err) {
    console.error("Create photo error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(err.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }
    res.status(500).json({ message: "Unable to upload photo." });
  }
});

// DELETE /api/photos/:id - Delete photo (requires authentication and ownership)
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid photo ID format." });
    }

    const photo = await Photo.findById(id);
    if (!photo) {
      return res.status(404).json({ message: "Photo not found." });
    }

    // Verify ownership
    if (photo.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own photos." });
    }

    await Photo.findByIdAndDelete(id);
    res.json({ message: "Photo deleted successfully.", id });
  } catch (err) {
    console.error("Delete photo error:", err);
    res.status(500).json({ message: "Unable to delete photo." });
  }
});

module.exports = router;
