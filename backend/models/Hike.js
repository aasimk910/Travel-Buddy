const mongoose = require("mongoose");

const HikeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },
    startPoint: {
      lat: { type: Number },
      lng: { type: Number },
    },
    endPoint: {
      lat: { type: Number },
      lng: { type: Number },
    },
    difficulty: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      default: 1,
    },
    date: {
      type: Date,
      required: true,
    },
    spotsLeft: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    imageUrl: {
      type: String,
    },
    description: {
      type: String,
      trim: true,
    },
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
    hotels: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
    }],
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Hike", HikeSchema);

