// backend/routes/messages.js
// Chat message history routes. Requires authentication.
// Provides cursor-based pagination for loading older messages.

// #region Imports
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { getMessages } = require("../controllers/messageController");

// #endregion Imports
const router = express.Router();

// GET /api/messages/:hikeId — paginated chat history (cursor-based)
router.get("/:hikeId", authenticateToken, getMessages);

// #region Exports
module.exports = router;
// #endregion Exports
