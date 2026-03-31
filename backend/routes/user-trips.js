// backend/routes/user-trips.js
// Returns hikes the authenticated user has joined. Used for the "My Trips" page.

// #region Imports
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { getUserTrips } = require("../controllers/hikeController");

// #endregion Imports
const router = express.Router();

// GET /api/user-trips — hikes the authenticated user has joined
router.get("/", authenticateToken, getUserTrips);

// #region Exports
module.exports = router;
// #endregion Exports
