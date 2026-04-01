// backend/controllers/khaltiPaymentController.js
// Handles Khalti payment gateway integration for hotel bookings.
// Provides endpoints to initiate payments, verify transactions, and check payment status.

// #region Imports
const axios = require("axios");
const HotelBooking = require("../models/HotelBooking");

// #endregion Imports

// #region Config
const KHALTI_SECRET_KEY = process.env.KHALTI_SANDBOX_SECRET; // Khalti sandbox/live secret key
const KHALTI_API_URL = "https://dev.khalti.com/api/v2";      // Khalti sandbox API base URL
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
// #endregion Config

// #region Initiate Payment
// Initiates a Khalti payment for a hotel booking.
// Validates ownership, prevents double-payment, and redirects user to Khalti checkout.
const initiateHotelBookingPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;
    const userId = req.user._id;

    if (!bookingId) {
      return res.status(400).json({ message: "Booking ID is required" });
    }

    const booking = await HotelBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (booking.paymentStatus === "paid") {
      return res.status(400).json({ message: "Booking already paid" });
    }

    const amount = Math.round(booking.totalPrice * 100);
    const khaltiPayload = {
      return_url: `${FRONTEND_URL}/booking-confirmation?bookingId=${bookingId}`,
      website_url: FRONTEND_URL,
      amount,
      purchase_order_id: `HB-${bookingId}`,
      purchase_order_name: `Hotel Booking - ${booking.bookingReference || bookingId}`,
      customer_info: {
        name: booking.guestName || "Customer",
        email: booking.guestEmail || "customer@travelbuddy.app",
        phone: booking.guestPhone || "9800000000",
      },
    };

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

    booking.khaltiPaymentId = response.data.pidx;
    await booking.save();

    res.json({
      message: "Payment initiated successfully",
      payment_url: response.data.payment_url,
      pidx: response.data.pidx,
    });
  } catch (error) {
    console.error("Payment initiation error:", error);
    res.status(500).json({ message: "Failed to initiate payment", error: error.message });
  }
};
// #endregion Initiate Payment

// #region Verify Payment
// Verifies a completed Khalti payment by looking up the pidx.
// Updates booking status to confirmed and paymentStatus to paid on success.
const verifyHotelBookingPayment = async (req, res) => {
  try {
    const { pidx, transaction_id, booking_id } = req.body;
    const userId = req.user._id;

    if (!pidx || !booking_id) {
      return res.status(400).json({ message: "Missing required fields: pidx, booking_id" });
    }

    const booking = await HotelBooking.findById(booking_id);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

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

      if (paymentData.status === "Completed") {
        booking.paymentStatus = "paid";
        booking.status = "confirmed";
        booking.khaltiTransactionId = paymentData.transaction_id;
        booking.khaltiPidx = pidx;
        booking.notes = `Payment confirmed on ${new Date().toISOString()}`;
        await booking.save();

        return res.json({ message: "Payment verified successfully", booking, status: "success" });
      } else if (paymentData.status === "Pending") {
        return res.json({ message: "Payment is pending", status: "pending" });
      } else {
        return res.status(400).json({
          message: "Payment verification failed",
          status: "failed",
          paymentStatus: paymentData.status,
        });
      }
    } catch (khaltiError) {
      console.error("Khalti verification error:", khaltiError.response?.data || khaltiError.message);
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
};
// #endregion Verify Payment

// #region Payment Status
// Returns the current payment and booking status for a given booking ID.
const getPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    const booking = await HotelBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

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
};
// #endregion Payment Status

// #region Exports
module.exports = { initiateHotelBookingPayment, verifyHotelBookingPayment, getPaymentStatus };
// #endregion Exports
