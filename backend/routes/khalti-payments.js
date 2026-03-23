const express = require("express");
const axios = require("axios");
const HotelBooking = require("../models/HotelBooking");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

const KHALTI_SECRET_KEY = process.env.KHALTI_SANDBOX_SECRET;
const KHALTI_API_URL = "https://dev.khalti.com/api/v2";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

// POST /api/payments/hotel-booking - Initiate Khalti payment for hotel booking
router.post("/hotel-booking", authenticateToken, async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user._id;

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    // Get booking details
    const booking = await HotelBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify user owns this booking
    if (booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check if already paid
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({ message: "Booking already paid" });
    }

    // Prepare Khalti request
    const amount = Math.round(booking.totalPrice * 100); // Convert to paisa (Khalti uses paisa)
    
    const khaltiPayload = {
      return_url: `${FRONTEND_URL}/booking-confirmation?bookingId=${bookingId}`,
      website_url: FRONTEND_URL,
      amount: amount,
      purchase_order_id: `HB-${bookingId}`,
      purchase_order_name: `Hotel Booking - ${booking.bookingReference || bookingId}`,
      customer_info: {
        name: booking.guestName || "Customer",
        email: booking.guestEmail || "customer@travelbuddy.app",
        phone: booking.guestPhone || "9800000000",
      },
    };

    // Call Khalti to create payment
    const response = await axios.post(
      `${KHALTI_API_URL}/epayment/initiate/`,
      khaltiPayload,
      {
        headers: {
          Authorization: `Key ${KHALTI_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data || !response.data.payment_url) {
      console.error("Khalti API error:", response.data);
      return res.status(500).json({ message: "Failed to initiate payment" });
    }

    // Save payment ID to booking for verification later
    booking.khaltiPaymentId = response.data.pidx;
    await booking.save();

    res.json({
      message: "Payment initiated successfully",
      payment_url: response.data.payment_url,
      pidx: response.data.pidx,
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    res.status(500).json({
      message: "Failed to initiate payment",
      error: error.message,
    });
  }
});

// POST /api/payments/khalti-verify - Verify Khalti payment
router.post("/khalti-verify", async (req, res) => {
  try {
    const { pidx, transaction_id, booking_id } = req.body;

    if (!pidx || !booking_id) {
      return res.status(400).json({
        message: "Missing required fields: pidx, booking_id",
      });
    }

    // Get booking
    const booking = await HotelBooking.findById(booking_id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Verify payment with Khalti
    try {
      const verifyResponse = await axios.post(
        `${KHALTI_API_URL}/epayment/lookup/`,
        { pidx },
        {
          headers: {
            Authorization: `Key ${KHALTI_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      const paymentData = verifyResponse.data;

      // Check if payment is successful
      if (paymentData.status === "Completed") {
        // Update booking payment status
        booking.paymentStatus = "paid";
        booking.status = "confirmed";
        booking.khaltiTransactionId = paymentData.transaction_id;
        booking.khaltiPidx = pidx;
        booking.notes = `Payment confirmed on ${new Date().toISOString()}`;
        await booking.save();

        return res.json({
          message: "Payment verified successfully",
          booking,
          status: "success",
        });
      } else if (paymentData.status === "Pending") {
        return res.json({
          message: "Payment is pending",
          status: "pending",
        });
      } else {
        return res.status(400).json({
          message: "Payment verification failed",
          status: "failed",
          paymentStatus: paymentData.status,
        });
      }
    } catch (khaltiError) {
      console.error("Khalti verification error:", khaltiError.response?.data || khaltiError.message);
      
      // If verification fails but we can't confirm status, mark as pending
      booking.paymentStatus = "partial";
      await booking.save();

      return res.status(400).json({
        message: "Failed to verify payment with Khalti",
        error: khaltiError.response?.data?.message || khaltiError.message,
      });
    }
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({ message: "Payment verification failed" });
  }
});

// GET /api/payments/booking/:bookingId - Get payment status
router.get("/booking/:bookingId", authenticateToken, async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const userId = req.user._id;

    const booking = await HotelBooking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    // Check ownership
    if (booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json({
      bookingId: booking._id,
      paymentStatus: booking.paymentStatus,
      status: booking.status,
      totalPrice: booking.totalPrice,
      currency: booking.currency,
    });
  } catch (error) {
    console.error("Get payment status error:", error);
    res.status(500).json({ message: "Failed to get payment status" });
  }
});

module.exports = router;
