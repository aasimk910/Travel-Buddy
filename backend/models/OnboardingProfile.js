// backend/models/OnboardingProfile.js
// Mongoose schema for the hiking onboarding questionnaire profile.
// Stores preferences (experience, fitness, region, budget, etc.) used by the recommendation engine.
// One profile per user (unique userId index).

// #region Imports
const mongoose = require("mongoose");

// #endregion Imports

// #region Schema
const onboardingProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    experienceLevel: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    fitnessLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      required: true,
    },
    preferredDifficulty: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },
    preferredRegion: {
      type: String,
      required: true,
      trim: true,
    },
    preferredSeason: {
      type: String,
      enum: ["spring", "summer", "autumn", "winter"],
      required: true,
    },
    tripGoal: {
      type: String,
      enum: ["scenic", "challenge", "social", "photography"],
      required: true,
    },
    hikeDuration: {
      type: String,
      enum: ["half-day", "full-day", "multi-day"],
      required: true,
    },
    groupPreference: {
      type: String,
      enum: ["solo", "small-group", "large-group"],
      required: true,
    },
    maxBudgetPerDay: {
      type: Number,
      min: 0,
      required: true,
    },
    accommodationPreference: {
      type: String,
      enum: ["basic", "comfortable", "luxury"],
      required: true,
    },
    wantsGuide: {
      type: Boolean,
      required: true,
    },
    medicalConsiderations: {
      type: String,
      maxlength: 300,
      default: "",
    },
  },
  { timestamps: true }
);
// #endregion Schema

// #region Exports
module.exports = mongoose.model("OnboardingProfile", onboardingProfileSchema);
// #endregion Exports
