// backend/routes/trips.js
// Trip join route. Uses atomic MongoDB operations for race-condition-safe joins.

// #region Imports
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { joinTrip } = require("../controllers/tripController");

// #endregion Imports
const router = express.Router();

// POST /api/trips/:id/join — join a trip (atomic capacity check)
router.post("/:id/join", authenticateToken, joinTrip);

// #region Exports
module.exports = router;
// #endregion Exports
