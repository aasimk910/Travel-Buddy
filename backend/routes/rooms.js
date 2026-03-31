// backend/routes/rooms.js
// E2E encrypted chat room key routes. All endpoints require authentication.
// Manages ECDH-wrapped AES room keys for secure group messaging.

// #region Imports
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
// #endregion Imports
const {
  getMyKey,
  storeRoomKeys,
  getParticipantsPublicKeys,
} = require("../controllers/roomController");

const router = express.Router();

// GET /api/rooms/:hikeId/my-key — get current user's wrapped room key
router.get("/:hikeId/my-key", authenticateToken, getMyKey);
// POST /api/rooms/:hikeId/keys — store wrapped keys for multiple participants
router.post("/:hikeId/keys", authenticateToken, storeRoomKeys);
// GET /api/rooms/:hikeId/participants-public-keys — get public keys for key wrapping
router.get("/:hikeId/participants-public-keys", authenticateToken, getParticipantsPublicKeys);

// #region Exports
module.exports = router;
// #endregion Exports
