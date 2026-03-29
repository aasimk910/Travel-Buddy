// backend/routes/users.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const {
  saveOnboarding,
  updateProfile,
  storePublicKey,
} = require("../controllers/userController");

const router = express.Router();

router.put("/onboarding", authenticateToken, saveOnboarding);
router.put("/profile", authenticateToken, updateProfile);
router.post("/public-key", authenticateToken, storePublicKey);

module.exports = router;
