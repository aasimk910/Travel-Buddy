// backend/routes/bookings.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const {
  createBooking,
  getUserBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  getHotelBookings,
} = require("../controllers/bookingController");

const router = express.Router();

router.post("/", authenticateToken, createBooking);
router.get("/", authenticateToken, getUserBookings);
router.get("/hotel/:hotelId", authenticateToken, getHotelBookings);
router.get("/:id", authenticateToken, getBookingById);
router.patch("/:id", authenticateToken, updateBooking);
router.delete("/:id", authenticateToken, cancelBooking);

module.exports = router;
