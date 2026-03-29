// backend/controllers/roomController.js
const mongoose = require("mongoose");
const RoomKey = require("../models/RoomKey");
const User = require("../models/User");
const Hike = require("../models/Hike");

const getMyKey = async (req, res) => {
  try {
    const { hikeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(hikeId)) {
      return res.status(400).json({ message: "Invalid hike ID." });
    }

    const entry = await RoomKey.findOne({ hikeId, userId: req.user._id });
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
};

const storeRoomKeys = async (req, res) => {
  try {
    const { hikeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(hikeId)) {
      return res.status(400).json({ message: "Invalid hike ID." });
    }

    const hike = await Hike.findById(hikeId).select("participants").lean();
    if (!hike) return res.status(404).json({ message: "Hike not found." });

    const participantIds = hike.participants.map((p) => p.toString());
    if (!participantIds.includes(req.user._id.toString())) {
      return res.status(403).json({ message: "You are not a participant of this hike." });
    }

    const { keys } = req.body;
    if (!Array.isArray(keys) || keys.length === 0) {
      return res.status(400).json({ message: "keys array is required." });
    }

    for (const k of keys) {
      if (!k.userId || !k.wrappedKey || !k.iv || !k.senderPublicKeyJwk) {
        return res.status(400).json({
          message: "Each key entry must have userId, wrappedKey, iv, senderPublicKeyJwk.",
        });
      }
      if (!mongoose.Types.ObjectId.isValid(k.userId)) {
        return res.status(400).json({ message: `Invalid userId: ${k.userId}` });
      }
    }

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
};

const getParticipantsPublicKeys = async (req, res) => {
  try {
    const { hikeId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(hikeId)) {
      return res.status(400).json({ message: "Invalid hike ID." });
    }

    const hike = await Hike.findById(hikeId);
    if (!hike) return res.status(404).json({ message: "Hike not found." });

    const userId = req.user._id.toString();
    const isParticipant =
      hike.participants.some((p) => p.toString() === userId) ||
      hike.userId?.toString() === userId;

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
};

module.exports = { getMyKey, storeRoomKeys, getParticipantsPublicKeys };
