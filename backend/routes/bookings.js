// backend/routes/bookings.js
// Hotel booking routes. All endpoints require JWT authentication.
// Covers booking creation, retrieval, update, and cancellation.

// #region Imports
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
// #endregion Imports
const {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  getHotelBookings,
} = require("../controllers/bookingController");

const router = express.Router();

// POST /api/bookings — create a new hotel booking
router.post("/", authenticateToken, createBooking);
// GET /api/bookings — list current user's bookings (optional status filter)
router.get("/", authenticateToken, getUserBookings);
// GET /api/bookings/hotel/:hotelId — list bookings for a specific hotel
router.get("/hotel/:hotelId", authenticateToken, getHotelBookings);
// GET /api/bookings/:id — get a single booking by ID (owner only)
router.get("/:id", authenticateToken, getBookingById);
// PATCH /api/bookings/:id — update booking status/notes
router.patch("/:id", authenticateToken, updateBooking);
// DELETE /api/bookings/:id — cancel a booking
router.delete("/:id", authenticateToken, cancelBooking);

// #region Exports
module.exports = router;
// #endregion Exports
