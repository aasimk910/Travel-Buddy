// backend/routes/trips.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { joinTrip } = require("../controllers/tripController");

const router = express.Router();

router.post("/:id/join", authenticateToken, joinTrip);

module.exports = router;
