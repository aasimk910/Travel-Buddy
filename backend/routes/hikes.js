// backend/routes/hikes.js
// Hike routes: listing, recommendations, CRUD, and join/leave.
// Public: list all hikes, get hike by ID. Authenticated: recommendations, create, join, leave.

// #region Imports
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { createContentLimiter } = require("../middleware/rateLimiter");
// #endregion Imports
const {
  getHikes,
  getRecommendedHikes,
  getHikeById,
  createHike,
  joinHike,
  leaveHike,
  getUserTrips,
} = require("../controllers/hikeController");

const router = express.Router();

// GET /api/hikes — paginated list of all hikes (public)
router.get("/", getHikes);
// GET /api/hikes/recommended — AI-scored personalized recommendations (auth required)
router.get("/recommended", authenticateToken, getRecommendedHikes);
// GET /api/hikes/:id — single hike with participants and linked hotels (public)
router.get("/:id", getHikeById);
// POST /api/hikes — create a new hike (auth + rate-limited)
router.post("/", authenticateToken, createContentLimiter, createHike);
// POST /api/hikes/:id/join — join a hike as participant
router.post("/:id/join", authenticateToken, joinHike);
// POST /api/hikes/:id/leave — leave a hike
router.post("/:id/leave", authenticateToken, leaveHike);

// #region Exports
module.exports = router;

// #endregion Exports
