// backend/routes/reviews.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { createContentLimiter } = require("../middleware/rateLimiter");
const {
  getReviews,
  getLatestReviews,
  createReview,
} = require("../controllers/reviewController");

const router = express.Router();

router.get("/", getReviews);
router.get("/latest", getLatestReviews);
router.post("/", authenticateToken, createContentLimiter, createReview);

module.exports = router;
