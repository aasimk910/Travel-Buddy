// backend/routes/khalti-payments.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const {
  initiateHotelBookingPayment,
  verifyHotelBookingPayment,
  getPaymentStatus,
} = require("../controllers/khaltiPaymentController");

const router = express.Router();

router.post("/hotel-booking", authenticateToken, initiateHotelBookingPayment);
router.post("/khalti-verify", authenticateToken, verifyHotelBookingPayment);
router.get("/booking/:bookingId", authenticateToken, getPaymentStatus);

module.exports = router;
