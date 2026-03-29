// backend/routes/user-trips.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { getUserTrips } = require("../controllers/hikeController");

const router = express.Router();

// GET /api/user-trips — hikes the authenticated user has joined
router.get("/", authenticateToken, getUserTrips);

module.exports = router;
