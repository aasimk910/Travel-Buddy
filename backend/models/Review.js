// backend/models/Review.js
// Mongoose schema for travel location reviews. Users rate locations 1-5 with optional comments.

// #region Imports
const mongoose = require("mongoose");

// #endregion Imports

// #region Schema
const ReviewSchema = new mongoose.Schema(
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
    locationName: {
      type: String,
      required: true,
      trim: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  {
    timestamps: true,
  }
);
// #endregion Schema

// #region Exports
module.exports = mongoose.model("Review", ReviewSchema);

// #endregion Exports
