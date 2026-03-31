// backend/controllers/adminController.js
// Admin-only CRUD operations for managing users, hikes, hotels, packages,
// bookings, products, orders, and platform statistics.
// Also provides seed/clear endpoints for populating dev data.

// #region Imports
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Hike = require("../models/Hike");
const Hotel = require("../models/Hotel");
const HotelPackage = require("../models/HotelPackage");
const HotelBooking = require("../models/HotelBooking");
const Product = require("../models/Product");
const Order = require("../models/Order");
const Message = require("../models/Message");
const Expense = require("../models/Expense");
const Photo = require("../models/Photo");

// #endregion Imports
// ─── Users ────────────────────────────────────────────────────────────────────

// Handles listUsers logic.
const listUsers = async (req, res) => {
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
};

// Handles createUser logic.
const createUser = async (req, res) => {
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
    if (interests) userData.interests = Array.isArray(interests) ? interests.join(", ") : String(interests);
    const user = await User.create(userData);
    const { password: _pw, ...userOut } = user.toObject();
    res.status(201).json({ message: "User created.", user: userOut });
  } catch (err) {
    console.error("Admin create user error:", err);
    res.status(500).json({ message: "Unable to create user." });
  }
};

// Handles updateUser logic.
const updateUser = async (req, res) => {
  try {
    const { name, email, role, country, travelStyle, budgetRange, interests, avatarUrl } = req.body;
    if (!name || !email) return res.status(400).json({ message: "Name and email are required." });
    if (role && !["user", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be 'user' or 'admin'." });
    }
    if (role && req.params.id === req.user._id.toString() && role !== "admin") {
      return res.status(400).json({ message: "You cannot change your own role." });
    }
    const conflict = await User.findOne({ email, _id: { $ne: req.params.id } });
    if (conflict) return res.status(400).json({ message: "Email already in use." });

    const update = { name: name.trim(), email: email.trim() };
    if (role) update.role = role;
    if (country !== undefined) update.country = country.trim();
    if (travelStyle !== undefined) update.travelStyle = travelStyle.trim();
    if (budgetRange !== undefined) update.budgetRange = budgetRange.trim();
    if (avatarUrl !== undefined) update.avatarUrl = avatarUrl.trim();
    if (interests !== undefined) update.interests = Array.isArray(interests) ? interests.join(", ") : String(interests);

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found." });
    res.json({ message: "User updated.", user });
  } catch (err) {
    console.error("Admin update user error:", err);
    res.status(500).json({ message: "Unable to update user." });
  }
};

// Handles updateUserRole logic.
const updateUserRole = async (req, res) => {
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
};

// Handles deleteUser logic.
const deleteUser = async (req, res) => {
  try {
    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found." });
    await Promise.all([
      HotelBooking.deleteMany({ userId: req.params.id }),
      Photo.deleteMany({ userId: req.params.id }),
      Hike.updateMany({ participants: req.params.id }, { $pull: { participants: req.params.id } }),
    ]);
    res.json({ message: "User and related data deleted successfully." });
  } catch (err) {
    console.error("Admin delete user error:", err);
    res.status(500).json({ message: "Unable to delete user." });
  }
};

// ─── Hikes ────────────────────────────────────────────────────────────────────

// Handles listHikes logic.
const listHikes = async (req, res) => {
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
};

// Handles createHikeAdmin logic.
const createHikeAdmin = async (req, res) => {
  try {
    const { title, location, date, difficulty = 1, spotsLeft = 0, description, imageUrl, coordinates } = req.body;
    if (!title || !location || !date) {
      return res.status(400).json({ message: "Title, location and date are required." });
    }
    const hikeDate = new Date(date);
    if (isNaN(hikeDate.getTime())) return res.status(400).json({ message: "Invalid date." });
    const diff = Number(difficulty);
    if (isNaN(diff) || diff < 1 || diff > 5) return res.status(400).json({ message: "Difficulty must be 1–5." });

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
};

// Handles updateHikeAdmin logic.
const updateHikeAdmin = async (req, res) => {
  try {
    const { title, location, date, difficulty, spotsLeft, description, imageUrl, coordinates } = req.body;
    if (!title || !location || !date) {
      return res.status(400).json({ message: "Title, location and date are required." });
    }
    const hikeDate = new Date(date);
    if (isNaN(hikeDate.getTime())) return res.status(400).json({ message: "Invalid date." });
    const diff = Number(difficulty);
    if (isNaN(diff) || diff < 1 || diff > 5) return res.status(400).json({ message: "Difficulty must be 1–5." });

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
};

// Handles deleteHikeAdmin logic.
const deleteHikeAdmin = async (req, res) => {
  try {
    const hike = await Hike.findByIdAndDelete(req.params.id);
    if (!hike) return res.status(404).json({ message: "Hike not found." });
    await Promise.all([
      Message.deleteMany({ hikeId: req.params.id }),
      Expense.deleteMany({ hikeId: req.params.id }),
      HotelBooking.deleteMany({ hikeId: req.params.id }),
      Photo.deleteMany({ hikeId: req.params.id }),
    ]);
    res.json({ message: "Hike and related data deleted successfully." });
  } catch (err) {
    console.error("Admin delete hike error:", err);
    res.status(500).json({ message: "Unable to delete hike." });
  }
};

// Handles seedHikes logic.
const seedHikes = async (req, res) => {
  try {
    const existingHikes = await Hike.countDocuments();
    if (existingHikes > 0) {
      return res.status(400).json({ message: "Hikes already exist. Delete them first if you want to reseed.", count: existingHikes });
    }

    const hotels = await Hotel.find().select("_id location");
    const hotelMap = {};
    hotels.forEach((h) => { hotelMap[h.location.toLowerCase()] = h._id; });

    const dummyHikes = [
      { title: "Annapurna Base Camp Trek", location: "Annapurna Region", description: "A spectacular trek through the Annapurna region ending at the base camp.", difficulty: 4, spotsLeft: 8, date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), coordinates: { lat: 28.5355, lng: 83.8235 }, startPoint: { lat: 28.4345, lng: 83.9233 }, endPoint: { lat: 28.5355, lng: 83.8235 }, imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", hotelLocation: "annapurna region" },
      { title: "Nagarkot Sunrise Trek", location: "Kathmandu Valley", description: "A scenic day trek from Kathmandu to Nagarkot with views of the Himalayan range.", difficulty: 2, spotsLeft: 12, date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), coordinates: { lat: 27.6141, lng: 85.5245 }, startPoint: { lat: 27.7172, lng: 85.324 }, endPoint: { lat: 27.6141, lng: 85.5245 }, imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", hotelLocation: "kathmandu valley" },
      { title: "Phewa Lake Circumference Walk", location: "Pokhara", description: "A relaxing walk around the beautiful Phewa Lake.", difficulty: 1, spotsLeft: 15, date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), coordinates: { lat: 28.2096, lng: 83.9856 }, startPoint: { lat: 28.2096, lng: 83.9856 }, endPoint: { lat: 28.2096, lng: 83.9856 }, imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", hotelLocation: "pokhara" },
      { title: "Dhulikhel Historic Trail", location: "Kavre", description: "Explore the ancient city of Dhulikhel and its surrounding trails.", difficulty: 2, spotsLeft: 10, date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), coordinates: { lat: 27.6146, lng: 85.4181 }, startPoint: { lat: 27.6146, lng: 85.4181 }, endPoint: { lat: 27.6146, lng: 85.4181 }, imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", hotelLocation: "kavre" },
      { title: "Bandipur Village Trek", location: "Bandipur", description: "Trek through lush forests and experience the pristine village of Bandipur.", difficulty: 3, spotsLeft: 9, date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), coordinates: { lat: 27.887, lng: 84.444 }, startPoint: { lat: 27.887, lng: 84.444 }, endPoint: { lat: 27.887, lng: 84.444 }, imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop", hotelLocation: "bandipur" },
    ];

    const createdHikes = [];
    for (const hikeData of dummyHikes) {
      const { hotelLocation, ...hike } = hikeData;
      const newHike = new Hike({ ...hike, userId: req.user._id });
      const hotelId = hotelMap[hotelLocation];
      if (hotelId) newHike.hotels = [hotelId];
      await newHike.save();
      createdHikes.push(newHike);
    }

    res.status(201).json({
      message: `${createdHikes.length} dummy hikes seeded successfully!`,
      hikes: createdHikes.length,
      details: createdHikes.map((h) => ({ title: h.title, location: h.location, difficulty: h.difficulty, date: h.date, spotsLeft: h.spotsLeft, hotels: h.hotels.length })),
    });
  } catch (err) {
    console.error("Seed hikes error:", err);
    res.status(500).json({ message: "Unable to seed hikes.", error: err.message });
  }
};

// Handles clearHikes logic.
const clearHikes = async (req, res) => {
  try {
    const hikeCount = await Hike.countDocuments();
    await Hike.deleteMany({});
    res.json({ message: "All hikes cleared successfully!", deleted: hikeCount });
  } catch (err) {
    console.error("Clear hikes error:", err);
    res.status(500).json({ message: "Unable to clear hikes.", error: err.message });
  }
};

// ─── Hotels ───────────────────────────────────────────────────────────────────

// Handles listHotelsAdmin logic.
const listHotelsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = search
      ? { $or: [{ name: { $regex: search, $options: "i" } }, { location: { $regex: search, $options: "i" } }] }
      : {};
    const [hotels, total] = await Promise.all([
      Hotel.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Hotel.countDocuments(query),
    ]);
    res.json({ hotels, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error("Admin list hotels error:", err);
    res.status(500).json({ message: "Unable to fetch hotels." });
  }
};

// Handles getHotelAdmin logic.
const getHotelAdmin = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id).populate("packages");
    if (!hotel) return res.status(404).json({ message: "Hotel not found." });
    res.json(hotel);
  } catch (err) {
    console.error("Admin get hotel error:", err);
    res.status(500).json({ message: "Unable to fetch hotel." });
  }
};

