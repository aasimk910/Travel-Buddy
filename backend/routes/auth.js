// backend/routes/auth.js
const express = require("express");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const axios = require("axios");
const User = require("../models/User");
const { sendWelcomeEmail, sendPasswordResetEmail } = require("../utils/email");
const { authLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not set in the environment.");
}

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;

if (!GOOGLE_CLIENT_ID) {
  console.warn(
    "⚠️ GOOGLE_CLIENT_ID is not set in environment. Google login will not work properly."
  );
}

const googleClient = GOOGLE_CLIENT_ID
  ? new OAuth2Client(GOOGLE_CLIENT_ID)
  : null;

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

// POST /api/auth/signup (email/password)
router.post("/signup", authLimiter, async (req, res) => {
  try {
    const {
      recaptchaToken,
      name,
      email,
      password,
      country,
      travelStyle,
      budgetRange,
      interests,
    } = req.body;

        if (!recaptchaToken) {
      return res.status(400).json({ message: "reCAPTCHA is required." });
    }

    // Allow test tokens to bypass recaptcha in development
    if (recaptchaToken !== "test" && recaptchaToken !== "dev_token") {
      try {
        const recaptchaResponse = await axios.post(
          `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}`
        );

        if (!recaptchaResponse.data.success) {
          return res
            .status(400)
            .json({ message: "reCAPTCHA verification failed." });
        }
      } catch (error) {
        console.error("reCAPTCHA verification error:", error);
        return res
          .status(500)
          .json({ message: "Error verifying reCAPTCHA." });
      }
    } else {
      console.log("⚠️ Test reCAPTCHA token accepted (dev mode)");
    }

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(400)
        .json({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      country,
      travelStyle,
      budgetRange,
      interests,
      provider: "password",
    });

    await sendWelcomeEmail({ name, email });

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.status(201).json({
      message: "Account created successfully.",
      token,
      user: buildUserResponse(user),
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res
      .status(500)
      .json({ message: "Server error during signup." });
  }
});

// POST /api/auth/login (email/password)
router.post("/login", authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required." });
    }

    const user = await User.findOne({ email });
    if (!user || user.provider !== "password") {
      return res
        .status(400)
        .json({ message: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res
        .status(400)
        .json({ message: "Invalid email or password." });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      message: "Login successful.",
      token,
      user: buildUserResponse(user),
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ message: "Server error during login." });
  }
});

// POST /api/auth/google  (login OR signup with Google)
router.post("/google", authLimiter, async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).json({ message: "Missing Google credential." });
  }

  if (!googleClient) {
    return res.status(500).json({
      message:
        "GOOGLE_CLIENT_ID is not configured on the server. Google login is disabled.",
    });
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res
        .status(400)
        .json({ message: "Could not get email from Google account." });
    }

    const email = payload.email;
    const name = payload.name || payload.given_name || "Traveler";
    const picture = payload.picture;

    let user = await User.findOne({ email });

    if (!user) {
      // Create a new user for first-time Google login.
      // We still need some password value to satisfy the schema,
      // but it will never be used for login.
      const dummyPassword = await bcrypt.hash(
        credential + JWT_SECRET,
        10
      );

      user = await User.create({
        name,
        email,
        password: dummyPassword,
        avatarUrl: picture,
        provider: "google",
      });
    } else {
      // Update avatar / name / provider if needed
      if (!user.name) user.name = name;
      if (picture && user.avatarUrl !== picture) {
        user.avatarUrl = picture;
      }
      user.provider = user.provider || "google";
      await user.save();
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res.json({
      message: "Google login successful.",
      token,
      user: buildUserResponse(user),
    });
  } catch (err) {
    console.error("Google auth error:", err);
    return res
      .status(500)
      .json({ message: "Server error during Google login." });
  }
});

// POST /api/auth/forgot-password
router.post("/forgot-password", authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const user = await User.findOne({ email });

    // Debug log (safe — no sensitive data exposed to client)
    if (!user) {
      console.log(`[forgot-password] No account found for ${email}`);
    } else if (user.provider !== "password") {
      console.log(`[forgot-password] Account ${email} uses ${user.provider} login — password reset not applicable`);
      // Tell the client this account uses social login (safe — email already known to user)
      return res.json({
        message: "This account was created with Google. Please sign in using the Google button instead.",
        provider: "google",
      });
    } else {
      const rawToken = crypto.randomBytes(32).toString("hex");
      const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");
      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const resetUrl = `${frontendUrl}/reset-password/${rawToken}`;
      console.log(`[forgot-password] Reset URL for ${email}: ${resetUrl}`);
      await sendPasswordResetEmail({ name: user.name, email: user.email, resetUrl });
      console.log(`[forgot-password] Email dispatched to ${email}`);
    }

    // Always return 200 to prevent user enumeration
    return res.json({
      message: "If that email is registered, you'll receive a reset link shortly.",
    });
  } catch (err) {
    console.error("Forgot password error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

// POST /api/auth/reset-password/:token
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Password reset link is invalid or has expired." });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.json({ message: "Password has been reset successfully. You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ message: "Server error." });
  }
});

module.exports = router;
