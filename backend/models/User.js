// backend/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // Hashed password (not required for OAuth users)
    password: { type: String, required: false },

    // Optional travel profile fields
    country: { type: String },
    travelStyle: { type: String },
    budgetRange: { type: String },
    interests: { type: String },

    avatarUrl: { type: String },
    // E2E encryption: client-generated ECDH P-256 public key (JWK, stringified)
    publicKey: { type: String },
    provider: {
      type: String,
      enum: ["password", "google"],
      default: "password",
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    onboardingCompleted: {
      type: Boolean,
      default: false,
    },
    hikingProfile: {
      experienceLevel: {
        type: String,
        enum: ["beginner", "intermediate", "advanced"],
      },
      fitnessLevel: {
        type: String,
        enum: ["low", "medium", "high"],
      },
      preferredDifficulty: {
        type: Number,
        min: 1,
        max: 5,
      },
      preferredRegion: { type: String },
      preferredSeason: {
        type: String,
        enum: ["spring", "summer", "autumn", "winter"],
      },
      tripGoal: {
        type: String,
        enum: ["scenic", "challenge", "social", "photography"],
      },
      hikeDuration: {
        type: String,
        enum: ["half-day", "full-day", "multi-day"],
      },
      groupPreference: {
        type: String,
        enum: ["solo", "small-group", "large-group"],
      },
      maxBudgetPerDay: {
        type: Number,
        min: 0,
      },
      accommodationPreference: {
        type: String,
        enum: ["basic", "comfortable", "luxury"],
      },
      wantsGuide: {
        type: Boolean,
      },
      medicalConsiderations: {
        type: String,
        maxlength: 300,
      },
    },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
