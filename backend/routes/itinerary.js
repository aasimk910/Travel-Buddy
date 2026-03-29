// backend/routes/itinerary.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { generateItinerary } = require("../controllers/itineraryController");

router.post("/generate", authenticateToken, generateItinerary);

module.exports = router;
