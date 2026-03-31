// backend/routes/reviews.js
// Travel review routes. Public: browse reviews. Authenticated: submit new reviews.

// #region Imports
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { createContentLimiter } = require("../middleware/rateLimiter");
// #endregion Imports
const {
  getReviews,
  getLatestReviews,
  createReview,
} = require("../controllers/reviewController");

const router = express.Router();

// GET /api/reviews — list all reviews
router.get("/", getReviews);
// GET /api/reviews/latest — most recent N reviews (default 10)
router.get("/latest", getLatestReviews);
// POST /api/reviews — submit a new review (auth + rate-limited)
router.post("/", authenticateToken, createContentLimiter, createReview);

// #region Exports
module.exports = router;
// #endregion Exports
