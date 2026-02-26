// backend/routes/admin.js
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Hike = require("../models/Hike");
const { authenticateToken, adminOnly } = require("../middleware/auth");

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticateToken, adminOnly);

// â”€â”€â”€ Users â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET /api/admin/users - List all users
router.get("/users", async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = search
      ? { $or: [{ name: { $regex: search, $options: "i" } }, { email: { $regex: search, $options: "i" } }] }
      : {};
    const [users, total] = await Promise.all([
      User.find(query).select("-password").sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query),
    ]);
    res.json({ users, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error("Admin list users error:", err);
    res.status(500).json({ message: "Unable to fetch users." });
  }
});

// POST /api/admin/users - Create a new user
router.post("/users", async (req, res) => {
  try {
    const { name, email, password, role = "user", country, travelStyle, budgetRange, interests, avatarUrl } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required." });
    }
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'user' or 'admin'." });
    }
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: "Email already registered." });

    const hashedPassword = await bcrypt.hash(password, 10);
    const userData = { name: name.trim(), email: email.trim(), password: hashedPassword, role, provider: "password" };
    if (country) userData.country = country.trim();
    if (travelStyle) userData.travelStyle = travelStyle.trim();
    if (budgetRange) userData.budgetRange = budgetRange.trim();
    if (avatarUrl) userData.avatarUrl = avatarUrl.trim();
    if (interests) userData.interests = Array.isArray(interests) ? interests : interests.split(",").map((s) => s.trim()).filter(Boolean);
    const user = await User.create(userData);
    const { password: _pw, ...userOut } = user.toObject();
    res.status(201).json({ message: "User created.", user: userOut });
  } catch (err) {
    console.error("Admin create user error:", err);
    res.status(500).json({ message: "Unable to create user." });
  }
});

// PUT /api/admin/users/:id - Update user details
router.put("/users/:id", async (req, res) => {
  try {
    const { name, email, role, country, travelStyle, budgetRange, interests, avatarUrl } = req.body;
    if (!name || !email) return res.status(400).json({ message: "Name and email are required." });
    if (role && !["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'user' or 'admin'." });
    }
    // Prevent self-demotion
    if (role && req.params.id === req.user._id.toString() && role !== "admin") {
      return res.status(400).json({ message: "You cannot change your own role." });
    }
    // Check email uniqueness
    const conflict = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (conflict) return res.status(400).json({ message: "Email already in use." });

    const update = { name: name.trim(), email: email.trim() };
    if (role) update.role = role;
    if (country !== undefined) update.country = country.trim();
    if (travelStyle !== undefined) update.travelStyle = travelStyle.trim();
    if (budgetRange !== undefined) update.budgetRange = budgetRange.trim();
    if (avatarUrl !== undefined) update.avatarUrl = avatarUrl.trim();
    if (interests !== undefined) update.interests = Array.isArray(interests) ? interests : interests.split(",").map((s) => s.trim()).filter(Boolean);

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ message: "User updated.", user });
  } catch (err) {
    console.error("Admin update user error:", err);
    res.status(500).json({ message: "Unable to update user." });
  }
});

// PATCH /api/admin/users/:id/role - Update role only
router.patch("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'user' or 'admin'." });
    }
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot change your own role." });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ message: `Role updated to '${role}'.`, user });
  } catch (err) {
    console.error("Admin update role error:", err);
    res.status(500).json({ message: "Unable to update role." });
  }
});

// DELETE /api/admin/users/:id - Delete a user
router.delete("/users/:id", async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ message: "User deleted successfully." });
  } catch (err) {
    console.error("Admin delete user error:", err);
    res.status(500).json({ message: "Unable to delete user." });
  }
});

// â”€â”€â”€ Hikes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET /api/admin/hikes - List all hikes
router.get("/hikes", async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = search
      ? { $or: [{ title: { $regex: search, $options: "i" } }, { location: { $regex: search, $options: "i" } }] }
      : {};
    const [hikes, total] = await Promise.all([
      Hike.find(query).populate("userId", "name email").populate("participants", "name email").sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Hike.countDocuments(query),
    ]);
    res.json({ hikes, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error("Admin list hikes error:", err);
    res.status(500).json({ message: "Unable to fetch hikes." });
  }
});

