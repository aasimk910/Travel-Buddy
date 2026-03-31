// backend/models/RoomKey.js
// Mongoose schema for E2E encrypted room keys. Each document stores one participant's
// wrapped copy of the AES-256-GCM room key, encrypted via ECDH key agreement.

// #region Imports
const mongoose = require("mongoose");

// #endregion Imports
/**
 * Stores a per-user, per-room wrapped (encrypted) copy of the symmetric
 * AES-256-GCM room key.  The key material is encrypted client-side using
 * ECDH-derived wrapping, so the server never sees the plaintext room key.
 *
 * One document per (hikeId, userId) pair.
 */
const RoomKeySchema = new mongoose.Schema(
  {
    hikeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hike",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // AES room key encrypted with ECDH-derived wrapping key (base64)
    wrappedKey: { type: String, required: true },
    // AES-GCM IV used during wrapping (base64)
    iv: { type: String, required: true },
    // Distributor's public key JWK so the recipient can derive the same shared secret
    senderPublicKeyJwk: { type: String, required: true },
  },
  { timestamps: true }
);

// Unique: one wrapped-key entry per user per room
RoomKeySchema.index({ hikeId: 1, userId: 1 }, { unique: true });

// #region Exports
module.exports = mongoose.model("RoomKey", RoomKeySchema);
// #endregion Exports
