// backend/routes/orders.js — public order placement + user order history
// #region Imports
const express = require("express");
const { authenticateToken, optionalAuth } = require("../middleware/auth");
const { createOrder, getMyOrders } = require("../controllers/orderController");

// #endregion Imports
const router = express.Router();

// POST /api/orders — create order on checkout (guest or logged-in)
router.post("/", optionalAuth, createOrder);
// GET /api/orders/mine — fetch orders for the logged-in user
router.get("/mine", authenticateToken, getMyOrders);

// #region Exports
module.exports = router;
// #endregion Exports
