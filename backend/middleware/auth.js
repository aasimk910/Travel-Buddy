// backend/middleware/auth.js
// Express middleware for JWT authentication and role-based access control.
// authenticateToken — verifies the Bearer token and attaches req.user.
// adminOnly — restricts access to users with role "admin".

// #region Imports
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// #endregion Imports

// #region Config
// JWT secret — required at startup; crashes immediately if missing
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in the environment.");
}
// #endregion Config

// #region authenticateToken
// Verifies the JWT from the Authorization header and loads the user document.
// Attaches the user (minus password) to req.user for downstream handlers.
// Returns 401 for missing/invalid/expired tokens, 500 for unexpected errors.
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Extract token from "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({ message: "Authentication required. Please log in." });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    // .lean() returns a plain JS object instead of a Mongoose document,
    // which is ~2-3x faster and avoids hydration overhead on every request.
    const user = await User.findById(decoded.userId).select("-password").lean();

    if (!user) {
      return res.status(401).json({ message: "User not found." });
    }

    req.user = user;
    next();
  } catch (err) {
    // Differentiate JWT-specific errors for clearer client messages
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token." });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please log in again." });
    }
    console.error("Auth middleware error:", err);
    return res.status(500).json({ message: "Authentication error." });
  }
};
// #endregion authenticateToken

// #region adminOnly
// Role gate: only allows requests from admin users.
// Must be used after authenticateToken so req.user is available.
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};
// #endregion adminOnly

// #region optionalAuth
// Optional auth: attaches user if token is present, but doesn't block unauthenticated requests.
// Use for endpoints that work for both guests and logged-in users.
const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next();
  try {
    const decoded = jwt.verify(header.slice(7), JWT_SECRET);
    const user = await User.findById(decoded.userId).select("_id").lean();
    if (user) req.user = user;
  } catch {
    // Invalid token is non-fatal for optional auth
  }
  next();
};
// #endregion optionalAuth

// #region Exports
module.exports = { authenticateToken, adminOnly, optionalAuth };
// #endregion Exports
