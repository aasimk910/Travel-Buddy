// backend/routes/auth.js
// Authentication routes: signup, login, Google OAuth, and password reset.
// Auth endpoints are rate-limited to prevent brute-force attacks.

// #region Imports
const express = require("express");
const { authLimiter } = require("../middleware/rateLimiter");
// #endregion Imports
const {
  signup,
  login,
  googleAuth,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const router = express.Router();

// POST /api/auth/signup — register a new user with email/password (reCAPTCHA verified)
router.post("/signup", authLimiter, signup);
// POST /api/auth/login — authenticate with email/password, returns JWT
router.post("/login", authLimiter, login);
// POST /api/auth/google — authenticate via Google OAuth ID token
router.post("/google", authLimiter, googleAuth);
// POST /api/auth/forgot-password — sends a password reset email
router.post("/forgot-password", forgotPassword);
// POST /api/auth/reset-password/:token — resets password using the emailed token
router.post("/reset-password/:token", resetPassword);

// #region Exports
module.exports = router;
// #endregion Exports
