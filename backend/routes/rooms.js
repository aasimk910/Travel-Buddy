// backend/routes/rooms.js
/**
 * Room-key distribution endpoints for E2E encryption.
 *
 * All routes require authentication — the server stores and retrieves
 * opaque (encrypted) room-key blobs; it never has access to the plaintext
 * AES room key or the user's private key.
 */
const express = require("express");
const mongoose = require("mongoose");
const RoomKey = require("../models/RoomKey");
const User = require("../models/User");
const Hike = require("../models/Hike");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// ── GET /api/rooms/:hikeId/my-key ─────────────────────────────────────────
// Retrieve the wrapped room key stored for the authenticated user.
router.get("/:hikeId/my-key", authenticateToken, async (req, res) => {
  try {
    const { hikeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(hikeId)) {
      return res.status(400).json({ message: "Invalid hike ID." });
    }

    const entry = await RoomKey.findOne({
      hikeId,
      userId: req.user._id,
    });

    if (!entry) {
      return res.status(404).json({ message: "No room key found for this user." });
    }

    res.json({
      wrappedKey: entry.wrappedKey,
      iv: entry.iv,
      senderPublicKeyJwk: JSON.parse(entry.senderPublicKeyJwk),
    });
  } catch (err) {
    console.error("Get room key error:", err);
    res.status(500).json({ message: "Unable to fetch room key." });
  }
});

// ── POST /api/rooms/:hikeId/keys ──────────────────────────────────────────
// Store wrapped room-key entries for one or more participants.
// Body: { keys: [{ userId, wrappedKey, iv, senderPublicKeyJwk }] }
// The distributing client sends wrapped copies for each participant.
router.post("/:hikeId/keys", authenticateToken, async (req, res) => {
  try {
    const { hikeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(hikeId)) {
      return res.status(400).json({ message: "Invalid hike ID." });
    }

    const { keys } = req.body;
    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ message: "keys array is required." });
    }

    // Validate each entry
    for (const k of keys) {
      if (!k.userId || !k.wrappedKey || !k.iv || !k.senderPublicKeyJwk) {
        return res.status(400).json({ message: "Each key entry must have userId, wrappedKey, iv, senderPublicKeyJwk." });
      }
      if (!mongoose.Types.ObjectId.isValid(k.userId)) {
        return res.status(400).json({ message: `Invalid userId: ${k.userId}` });
      }
    }

    // Upsert all entries
    const ops = keys.map((k) => ({
      updateOne: {
        filter: { hikeId, userId: k.userId },
        update: {
          $set: {
            wrappedKey: k.wrappedKey,
            iv: k.iv,
            senderPublicKeyJwk: JSON.stringify(k.senderPublicKeyJwk),
          },
        },
        upsert: true,
      },
    }));

    await RoomKey.bulkWrite(ops);
    res.json({ message: "Room keys stored." });
  } catch (err) {
    console.error("Store room key error:", err);
    res.status(500).json({ message: "Unable to store room keys." });
  }
});

// ── GET /api/rooms/:hikeId/participants-public-keys ───────────────────────
// Return the public keys of all participants of a hike so the key
// distributor can wrap the room key for each of them.
// Only participants of the hike can call this.
router.get("/:hikeId/participants-public-keys", authenticateToken, async (req, res) => {
  try {
    const { hikeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(hikeId)) {
      return res.status(400).json({ message: "Invalid hike ID." });
    }

    const hike = await Hike.findById(hikeId);
    if (!hike) {
      return res.status(404).json({ message: "Hike not found." });
    }

    // Only hike participants (or the organiser) may fetch this list
    const userId = req.user._id.toString();
    const isParticipant =
      hike.participants.some((p) => p.toString() === userId) ||
      hike.organizerId?.toString() === userId;

    if (!isParticipant) {
      return res.status(403).json({ message: "You are not a participant of this hike." });
    }

    const participants = await User.find(
      { _id: { $in: hike.participants } },
      { _id: 1, name: 1, publicKey: 1 }
    );

    res.json(
      participants.map((u) => ({
        userId: u._id,
        name: u.name,
        publicKeyJwk: u.publicKey ? JSON.parse(u.publicKey) : null,
      }))
    );
  } catch (err) {
    console.error("Get participants public keys error:", err);
    res.status(500).json({ message: "Unable to fetch participant keys." });
  }
});

module.exports = router;
