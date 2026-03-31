// backend/controllers/messageController.js
// Provides paginated chat message history for hike group conversations.
// Uses cursor-based pagination (before ID) for efficient loading of older messages.

// #region Imports
const mongoose = require("mongoose");
const Message = require("../models/Message");

// #endregion Imports

// Returns paginated messages for a hike room.
// Supports cursor-based pagination via `before` query param (fetch messages older than a given ID).
// Returns messages in ascending order (oldest first) for chronological rendering.
const getMessages = async (req, res) => {
  try {
    const { hikeId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Cap at 100 messages per page
    const before = req.query.before; // Cursor — ID of the oldest loaded message

    // Validate cursor format if provided
    if (before && !mongoose.Types.ObjectId.isValid(before)) {
      return res.status(400).json({ message: "Invalid cursor value." });
    }

    const query = { hikeId };
    if (before) {
      query._id = { $lt: before }; // Only fetch messages older than cursor
    }

    // Fetch newest-first then reverse for chronological order
    const messages = await Message.find(query).sort({ _id: -1 }).limit(limit).lean();

    // Return in ascending order so the client renders oldest-first
    messages.reverse();

    res.json({ messages, hasMore: messages.length === limit });
  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ message: "Unable to fetch messages." });
  }
};

// #region Exports
module.exports = { getMessages };
// #endregion Exports
