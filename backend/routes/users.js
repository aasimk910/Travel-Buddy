// backend/routes/users.js
const express = require("express");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// Helper to shape user object for frontend
const buildUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  country: user.country,
  travelStyle: user.travelStyle,
  budgetRange: user.budgetRange,
  interests: user.interests,
  avatarUrl: user.avatarUrl,
  provider: user.provider,
  role: user.role || "user",
});

// PUT /api/users/profile - Update user profile
router.put("/profile", authenticateToken, async (req, res) => {
  try {
    const { name, email, country, travelStyle, budgetRange, interests, avatarUrl } =
      req.body;

    if (!name || !email) {
      return res
        .status(400)
        .json({ message: "Name and email are required." });
    }

    // Check if email is being changed and if it's already taken
    if (email !== req.user.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ message: "Email is already registered." });
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        name: name.trim(),
        email: email.trim(),
        country: country?.trim() || undefined,
        travelStyle: travelStyle?.trim() || undefined,
        budgetRange: budgetRange?.trim() || undefined,
        interests: interests?.trim() || undefined,
        avatarUrl: avatarUrl || undefined,
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.json({
      message: "Profile updated successfully.",
      user: buildUserResponse(updatedUser),
    });
  } catch (err) {
    console.error("Update profile error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(err.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }
    return res
      .status(500)
      .json({ message: "Unable to update profile. Please try again." });
  }
});

// PUT /api/users/public-key - Store the user's ECDH public key for E2E encryption
router.put("/public-key", authenticateToken, async (req, res) => {
  try {
    const { publicKeyJwk } = req.body;
    if (!publicKeyJwk || typeof publicKeyJwk !== "object") {
      return res.status(400).json({ message: "publicKeyJwk is required." });
    }
    await User.findByIdAndUpdate(req.user._id, {
      publicKey: JSON.stringify(publicKeyJwk),
    });
    res.json({ message: "Public key stored." });
  } catch (err) {
    console.error("Store public key error:", err);
    res.status(500).json({ message: "Unable to store public key." });
  }
});

module.exports = router;

