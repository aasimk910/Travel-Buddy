// backend/routes/messages.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { getMessages } = require("../controllers/messageController");

const router = express.Router();

// GET /api/messages/:hikeId — paginated chat history (cursor-based)
router.get("/:hikeId", authenticateToken, getMessages);

module.exports = router;
