const mongoose = require("mongoose");

const AttachmentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  data: { type: String, required: true }, // base64 data
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
      required: true,
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

// Index for faster queries by hikeId
MessageSchema.index({ hikeId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", MessageSchema);
