const mongoose = require("mongoose");

const HotelPackageSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    roomType: {
      type: String,
      required: true,
      enum: ["single", "double", "twin", "suite", "deluxe"],
    },
    pricePerNight: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "NPR",
      enum: ["NPR", "USD", "EUR", "INR"],
    },
    capacity: {
      type: Number,
      required: true,
      min: 1,
      default: 2,
    },
    amenities: [
      {
        type: String,
      },
    ],
    image: {
      type: String,
    },
    availableRooms: {
      type: Number,
      min: 0,
      default: 5,
    },
    maxStayNights: {
      type: Number,
      min: 1,
    },
    minStayNights: {
      type: Number,
      min: 1,
      default: 1,
    },
    cancellationPolicy: {
      type: String,
      enum: ["free", "partial", "non-refundable"],
      default: "free",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("HotelPackage", HotelPackageSchema);
