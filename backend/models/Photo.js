const mongoose = require("mongoose");

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

module.exports = mongoose.model("Photo", PhotoSchema);

