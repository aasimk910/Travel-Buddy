// backend/models/Hotel.js
// Mongoose schema for hotels. Contains contact info, coordinates, amenities,
// rating, and references to HotelPackage documents (room types).

// #region Imports
const mongoose = require("mongoose");

// #endregion Imports

// #region Schema
const HotelSchema = new mongoose.Schema(
  {
    name: {
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
    description: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
    },
    website: {
      type: String,
      trim: true,
    },
    imageUrl: {
      type: String,
    },
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4.0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    amenities: [
      {
        type: String,
      },
    ],
    packages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "HotelPackage",
      },
    ],
  },
  {
    timestamps: true,
  }
);
// #endregion Schema

// #region Exports
module.exports = mongoose.model("Hotel", HotelSchema);
// #endregion Exports
