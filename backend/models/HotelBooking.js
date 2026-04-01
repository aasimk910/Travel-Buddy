// backend/models/HotelBooking.js
// Mongoose schema for hotel bookings. Tracks check-in/out dates, pricing, guest info,
// booking status (pending/confirmed/cancelled), and Khalti payment details.

// #region Imports
const mongoose = require("mongoose");

// #endregion Imports

// #region Schema
const HotelBookingSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    hikeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hike",
      required: false,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
    },
    packageId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "HotelPackage",
      required: true,
    },
    checkInDate: {
      type: Date,
      required: true,
    },
    checkOutDate: {
      type: Date,
      required: true,
    },
    numberOfRooms: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    numberOfNights: {
      type: Number,
      required: true,
      min: 1,
    },
    pricePerNight: {
      type: Number,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: "NPR",
    },
    guestName: {
      type: String,
      required: true,
    },
    guestEmail: {
      type: String,
      required: true,
    },
    guestPhone: {
      type: String,
      trim: true,
      sparse: true,
    },
    specialRequests: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled"],
      default: "pending",
    },
    bookingReference: {
      type: String,
      unique: true,
      sparse: true,
    },
    paymentStatus: {
      type: String,
      enum: ["unpaid", "partial", "paid"],
      default: "unpaid",
    },
    notes: {
      type: String,
      trim: true,
    },
    khaltiPaymentId: {
      type: String,
      sparse: true,
    },
    khaltiTransactionId: {
      type: String,
      sparse: true,
    },
    khaltiPidx: {
      type: String,
      sparse: true,
    },
  },
  {
    timestamps: true,
  }
);
// #endregion Schema

// #region Hooks
// Generate booking reference before saving
HotelBookingSchema.pre("save", async function (next) {
  if (!this.bookingReference) {
    const crypto = require("crypto");
    const prefix = "HB";
    const timestamp = Date.now().toString().slice(-6);
    const random = crypto.randomBytes(4).toString("hex").toUpperCase();
    this.bookingReference = `${prefix}-${timestamp}-${random}`;
  }
  next();
});
// #endregion Hooks

// #region Indexes
// Common query patterns
HotelBookingSchema.index({ userId: 1, createdAt: -1 });
HotelBookingSchema.index({ hotelId: 1, checkInDate: 1 });
HotelBookingSchema.index({ hikeId: 1 });
// #endregion Indexes

// #region Exports
module.exports = mongoose.model("HotelBooking", HotelBookingSchema);
// #endregion Exports
