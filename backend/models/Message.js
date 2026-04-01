// backend/models/Message.js
// Mongoose schema for hike group chat messages. Supports text and optional file attachments
// (stored on Cloudinary). Indexed on (hikeId, createdAt) for efficient pagination.

// #region Imports
const mongoose = require("mongoose");

// #endregion Imports

// #region Schema
const AttachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  url: { type: String, required: true }, // Cloudinary URL
  publicId: { type: String, required: false }, // Cloudinary public ID for deletion
}, { _id: false });

const MessageSchema = new mongoose.Schema(
  {
    hikeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hike",
      required: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: false,
      default: "",
      trim: true,
    },
    attachment: {
      type: AttachmentSchema,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);
// #endregion Schema

// #region Indexes
// Index for faster queries by hikeId
MessageSchema.index({ hikeId: 1, createdAt: 1 });
// #endregion Indexes

// #region Exports
module.exports = mongoose.model("Message", MessageSchema);
// #endregion Exports
