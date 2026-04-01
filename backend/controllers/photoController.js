// backend/controllers/photoController.js
// Manages user-uploaded travel photos. Stores images on Cloudinary.
// Supports multi-image uploads, pagination, and per-user filtering.

// #region Imports
const mongoose = require("mongoose");
const Photo = require("../models/Photo");
const { uploadMultipleBase64Images, deleteMultipleImages } = require("../utils/cloudinaryUpload");

// #endregion Imports

// #region Read Photos
// Returns all photos, optionally filtered by userName query param.
const getPhotos = async (req, res) => {
  try {
    const { userName } = req.query;
    const query = userName ? { userName } : {};
    const photos = await Photo.find(query).sort({ createdAt: -1 });
    res.json(photos);
  } catch (err) {
    console.error("Fetch photos error:", err);
    res.status(500).json({ message: "Unable to fetch photos." });
  }
};

// Returns the latest photos with pagination (page/limit query params).
const getLatestPhotos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const photos = await Photo.find().sort({ createdAt: -1 }).limit(limit).skip(skip);
    const total = await Photo.countDocuments();

    res.json({
      photos,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Fetch latest photos error:", err);
    res.status(500).json({ message: "Unable to fetch latest photos." });
  }
};
// #endregion Read Photos

// #region Create Photo
// Uploads one or more base64-encoded images to Cloudinary and creates a Photo record.
// Validates image format before upload. Supports both single (imageData) and batch (images[]) inputs.
const createPhoto = async (req, res) => {
  try {
    const { caption, imageData, images } = req.body;

    const imageArray = Array.isArray(images)
      ? images.filter(Boolean)
      : imageData
      ? [imageData]
      : [];

    if (imageArray.length === 0) {
      return res.status(400).json({ message: "At least one image is required." });
    }

    for (const img of imageArray) {
      if (typeof img !== "string" || (!img.startsWith("data:image/") && !img.startsWith("data:application/octet-stream"))) {
        return res.status(400).json({
          message: "Invalid image format. Images must be base64 encoded.",
        });
      }
    }

    const uploadResults = await uploadMultipleBase64Images(imageArray, "travel-buddy/photos");
    const imageUrls = uploadResults.map((r) => r.url);
    const publicIds = uploadResults.map((r) => r.publicId);

    const photo = await Photo.create({
      userId: req.user._id,
      userName: req.user.name,
      caption: caption?.trim() || undefined,
      images: imageUrls,
      cloudinaryPublicIds: publicIds,
    });

    res.status(201).json(photo);
  } catch (err) {
    console.error("Create photo error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(err.errors).map((e) => e.message).join(", "),
      });
    }
    res.status(500).json({ message: "Unable to upload photo." });
  }
};
// #endregion Create Photo

// #region Delete Photo
// Deletes a photo owned by the authenticated user.
// Also removes the image(s) from Cloudinary to free storage.
const deletePhoto = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid photo ID format." });
    }

    const photo = await Photo.findById(id);
    if (!photo) return res.status(404).json({ message: "Photo not found." });

    if (photo.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You can only delete your own photos." });
    }

    if (photo.cloudinaryPublicIds && photo.cloudinaryPublicIds.length > 0) {
      try {
        await deleteMultipleImages(photo.cloudinaryPublicIds);
      } catch (cloudinaryError) {
        console.error("Error deleting from Cloudinary:", cloudinaryError);
      }
    }

    await Photo.findByIdAndDelete(id);
    res.json({ message: "Photo deleted successfully.", id });
  } catch (err) {
    console.error("Delete photo error:", err);
    res.status(500).json({ message: "Unable to delete photo." });
  }
};
// #endregion Delete Photo

// #region Exports
module.exports = { getPhotos, getLatestPhotos, createPhoto, deletePhoto };
// #endregion Exports