// POST /api/admin/hikes - Create a hike (admin as creator)
router.post("/hikes", async (req, res) => {
  try {
    const { title, location, date, difficulty = 1, spotsLeft = 0, description, imageUrl, coordinates } = req.body;
    if (!title || !location || !date) {
      return res.status(400).json({ message: "Title, location and date are required." });
    }
    const hikeDate = new Date(date);
    if (isNaN(hikeDate.getTime())) return res.status(400).json({ message: "Invalid date." });

    const diff = Number(difficulty);
    if (isNaN(diff) || diff < 1 || diff > 5) return res.status(400).json({ message: "Difficulty must be 1â€“5." });

    const hikeData = {
      userId: req.user._id,
      title: title.trim(),
      location: location.trim(),
      date: hikeDate,
      difficulty: diff,
      spotsLeft: Number(spotsLeft) || 0,
      description: description?.trim(),
    };
    if (imageUrl) hikeData.imageUrl = imageUrl.trim();
    if (coordinates?.lat && coordinates?.lng) {
      hikeData.coordinates = { lat: Number(coordinates.lat), lng: Number(coordinates.lng) };
    }
    const hike = await Hike.create(hikeData);
    res.status(201).json({ message: "Hike created.", hike });
  } catch (err) {
    console.error("Admin create hike error:", err);
    res.status(500).json({ message: "Unable to create hike." });
  }
});

// PUT /api/admin/hikes/:id - Update any hike
router.put("/hikes/:id", async (req, res) => {
  try {
    const { title, location, date, difficulty, spotsLeft, description, imageUrl, coordinates } = req.body;
    if (!title || !location || !date) {
      return res.status(400).json({ message: "Title, location and date are required." });
    }
    const hikeDate = new Date(date);
    if (isNaN(hikeDate.getTime())) return res.status(400).json({ message: "Invalid date." });

    const diff = Number(difficulty);
    if (isNaN(diff) || diff < 1 || diff > 5) return res.status(400).json({ message: "Difficulty must be 1â€“5." });

    const hikeUpdate = {
      title: title.trim(), location: location.trim(), date: hikeDate, difficulty: diff,
      spotsLeft: Number(spotsLeft) || 0, description: description?.trim(),
    };
    if (imageUrl !== undefined) hikeUpdate.imageUrl = imageUrl.trim();
    if (coordinates?.lat && coordinates?.lng) {
      hikeUpdate.coordinates = { lat: Number(coordinates.lat), lng: Number(coordinates.lng) };
    }
    const hike = await Hike.findByIdAndUpdate(req.params.id, hikeUpdate, { new: true });
    if (!hike) return res.status(404).json({ message: "Hike not found." });
    res.json({ message: "Hike updated.", hike });
  } catch (err) {
    console.error("Admin update hike error:", err);
    res.status(500).json({ message: "Unable to update hike." });
  }
});

// DELETE /api/admin/hikes/:id - Delete any hike
router.delete("/hikes/:id", async (req, res) => {
  try {
    const hike = await Hike.findByIdAndDelete(req.params.id);
    if (!hike) return res.status(404).json({ message: "Hike not found." });
    res.json({ message: "Hike deleted successfully." });
  } catch (err) {
    console.error("Admin delete hike error:", err);
    res.status(500).json({ message: "Unable to delete hike." });
  }
});

// â”€â”€â”€ Stats â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// GET /api/admin/stats - Dashboard stats
router.get("/stats", async (req, res) => {
  try {
    const [totalUsers, totalAdmins, totalHikes] = await Promise.all([
      User.countDocuments({ role: { $ne: "admin" } }),
      User.countDocuments({ role: "admin" }),
      Hike.countDocuments(),
    ]);
    res.json({ totalUsers, totalAdmins, totalHikes });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ message: "Unable to fetch stats." });
  }
});

module.exports = router;
