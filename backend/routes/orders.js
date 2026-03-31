// backend/routes/orders.js — public order placement endpoint
// #region Imports
const express = require("express");
// #endregion Imports
const router = express.Router();
const { createOrder } = require("../controllers/adminController");

// Optional auth middleware: attaches user if token present, but doesn't block unauthenticated requests
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Handles optionalAuth logic.
const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();
  try {
    const decoded = jwt.verify(header.slice(7), process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select("_id").lean();
    if (user) req.user = user;
  } catch {
    // Invalid token is non-fatal for optional auth
  }
  next();
};

// POST /api/orders — create order on checkout
router.post("/", optionalAuth, createOrder);

// GET /api/orders/mine — fetch orders for the logged-in user (status sync)
const { authenticateToken } = require("../middleware/auth");
const Order = require("../models/Order");
router.get("/mine", authenticateToken, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .select("orderId status paymentStatus createdAt")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ orders });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// #region Exports
module.exports = router;
// #endregion Exports
