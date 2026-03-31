// backend/routes/stats.js
// Public statistics route. Returns platform-wide counts (hikes, users, photos, upcoming).

// #region Imports
const express = require("express");
const { getStats } = require("../controllers/statsController");

// #endregion Imports
const router = express.Router();

// GET /api/stats — public site-wide statistics
router.get("/", getStats);

// #region Exports
module.exports = router;
// #endregion Exports
