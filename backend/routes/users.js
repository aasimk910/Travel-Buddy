// backend/routes/users.js
const express = require("express");
const User = require("../models/User");
const OnboardingProfile = require("../models/OnboardingProfile");
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
  onboardingCompleted: Boolean(user.onboardingCompleted),
  hikingProfile: user.hikingProfile || null,
});

// PUT /api/users/onboarding - Save first-login hiking preferences
router.put("/onboarding", authenticateToken, async (req, res) => {
  try {
    console.log("[Onboarding Endpoint] User:", req.user?.email, "Received payload:", JSON.stringify(req.body, null, 2));
    
    const {
      experienceLevel,
      fitnessLevel,
      preferredDifficulty,
      preferredRegion,
      preferredSeason,
      tripGoal,
      hikeDuration,
      groupPreference,
      maxBudgetPerDay,
      accommodationPreference,
      wantsGuide,
      medicalConsiderations,
    } = req.body;

    const allowedExperience = ["beginner", "intermediate", "advanced"];
    const allowedFitness = ["low", "medium", "high"];
    const allowedSeasons = ["spring", "summer", "autumn", "winter"];
    const allowedGoals = ["scenic", "challenge", "social", "photography"];
    const allowedDurations = ["half-day", "full-day", "multi-day"];
    const allowedGroups = ["solo", "small-group", "large-group"];
    const allowedAccommodation = ["basic", "comfortable", "luxury"];

    if (!allowedExperience.includes(experienceLevel)) {
      return res.status(400).json({ message: "Please choose a valid experience level." });
    }

    if (!allowedFitness.includes(fitnessLevel)) {
      return res.status(400).json({ message: "Please choose a valid fitness level." });
    }

    const difficultyNum = Number(preferredDifficulty);
    if (Number.isNaN(difficultyNum) || difficultyNum < 1 || difficultyNum > 5) {
      return res
        .status(400)
        .json({ message: "Preferred difficulty must be between 1 and 5." });
    }

    if (!preferredRegion || typeof preferredRegion !== "string") {
      return res.status(400).json({ message: "Preferred region is required." });
    }

    if (!allowedSeasons.includes(preferredSeason)) {
      return res.status(400).json({ message: "Please choose a valid preferred season." });
    }

    if (!allowedGoals.includes(tripGoal)) {
      return res.status(400).json({ message: "Please choose a valid trip goal." });
    }

    if (!allowedDurations.includes(hikeDuration)) {
      return res.status(400).json({ message: "Please choose a valid hike duration." });
    }

    if (!allowedGroups.includes(groupPreference)) {
      return res.status(400).json({ message: "Please choose a valid group preference." });
    }

    const budgetNum = Number(maxBudgetPerDay);
    if (Number.isNaN(budgetNum) || budgetNum < 0) {
      return res
        .status(400)
        .json({ message: "Maximum budget per day must be a non-negative number." });
    }

    if (!allowedAccommodation.includes(accommodationPreference)) {
      return res.status(400).json({ message: "Please choose a valid accommodation preference." });
    }

    if (typeof wantsGuide !== "boolean") {
      return res.status(400).json({ message: "Please choose whether you want a guide." });
    }

    if (medicalConsiderations && medicalConsiderations.length > 300) {
      return res
        .status(400)
        .json({ message: "Medical considerations must be 300 characters or less." });
    }

    const onboardingPayload = {
      experienceLevel,
      fitnessLevel,
      preferredDifficulty: difficultyNum,
      preferredRegion: preferredRegion.trim(),
      preferredSeason,
      tripGoal,
      hikeDuration,
      groupPreference,
      maxBudgetPerDay: budgetNum,
      accommodationPreference,
      wantsGuide,
      medicalConsiderations: medicalConsiderations?.trim() || "",
    };

    await OnboardingProfile.findOneAndUpdate(
      { userId: req.user._id },
      { userId: req.user._id, ...onboardingPayload },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    // Keep these fields on User for backward compatibility with existing frontend/auth flows.
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        onboardingCompleted: true,
        hikingProfile: onboardingPayload,
      },
      { new: true, runValidators: true }
    ).select("-password");

     console.log("[Onboarding Endpoint] After findByIdAndUpdate - Updated User ID:", updatedUser?._id);
     console.log("[Onboarding Endpoint] After findByIdAndUpdate - Updated User Email:", updatedUser?.email);
    if (!updatedUser) {
       console.error("[Onboarding Endpoint] CRITICAL: findByIdAndUpdate returned null!");
      return res.status(404).json({ message: "User not found." });
    }

    console.log("[Onboarding Endpoint] Successfully updated user:", req.user?.email);
    console.log("[Onboarding Endpoint] Saved hikingProfile:", JSON.stringify(updatedUser.hikingProfile, null, 2));
    console.log("[Onboarding Endpoint] Saved onboarding profile in separate collection for user:", req.user?._id);
    console.log("[Onboarding Endpoint] onboardingCompleted flag:", updatedUser.onboardingCompleted);

    return res.json({
      message: "Onboarding completed successfully.",
      user: buildUserResponse(updatedUser),
    });
  } catch (err) {
     console.error("[Onboarding Endpoint] FULL ERROR STACK:", err);
     console.error("[Onboarding Endpoint] Error message:", err.message);
     console.error("[Onboarding Endpoint] Error name:", err.name);
     return res.status(500).json({ message: "Unable to save onboarding preferences: " + err.message });
  }
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

