// backend/utils/userUtils.js
// Shared user utilities for building safe API response objects.

/**
 * Builds a sanitised user object safe to return in API responses.
 * Strips sensitive fields (password, __v, etc.).
 */
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

// #region Exports
module.exports = { buildUserResponse };
// #endregion Exports