// Handles createHotelAdmin logic.
const createHotelAdmin = async (req, res) => {
  try {
    const { name, location, description, contactPhone, email, website, imageUrl, rating, amenities, coordinates } = req.body;
    if (!name || !location) return res.status(400).json({ message: "Name and location are required." });
    const hotel = await Hotel.create({
      name: name.trim(), location: location.trim(), description: description?.trim(),
      contactPhone: contactPhone?.trim(), email: email?.trim(), website: website?.trim(),
      imageUrl: imageUrl?.trim(), rating: rating ? Number(rating) : 4.0, amenities: amenities || [],
      coordinates: coordinates?.lat && coordinates?.lng ? { lat: Number(coordinates.lat), lng: Number(coordinates.lng) } : undefined,
    });
    res.status(201).json({ message: "Hotel created.", hotel });
  } catch (err) {
    console.error("Admin create hotel error:", err);
    res.status(500).json({ message: "Unable to create hotel." });
  }
};

// Handles updateHotelAdmin logic.
const updateHotelAdmin = async (req, res) => {
  try {
    const { name, location, description, contactPhone, email, website, imageUrl, rating, amenities, coordinates } = req.body;
    if (!name || !location) return res.status(400).json({ message: "Name and location are required." });
    const update = {
      name: name.trim(), location: location.trim(), description: description?.trim(),
      contactPhone: contactPhone?.trim(), email: email?.trim(), website: website?.trim(),
      imageUrl: imageUrl?.trim(), rating: rating ? Number(rating) : undefined, amenities: amenities || [],
    };
    if (coordinates?.lat && coordinates?.lng) {
      update.coordinates = { lat: Number(coordinates.lat), lng: Number(coordinates.lng) };
    }
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!hotel) return res.status(404).json({ message: "Hotel not found." });
    res.json({ message: "Hotel updated.", hotel });
  } catch (err) {
    console.error("Admin update hotel error:", err);
    res.status(500).json({ message: "Unable to update hotel." });
  }
};

