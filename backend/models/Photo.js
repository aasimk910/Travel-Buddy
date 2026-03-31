// backend/models/Photo.js
// Mongoose schema for user-uploaded travel photos. Stores Cloudinary URLs and public IDs
// for cleanup. Indexed on createdAt and userName for gallery queries.

// #region Imports
const mongoose = require("mongoose");

// #endregion Imports
const PhotoSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userName: {
      type: String,
      required: true,
      trim: true,
    },
    caption: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    images: {
      type: [String],
      required: true,
    },
    cloudinaryPublicIds: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Common query patterns
PhotoSchema.index({ createdAt: -1 });     // getLatestPhotos sorts by createdAt
PhotoSchema.index({ userName: 1 });       // getPhotos filters by userName

// #region Exports
module.exports = mongoose.model("Photo", PhotoSchema);

// #endregion Exports
