// backend/routes/itinerary.js
// AI-powered itinerary generation route. Requires authentication.
// Uses Groq LLM API when available; falls back to a demo itinerary.

// #region Imports
const express = require("express");
// #endregion Imports
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { generateItinerary } = require("../controllers/itineraryController");

// POST /api/itinerary/generate — generate a travel itinerary from trip parameters or custom prompt
router.post("/generate", authenticateToken, generateItinerary);

// #region Exports
module.exports = router;
// #endregion Exports
