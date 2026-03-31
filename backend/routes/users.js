// backend/routes/users.js
// User profile and onboarding routes. All endpoints require JWT authentication.

// #region Imports
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
// #endregion Imports
const {
  saveOnboarding,
  updateProfile,
  storePublicKey,
} = require("../controllers/userController");

const router = express.Router();

// PUT /api/users/onboarding — save hiking preference questionnaire
router.put("/onboarding", authenticateToken, saveOnboarding);
// PUT /api/users/profile — update basic profile fields (name, email, etc.)
router.put("/profile", authenticateToken, updateProfile);
// POST /api/users/public-key — store ECDH public key for E2E chat encryption
router.post("/public-key", authenticateToken, storePublicKey);

// #region Exports
module.exports = router;
// #endregion Exports
