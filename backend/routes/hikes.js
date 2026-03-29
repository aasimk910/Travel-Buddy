// backend/routes/hikes.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { createContentLimiter } = require("../middleware/rateLimiter");
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

router.get("/", getHikes);
router.get("/recommended", authenticateToken, getRecommendedHikes);
router.get("/:id", getHikeById);
router.post("/", authenticateToken, createContentLimiter, createHike);
router.post("/:id/join", authenticateToken, joinHike);
router.post("/:id/leave", authenticateToken, leaveHike);

module.exports = router;

