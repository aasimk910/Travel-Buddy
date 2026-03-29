// backend/routes/rooms.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const {
  getMyKey,
  storeRoomKeys,
  getParticipantsPublicKeys,
} = require("../controllers/roomController");

const router = express.Router();

router.get("/:hikeId/my-key", authenticateToken, getMyKey);
router.post("/:hikeId/keys", authenticateToken, storeRoomKeys);
router.get("/:hikeId/participants-public-keys", authenticateToken, getParticipantsPublicKeys);

module.exports = router;