// Handles deleteHotelAdmin logic.
const deleteHotelAdmin = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);
    if (!hotel) return res.status(404).json({ message: "Hotel not found." });
    await Promise.all([
      HotelPackage.deleteMany({ hotelId: req.params.id }),
      HotelBooking.deleteMany({ hotelId: req.params.id }),
    ]);
    res.json({ message: "Hotel, packages, and related bookings deleted." });
  } catch (err) {
    console.error("Admin delete hotel error:", err);
    res.status(500).json({ message: "Unable to delete hotel." });
  }
};

// ─── Packages ─────────────────────────────────────────────────────────────────

// Handles listPackagesAdmin logic.
const listPackagesAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 15, search = "", hotelId = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    if (hotelId) query.hotelId = hotelId;
    if (search) query.$or = [{ name: { $regex: search, $options: "i" } }, { roomType: { $regex: search, $options: "i" } }];
    const [packages, total] = await Promise.all([
      HotelPackage.find(query).populate("hotelId", "name location").sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      HotelPackage.countDocuments(query),
    ]);
    res.json({ packages, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error("Admin list packages error:", err);
    res.status(500).json({ message: "Unable to fetch packages." });
  }
};

// Handles addPackageToHotel logic.
const addPackageToHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: "Hotel not found." });
    const { name, roomType, pricePerNight, capacity, amenities, availableRooms, minStayNights, maxStayNights, cancellationPolicy } = req.body;
    if (!name || !roomType || !pricePerNight) return res.status(400).json({ message: "Name, roomType and pricePerNight are required." });
    const pkg = await HotelPackage.create({
      hotelId: hotel._id, name: name.trim(), roomType, pricePerNight: Number(pricePerNight),
      capacity: Number(capacity) || 2, amenities: amenities || [],
      availableRooms: Number(availableRooms) || 5,
      minStayNights: Number(minStayNights) || 1,
      maxStayNights: maxStayNights ? Number(maxStayNights) : undefined,
      cancellationPolicy: cancellationPolicy || "free",
    });
    hotel.packages.push(pkg._id);
    await hotel.save();
    res.status(201).json({ message: "Package added.", package: pkg });
  } catch (err) {
    console.error("Admin add package error:", err);
    res.status(500).json({ message: "Unable to add package." });
  }
};

