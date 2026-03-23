const mongoose = require("mongoose");

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

module.exports = mongoose.model("Hotel", HotelSchema);
