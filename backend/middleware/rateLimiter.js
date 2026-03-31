// backend/middleware/rateLimiter.js
// Configures express-rate-limit instances for different endpoint categories.
// Limits are relaxed in development and strict in production.

// #region Imports
const rateLimit = require("express-rate-limit");

// #endregion Imports
const isDev = process.env.NODE_ENV !== "production";

// General API rate limiter — applied globally to /api/* routes.
// 100 requests per 15 min in production; 5000 in development.
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute sliding window
  max: isDev ? 5000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: "Too many requests from this IP, please try again later." });
  },
});

// Strict rate limiter for auth endpoints (login, signup, password reset).
// 10 requests per 15 min in production to prevent brute-force attacks.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15-minute sliding window
  max: isDev ? 500 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: "Too many authentication attempts, please try again later." });
  },
});

// Rate limiter for content creation endpoints (reviews, photos, etc.).
// 20 creations per hour in production to prevent spam.
const createContentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1-hour sliding window
  max: isDev ? 500 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({ error: "Too many content submissions, please try again later." });
  },
});

// #region Exports
module.exports = {
// #endregion Exports
  apiLimiter,
  authLimiter,
  createContentLimiter,
};


