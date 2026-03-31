// backend/routes/khalti-payments.js
// Khalti payment routes for hotel bookings. All endpoints require JWT authentication.
// Handles payment initiation, verification, and status queries.

// #region Imports
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
// #endregion Imports
const {
  initiateHotelBookingPayment,
  verifyHotelBookingPayment,
  getPaymentStatus,
} = require("../controllers/khaltiPaymentController");

const router = express.Router();

// POST /api/payments/hotel-booking — initiate Khalti payment for a booking
router.post("/hotel-booking", authenticateToken, initiateHotelBookingPayment);
// POST /api/payments/khalti-verify — verify a completed Khalti payment
router.post("/khalti-verify", authenticateToken, verifyHotelBookingPayment);
// GET /api/payments/booking/:bookingId — check payment status for a booking
router.get("/booking/:bookingId", authenticateToken, getPaymentStatus);

// #region Exports
module.exports = router;
// #endregion Exports