// Handles updatePackageAdmin logic.
const updatePackageAdmin = async (req, res) => {
  try {
    const { name, roomType, pricePerNight, capacity, amenities, availableRooms, minStayNights, maxStayNights, cancellationPolicy } = req.body;
    if (!name || !roomType || !pricePerNight) return res.status(400).json({ message: "Name, roomType and pricePerNight are required." });
    const pkg = await HotelPackage.findByIdAndUpdate(req.params.id, {
      name: name.trim(), roomType, pricePerNight: Number(pricePerNight),
      capacity: Number(capacity) || 2, amenities: amenities || [],
      availableRooms: Number(availableRooms) || 5,
      minStayNights: Number(minStayNights) || 1,
      maxStayNights: maxStayNights ? Number(maxStayNights) : undefined,
      cancellationPolicy: cancellationPolicy || "free",
    }, { new: true });
    if (!pkg) return res.status(404).json({ message: "Package not found." });
    res.json({ message: "Package updated.", package: pkg });
  } catch (err) {
    console.error("Admin update package error:", err);
    res.status(500).json({ message: "Unable to update package." });
  }
};

// Handles deletePackageAdmin logic.
const deletePackageAdmin = async (req, res) => {
  try {
    const pkg = await HotelPackage.findByIdAndDelete(req.params.id);
    if (!pkg) return res.status(404).json({ message: "Package not found." });
    await Hotel.updateOne({ packages: pkg._id }, { $pull: { packages: pkg._id } });
    res.json({ message: "Package deleted." });
  } catch (err) {
    console.error("Admin delete package error:", err);
    res.status(500).json({ message: "Unable to delete package." });
  }
};

// ─── Bookings ─────────────────────────────────────────────────────────────────

