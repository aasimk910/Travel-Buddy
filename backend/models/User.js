// backend/models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    // Hashed password
    password: { type: String, required: true },

    // Optional travel profile fields
    country: { type: String },
    travelStyle: { type: String },
    budgetRange: { type: String },
    interests: { type: String },

    avatarUrl: { type: String },
    provider: {
      type: String,
      enum: ["password", "google"],
      default: "password",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
