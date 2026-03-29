// backend/controllers/messageController.js
const mongoose = require("mongoose");
const Message = require("../models/Message");

const getMessages = async (req, res) => {
  try {
    const { hikeId } = req.params;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before; // cursor — fetch messages older than this _id

    if (before && !mongoose.Types.ObjectId.isValid(before)) {
      return res.status(400).json({ message: "Invalid cursor value." });
    }

    const query = { hikeId };
    if (before) {
      query._id = { $lt: before };
    }

    const messages = await Message.find(query).sort({ _id: -1 }).limit(limit).lean();

    // Return in ascending order so the client renders oldest-first
    messages.reverse();

    res.json({ messages, hasMore: messages.length === limit });
  } catch (err) {
    console.error("Fetch messages error:", err);
    res.status(500).json({ message: "Unable to fetch messages." });
  }
};

module.exports = { getMessages };
