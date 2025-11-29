const mongoose = require("mongoose");

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
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Trip", TripSchema);