// Handles listBookingsAdmin logic.
const listBookingsAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "", status = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    if (status && status !== "all") query.status = status;
    if (search) {
      query.$or = [
        { bookingReference: { $regex: search, $options: "i" } },
        { guestName: { $regex: search, $options: "i" } },
        { guestEmail: { $regex: search, $options: "i" } },
      ];
    }
    const [bookings, total] = await Promise.all([
      HotelBooking.find(query).populate("userId", "name email").populate("hotelId", "name location").populate("packageId", "name roomType pricePerNight").sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      HotelBooking.countDocuments(query),
    ]);
    res.json({ bookings, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error("Admin list bookings error:", err);
    res.status(500).json({ message: "Unable to fetch bookings." });
  }
};

// Handles updateBookingStatusAdmin logic.
const updateBookingStatusAdmin = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    if (!status && !paymentStatus) return res.status(400).json({ message: "Provide status or paymentStatus." });
    if (status && !["pending", "confirmed", "cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value." });
    }
    if (paymentStatus && !["unpaid", "partial", "paid"].includes(paymentStatus)) {
      return res.status(400).json({ message: "Invalid paymentStatus value." });
    }
    const booking = await HotelBooking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    if (status === "cancelled" && booking.status !== "cancelled") {
      await HotelPackage.findByIdAndUpdate(booking.packageId, { $inc: { availableRooms: booking.numberOfRooms } });
    }
    if (status) booking.status = status;
    if (paymentStatus) booking.paymentStatus = paymentStatus;
    await booking.save();
    const updatedBooking = await HotelBooking.findById(req.params.id).populate("userId", "name email").populate("hotelId", "name location").populate("packageId", "name roomType pricePerNight");
    res.json({ message: "Booking updated.", booking: updatedBooking });
  } catch (err) {
    console.error("Admin update booking error:", err);
    res.status(500).json({ message: "Unable to update booking." });
  }
};

// Handles deleteBookingAdmin logic.
const deleteBookingAdmin = async (req, res) => {
  try {
    const booking = await HotelBooking.findByIdAndDelete(req.params.id);
    if (!booking) return res.status(404).json({ message: "Booking not found." });
    res.json({ message: "Booking deleted." });
  } catch (err) {
    console.error("Admin delete booking error:", err);
    res.status(500).json({ message: "Unable to delete booking." });
  }
};

// ─── Products ─────────────────────────────────────────────────────────────────

// Handles listProducts logic.
const listProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", category = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    if (search) query.name = { $regex: search, $options: "i" };
    if (category) query.category = category;
    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Product.countDocuments(query),
    ]);
    res.json({ products, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error("Admin list products error:", err);
    res.status(500).json({ message: "Unable to fetch products." });
  }
};

// Handles createProduct logic.
const createProduct = async (req, res) => {
  try {
    const { name, category, price, description, badge, img, images, inStock, featured } = req.body;
    if (!name || !category || price === undefined) {
      return res.status(400).json({ message: "Name, category, and price are required." });
    }
    const product = await Product.create({ name, category, price, description, badge: badge || null, img, images: images || [], inStock, featured });
    res.status(201).json({ message: "Product created.", product });
  } catch (err) {
    console.error("Admin create product error:", err);
    res.status(500).json({ message: "Unable to create product." });
  }
};

// Handles updateProduct logic.
const updateProduct = async (req, res) => {
  try {
    const { name, category, price, description, badge, img, images, inStock, featured } = req.body;
    if (!name || !category || price === undefined) {
      return res.status(400).json({ message: "Name, category, and price are required." });
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, category, price, description, badge: badge || null, img, images: images || [], inStock, featured },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json({ message: "Product updated.", product });
  } catch (err) {
    console.error("Admin update product error:", err);
    res.status(500).json({ message: "Unable to update product." });
  }
};

// Handles deleteProduct logic.
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json({ message: "Product deleted." });
  } catch (err) {
    console.error("Admin delete product error:", err);
    res.status(500).json({ message: "Unable to delete product." });
  }
};

// ─── Stats ────────────────────────────────────────────────────────────────────

