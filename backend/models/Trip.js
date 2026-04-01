// backend/models/Trip.js
// Mongoose schema for organized trips. Includes destination, date range, status,
// max traveler capacity, and participant list.

// #region Imports
const mongoose = require("mongoose");

// #endregion Imports

// #region Schema
const TripSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    organizerName: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    status: {
      type: String,
      enum: ["planning", "open", "closed"],
      default: "planning",
    },
    maxTravelers: {
      type: Number,
      min: 1,
      default: 6,
    },
    participants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    }],
  },
  {
    timestamps: true,
  }
);
// #endregion Schema

// #region Exports
module.exports = mongoose.model("Trip", TripSchema);

// #endregion Exports