// Handles getStats logic.
const getStats = async (req, res) => {
  try {
    const [totalUsers, totalAdmins, totalHikes, totalHotels, totalBookings, pendingBookings, totalProducts, totalOrders, pendingOrders] = await Promise.all([
      User.countDocuments({ role: { $ne: "admin" } }),
      User.countDocuments({ role: "admin" }),
      Hike.countDocuments(),
      Hotel.countDocuments(),
      HotelBooking.countDocuments(),
      HotelBooking.countDocuments({ status: "pending" }),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: "placed" }),
    ]);
    res.json({ totalUsers, totalAdmins, totalHikes, totalHotels, totalBookings, pendingBookings, totalProducts, totalOrders, pendingOrders });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ message: "Unable to fetch stats." });
  }
};

// ─── Seed / Clear Hotels ──────────────────────────────────────────────────────

// Handles seedHotels logic.
const seedHotels = async (req, res) => {
  try {
    const existingHotels = await Hotel.countDocuments();
    if (existingHotels > 0) {
      return res.status(400).json({ message: "Hotels already exist. Delete them first if you want to reseed.", count: existingHotels });
    }

    const dummyHotels = [
      { name: "Kathmandu Guest House", location: "Kathmandu Valley", coordinates: { lat: 27.7172, lng: 85.324 }, description: "Cozy guest house in the heart of Kathmandu with traditional Newari architecture.", contactPhone: "+977-1-4220123", email: "info@ktmguesthouse.com", website: "https://ktmguesthouse.com", imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop", rating: 4.5, reviewCount: 128, amenities: ["WiFi", "Restaurant", "Rooftop Terrace", "Laundry Service", "Tour Desk"] },
      { name: "Pokhara Lakeside Resort", location: "Pokhara", coordinates: { lat: 28.2096, lng: 83.9856 }, description: "Luxurious resort overlooking Phewa Lake with stunning mountain views.", contactPhone: "+977-61-542210", email: "reservations@pokharalake.com", website: "https://pokharalakeresort.com", imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop", rating: 4.8, reviewCount: 256, amenities: ["WiFi", "Pool", "Spa", "Lake View", "Restaurant", "Bar"] },
      { name: "Annapurna View Lodge", location: "Annapurna Region", coordinates: { lat: 28.5355, lng: 83.8235 }, description: "Traditional mountain lodge with authentic Himalayan hospitality.", contactPhone: "+977-66-420456", email: "stay@annapurnaview.com", website: "https://annapurnaviewlodge.com", imageUrl: "https://images.unsplash.com/photo-1542314503-37143f4f6c2f?w=400&h=300&fit=crop", rating: 4.6, reviewCount: 89, amenities: ["Fireplace", "Mountain View", "Restaurant", "Guides Available", "Parking"] },
      { name: "Dhulikhel Heritage Hotel", location: "Kavre", coordinates: { lat: 27.6146, lng: 85.4181 }, description: "Historic hotel preserving the charm of ancient Dhulikhel.", contactPhone: "+977-11-491789", email: "contact@dhulikhel-heritage.com", website: "https://dhulikhel-heritage.com", imageUrl: "https://images.unsplash.com/photo-1445991842772-097fea258e7b?w=400&h=300&fit=crop", rating: 4.3, reviewCount: 67, amenities: ["Museum", "WiFi", "Restaurant", "Garden", "Library"] },
      { name: "Sunlight Cottage", location: "Nagarkot", coordinates: { lat: 27.6141, lng: 85.5245 }, description: "Charming cottage with breathtaking sunrise views of the Himalayas.", contactPhone: "+977-1-6680222", email: "bookings@sunlightcottage.com", website: "https://sunlightcottage.com", imageUrl: "https://images.unsplash.com/photo-1445019973118-69c45dc3a1d8?w=400&h=300&fit=crop", rating: 4.7, reviewCount: 145, amenities: ["WiFi", "View Deck", "Restaurant", "Bonfire", "Star Gazing"] },
      { name: "Green Valley Eco Resort", location: "Bandipur", coordinates: { lat: 27.887, lng: 84.444 }, description: "Eco-friendly resort amidst lush forests.", contactPhone: "+977-76-520105", email: "eco@greenvalley.com", website: "https://greenvalleyecoresort.com", imageUrl: "https://images.unsplash.com/photo-1496441282967-81759f8ba6d4?w=400&h=300&fit=crop", rating: 4.4, reviewCount: 103, amenities: ["Organic Farm", "WiFi", "Yoga", "Nature Trails", "Restaurant"] },
    ];

    const packageTemplates = [
      { roomType: "single", name: "Single Economy", pricePerNight: 1500, capacity: 1, amenities: ["Shared Bathroom", "Fan"], availableRooms: 4 },
      { roomType: "double", name: "Double Comfort", pricePerNight: 2500, capacity: 2, amenities: ["Private Bathroom", "TV", "Hot Water"], availableRooms: 6, maxStayNights: 7 },
      { roomType: "suite", name: "Deluxe Suite", pricePerNight: 4500, capacity: 3, amenities: ["Private Bathroom", "TV", "Mini Bar", "AC"], availableRooms: 2, maxStayNights: 14 },
      { roomType: "double", name: "Lake View Room", pricePerNight: 5000, capacity: 2, amenities: ["Lake View", "Private Bathroom", "TV", "WiFi"], availableRooms: 8, maxStayNights: 10 },
      { roomType: "deluxe", name: "Premium Suite", pricePerNight: 8500, capacity: 2, amenities: ["Balcony", "Bath Tub", "Lake View", "WiFi", "AC"], availableRooms: 4, maxStayNights: 14 },
      { roomType: "suite", name: "Honeymoon Suite", pricePerNight: 12000, capacity: 2, amenities: ["Jacuzzi", "Balcony", "Lake View", "WiFi", "AC"], availableRooms: 2, minStayNights: 2 },
      { roomType: "double", name: "Standard Room", pricePerNight: 2000, capacity: 2, amenities: ["Mountain View", "Heater", "Attached Bathroom"], availableRooms: 6 },
      { roomType: "twin", name: "Twin Deluxe", pricePerNight: 3500, capacity: 2, amenities: ["Mountain View", "Own Bathroom", "Hot Shower"], availableRooms: 4, maxStayNights: 10 },
      { roomType: "double", name: "Classic Room", pricePerNight: 2200, capacity: 2, amenities: ["WiFi", "TV", "Hot Water"], availableRooms: 5 },
      { roomType: "suite", name: "Heritage Suite", pricePerNight: 4800, capacity: 3, amenities: ["Antique Decor", "WiFi", "TV", "Balcony"], availableRooms: 2 },
      { roomType: "double", name: "Sunrise Room", pricePerNight: 3800, capacity: 2, amenities: ["Window Seat", "Heater", "Attached Bathroom"], availableRooms: 3, maxStayNights: 7 },
      { roomType: "suite", name: "Panorama Suite", pricePerNight: 6500, capacity: 2, amenities: ["Full Window View", "Heating", "TV", "WiFi"], availableRooms: 1 },
      { roomType: "single", name: "Single Eco Room", pricePerNight: 1800, capacity: 1, amenities: ["Organic", "WiFi", "Eco-friendly"], availableRooms: 5 },
      { roomType: "double", name: "Double Green", pricePerNight: 3200, capacity: 2, amenities: ["Bamboo Furnish", "WiFi", "Farm Fresh Meals"], availableRooms: 6, maxStayNights: 7 },
    ];

    const createdHotels = [];
    let packageCount = 0;
    let packageIndex = 0;
    const packagesPerHotel = Math.ceil(packageTemplates.length / dummyHotels.length);

    for (const hotelData of dummyHotels) {
      const hotel = new Hotel(hotelData);
      await hotel.save();

      const hotelPackages = [];
      for (let i = 0; i < packagesPerHotel && packageIndex < packageTemplates.length; i++) {
        const pkgData = packageTemplates[packageIndex];
        const pkg = new HotelPackage({
          hotelId: hotel._id, name: pkgData.name, roomType: pkgData.roomType,
          pricePerNight: pkgData.pricePerNight, currency: "NPR",
          capacity: pkgData.capacity, amenities: pkgData.amenities,
          availableRooms: pkgData.availableRooms,
          maxStayNights: pkgData.maxStayNights,
          minStayNights: pkgData.minStayNights || 1,
          cancellationPolicy: ["free", "partial", "non-refundable"][Math.floor(Math.random() * 3)],
        });
        await pkg.save();
        hotelPackages.push(pkg._id);
        packageCount++;
        packageIndex++;
      }
      hotel.packages = hotelPackages;
      await hotel.save();
      createdHotels.push(hotel);
    }

    res.status(201).json({
      message: "Dummy hotels seeded successfully!",
      hotels: createdHotels.length,
      packages: packageCount,
      details: createdHotels.map((h) => ({ name: h.name, location: h.location, packages: h.packages.length })),
    });
  } catch (err) {
    console.error("Seed hotels error:", err);
    res.status(500).json({ message: "Unable to seed hotels.", error: err.message });
  }
};

// Handles clearHotels logic.
const clearHotels = async (req, res) => {
  try {
    const [hotelCount, packageCount] = await Promise.all([Hotel.countDocuments(), HotelPackage.countDocuments()]);
    await Promise.all([Hotel.deleteMany({}), HotelPackage.deleteMany({})]);
    res.json({ message: "All hotels and packages cleared successfully!", deleted: { hotels: hotelCount, packages: packageCount } });
  } catch (err) {
    console.error("Clear hotels error:", err);
    res.status(500).json({ message: "Unable to clear hotels.", error: err.message });
  }
};

// ─── Orders ───────────────────────────────────────────────────────────────────

// Handles createOrder logic.
const createOrder = async (req, res) => {
  try {
    const { orderId, items, customer, subtotal, shipping, total, paymentMethod } = req.body;
    if (!orderId || !items?.length || !customer || !total || !paymentMethod) {
      return res.status(400).json({ message: "Missing required order fields." });
    }
    const existing = await Order.findOne({ orderId });
    if (existing) return res.json({ order: existing }); // idempotent — same orderId → return existing
    const order = await Order.create({
      orderId,
      userId: req.user?._id || null,
      items,
      customer,
      subtotal,
      shipping: shipping || 0,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === "khalti" ? "paid" : "unpaid",
      status: "placed",
    });
    res.status(201).json({ order });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: "Unable to create order." });
  }
};

// Handles listOrders logic.
const listOrders = async (req, res) => {
  try {
    const { page = 1, limit = 15, search = "", status = "", paymentMethod = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { "customer.name": { $regex: search, $options: "i" } },
        { "customer.phone": { $regex: search, $options: "i" } },
        { "customer.city": { $regex: search, $options: "i" } },
      ];
    }
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Order.countDocuments(query),
    ]);
    res.json({ orders, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error("List orders error:", err);
    res.status(500).json({ message: "Unable to fetch orders." });
  }
};

// Handles updateOrderStatus logic.
const updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const update = {};
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json({ message: "Order updated.", order });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ message: "Unable to update order." });
  }
};

// Handles deleteOrder logic.
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json({ message: "Order deleted." });
  } catch (err) {
    console.error("Delete order error:", err);
    res.status(500).json({ message: "Unable to delete order." });
  }
};

// #region Exports
module.exports = {
// #endregion Exports
  listUsers, createUser, updateUser, updateUserRole, deleteUser,
  listHikes, createHikeAdmin, updateHikeAdmin, deleteHikeAdmin, seedHikes, clearHikes,
  listHotelsAdmin, getHotelAdmin, createHotelAdmin, updateHotelAdmin, deleteHotelAdmin,
  listPackagesAdmin, addPackageToHotel, updatePackageAdmin, deletePackageAdmin,
  listBookingsAdmin, updateBookingStatusAdmin, deleteBookingAdmin,
  listProducts, createProduct, updateProduct, deleteProduct,
  createOrder, listOrders, updateOrderStatus, deleteOrder,
  getStats, seedHotels, clearHotels,
};
