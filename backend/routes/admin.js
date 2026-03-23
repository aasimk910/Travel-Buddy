// backend/routes/admin.js
const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Hike = require("../models/Hike");
const Hotel = require("../models/Hotel");
const HotelPackage = require("../models/HotelPackage");
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
    if (interests) userData.interests = Array.isArray(interests) ? interests.join(", ") : String(interests);
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
    if (interests !== undefined) update.interests = Array.isArray(interests) ? interests.join(", ") : String(interests);

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

// ─── Hikes Seed ────────────────────────────────────────────────────────────

// POST /api/admin/seed-hikes - Create dummy hikes with hotels
router.post("/seed-hikes", async (req, res) => {
  try {
    // Check if hikes already exist
    const existingHikes = await Hike.countDocuments();
    if (existingHikes > 0) {
      return res.status(400).json({
        message: "Hikes already exist. Delete them first if you want to reseed.",
        count: existingHikes,
      });
    }

    // Get hotel IDs to link with hikes
    const hotels = await Hotel.find().select("_id location");
    const hotelMap = {};
    hotels.forEach(h => {
      hotelMap[h.location.toLowerCase()] = h._id;
    });

    const dummyHikes = [
      {
        title: "Annapurna Base Camp Trek",
        location: "Annapurna Region",
        description: "A spectacular trek through the Annapurna region ending at the base camp. Experience stunning views of the Annapurna massif and interact with local communities.",
        difficulty: 4,
        spotsLeft: 8,
        date: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000), // 45 days from now
        coordinates: { lat: 28.5355, lng: 83.8235 },
        startPoint: { lat: 28.4345, lng: 83.9233 },
        endPoint: { lat: 28.5355, lng: 83.8235 },
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
        hotelLocation: "annapurna region",
      },
      {
        title: "Nagarkot Sunrise Trek",
        location: "Kathmandu Valley",
        description: "A scenic day trek from Kathmandu to Nagarkot with views of the Himalayan range. Perfect for sunrise photography.",
        difficulty: 2,
        spotsLeft: 12,
        date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        coordinates: { lat: 27.6141, lng: 85.5245 },
        startPoint: { lat: 27.7172, lng: 85.324 },
        endPoint: { lat: 27.6141, lng: 85.5245 },
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
        hotelLocation: "kathmandu valley",
      },
      {
        title: "Phewa Lake Circumference Walk",
        location: "Pokhara",
        description: "A relaxing walk around the beautiful Phewa Lake with stunning views of the Annapurna range and lakeside villages.",
        difficulty: 1,
        spotsLeft: 15,
        date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        coordinates: { lat: 28.2096, lng: 83.9856 },
        startPoint: { lat: 28.2096, lng: 83.9856 },
        endPoint: { lat: 28.2096, lng: 83.9856 },
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
        hotelLocation: "pokhara",
      },
      {
        title: "Dhulikhel Historic Trail",
        location: "Kavre",
        description: "Explore the ancient city of Dhulikhel and its surrounding trails. A perfect blend of culture and nature.",
        difficulty: 2,
        spotsLeft: 10,
        date: new Date(Date.now() + 28 * 24 * 60 * 60 * 1000), // 28 days from now
        coordinates: { lat: 27.6146, lng: 85.4181 },
        startPoint: { lat: 27.6146, lng: 85.4181 },
        endPoint: { lat: 27.6146, lng: 85.4181 },
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
        hotelLocation: "kavre",
      },
      {
        title: "Bandipur Village Trek",
        location: "Bandipur",
        description: "Trek through lush forests and experience the pristine village of Bandipur. Great for eco-tourism enthusiasts.",
        difficulty: 3,
        spotsLeft: 9,
        date: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000), // 35 days from now
        coordinates: { lat: 27.887, lng: 84.444 },
        startPoint: { lat: 27.887, lng: 84.444 },
        endPoint: { lat: 27.887, lng: 84.444 },
        imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop",
        hotelLocation: "bandipur",
      },
    ];

    const createdHikes = [];
    for (const hikeData of dummyHikes) {
      const { hotelLocation, ...hike } = hikeData;
      const newHike = new Hike({
        ...hike,
        userId: req.user._id,
      });

      // Link hotel if available
      const hotelId = hotelMap[hotelLocation];
      if (hotelId) {
        newHike.hotels = [hotelId];
      }

      await newHike.save();
      createdHikes.push(newHike);
    }

    res.status(201).json({
      message: `${createdHikes.length} dummy hikes seeded successfully!`,
      hikes: createdHikes.length,
      details: createdHikes.map(h => ({
        title: h.title,
        location: h.location,
        difficulty: h.difficulty,
        date: h.date,
        spotsLeft: h.spotsLeft,
        hotels: h.hotels.length,
      })),
    });
  } catch (err) {
    console.error("Seed hikes error:", err);
    res.status(500).json({ message: "Unable to seed hikes.", error: err.message });
  }
});

// POST /api/admin/clear-hikes - Delete all hikes (for re-seeding)
router.post("/clear-hikes", async (req, res) => {
  try {
    const hikeCount = await Hike.countDocuments();
    await Hike.deleteMany({});

    res.json({
      message: "All hikes cleared successfully!",
      deleted: hikeCount,
    });
  } catch (err) {
    console.error("Clear hikes error:", err);
    res.status(500).json({ message: "Unable to clear hikes.", error: err.message });
  }
});

// ─── Stats ────────────────────────────────────────────────────────────────────

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

// ─── Hotels Seed ────────────────────────────────────────────────────────────

// POST /api/admin/seed-hotels - Create dummy hotels with packages
router.post("/seed-hotels", async (req, res) => {
  try {
    // Check if hotels already exist
    const existingHotels = await Hotel.countDocuments();
    if (existingHotels > 0) {
      return res.status(400).json({ 
        message: "Hotels already exist. Delete them first if you want to reseed.",
        count: existingHotels
      });
    }

    const dummyHotels = [
      {
        name: "Kathmandu Guest House",
        location: "Kathmandu Valley",
        coordinates: { lat: 27.7172, lng: 85.324 },
        description: "Cozy guest house in the heart of Kathmandu with traditional Newari architecture. Perfect base for exploring the valley.",
        contactPhone: "+977-1-4220123",
        email: "info@ktmguesthouse.com",
        website: "https://ktmguesthouse.com",
        imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=400&h=300&fit=crop",
        rating: 4.5,
        reviewCount: 128,
        amenities: ["WiFi", "Restaurant", "Rooftop Terrace", "Laundry Service", "Tour Desk"],
      },
      {
        name: "Pokhara Lakeside Resort",
        location: "Pokhara",
        coordinates: { lat: 28.2096, lng: 83.9856 },
        description: "Luxurious resort overlooking Phewa Lake with stunning mountain views. An ideal retreat for nature lovers.",
        contactPhone: "+977-61-542210",
        email: "reservations@pokharalake.com",
        website: "https://pokharalakeresort.com",
        imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
        rating: 4.8,
        reviewCount: 256,
        amenities: ["WiFi", "Pool", "Spa", "Lake View", "Restaurant", "Bar"],
      },
      {
        name: "Annapurna View Lodge",
        location: "Annapurna Region",
        coordinates: { lat: 28.5355, lng: 83.8235 },
        description: "Traditional mountain lodge with authentic Himalayan hospitality. Experience the Annapurna massif at its finest.",
        contactPhone: "+977-66-420456",
        email: "stay@annapurnaview.com",
        website: "https://annapurnaviewlodge.com",
        imageUrl: "https://images.unsplash.com/photo-1542314503-37143f4f6c2f?w=400&h=300&fit=crop",
        rating: 4.6,
        reviewCount: 89,
        amenities: ["Fireplace", "Mountain View", "Restaurant", "Guides Available", "Parking"],
      },
      {
        name: "Dhulikhel Heritage Hotel",
        location: "Kavre",
        coordinates: { lat: 27.6146, lng: 85.4181 },
        description: "Historic hotel preserving the charm of ancient Dhulikhel. Perfect for hikers and cultural enthusiasts.",
        contactPhone: "+977-11-491789",
        email: "contact@dhulikhel-heritage.com",
        website: "https://dhulikhel-heritage.com",
        imageUrl: "https://images.unsplash.com/photo-1445991842772-097fea258e7b?w=400&h=300&fit=crop",
        rating: 4.3,
        reviewCount: 67,
        amenities: ["Museum", "WiFi", "Restaurant", "Garden", "Library"],
      },
      {
        name: "Sunlight Cottage",
        location: "Nagarkot",
        coordinates: { lat: 27.6141, lng: 85.5245 },
        description: "Charming cottage with breathtaking sunrise views of the Himalayas. Great for couples and small groups.",
        contactPhone: "+977-1-6680222",
        email: "bookings@sunlightcottage.com",
        website: "https://sunlightcottage.com",
        imageUrl: "https://images.unsplash.com/photo-1445019973118-69c45dc3a1d8?w=400&h=300&fit=crop",
        rating: 4.7,
        reviewCount: 145,
        amenities: ["WiFi", "View Deck", "Restaurant", "Bonfire", "Star Gazing"],
      },
      {
        name: "Green Valley Eco Resort",
        location: "Bandipur",
        coordinates: { lat: 27.887, lng: 84.444 },
        description: "Eco-friendly resort amidst lush forests. Sustainable tourism at its best with local community engagement.",
        contactPhone: "+977-76-520105",
        email: "eco@greenvalley.com",
        website: "https://greenvalleyecoresort.com",
        imageUrl: "https://images.unsplash.com/photo-1496441282967-81759f8ba6d4?w=400&h=300&fit=crop",
        rating: 4.4,
        reviewCount: 103,
        amenities: ["Organic Farm", "WiFi", "Yoga", "Nature Trails", "Restaurant"],
      },
    ];

    const packages = [
      // Kathmandu Guest House packages
      { roomType: "single", name: "Single Economy", pricePerNight: 1500, capacity: 1, amenities: ["Shared Bathroom", "Fan"], availableRooms: 4 },
      { roomType: "double", name: "Double Comfort", pricePerNight: 2500, capacity: 2, amenities: ["Private Bathroom", "TV", "Hot Water"], availableRooms: 6, maxStayNights: 7 },
      { roomType: "suite", name: "Deluxe Suite", pricePerNight: 4500, capacity: 3, amenities: ["Private Bathroom", "TV", "Mini Bar", "AC"], availableRooms: 2, maxStayNights: 14 },

      // Pokhara Lakeside Resort packages
      { roomType: "double", name: "Lake View Room", pricePerNight: 5000, capacity: 2, amenities: ["Lake View", "Private Bathroom", "TV", "WiFi"], availableRooms: 8, maxStayNights: 10 },
      { roomType: "deluxe", name: "Premium Suite", pricePerNight: 8500, capacity: 2, amenities: ["Balcony", "Bath Tub", "Lake View", "WiFi", "AC"], availableRooms: 4, maxStayNights: 14 },
      { roomType: "suite", name: "Honeymoon Suite", pricePerNight: 12000, capacity: 2, amenities: ["Jacuzzi", "Balcony", "Lake View", "WiFi", "AC"], availableRooms: 2, minStayNights: 2 },

      // Annapurna View Lodge packages
      { roomType: "double", name: "Standard Room", pricePerNight: 2000, capacity: 2, amenities: ["Mountain View", "Heater", "Attached Bathroom"], availableRooms: 6 },
      { roomType: "twin", name: "Twin Deluxe", pricePerNight: 3500, capacity: 2, amenities: ["Mountain View", "Own Bathroom", "Hot Shower"], availableRooms: 4, maxStayNights: 10 },

      // Dhulikhel Heritage Hotel packages
      { roomType: "double", name: "Classic Room", pricePerNight: 2200, capacity: 2, amenities: ["WiFi", "TV", "Hot Water"], availableRooms: 5 },
      { roomType: "suite", name: "Heritage Suite", pricePerNight: 4800, capacity: 3, amenities: ["Antique Decor", "WiFi", "TV", "Balcony"], availableRooms: 2 },

      // Sunlight Cottage packages
      { roomType: "double", name: "Sunrise Room", pricePerNight: 3800, capacity: 2, amenities: ["Window Seat", "Heater", "Attached Bathroom"], availableRooms: 3, maxStayNights: 7 },
      { roomType: "suite", name: "Panorama Suite", pricePerNight: 6500, capacity: 2, amenities: ["Full Window View", "Heating", "TV", "WiFi"], availableRooms: 1 },

      // Green Valley Eco Resort packages
      { roomType: "single", name: "Single Eco Room", pricePerNight: 1800, capacity: 1, amenities: ["Organic", "WiFi", "Eco-friendly"], availableRooms: 5 },
      { roomType: "double", name: "Double Green", pricePerNight: 3200, capacity: 2, amenities: ["Bamboo Furnish", "WiFi", "Farm Fresh Meals"], availableRooms: 6, maxStayNights: 7 },
    ];

    const createdHotels = [];
    let packageCount = 0;
    let packageIndex = 0;

    for (const hotelData of dummyHotels) {
      const hotel = new Hotel(hotelData);
      await hotel.save();

      // Assign packages to hotels (3 packages per hotel on average)
      const packagesPerHotel = Math.ceil((packages.length / dummyHotels.length));
      const hotelPackages = [];

      for (let i = 0; i < packagesPerHotel && packageIndex < packages.length; i++) {
        const pkgData = packages[packageIndex];
        const pkg = new HotelPackage({
          hotelId: hotel._id,
          name: pkgData.name,
          roomType: pkgData.roomType,
          pricePerNight: pkgData.pricePerNight,
          currency: "NPR",
          capacity: pkgData.capacity,
          amenities: pkgData.amenities,
          availableRooms: pkgData.availableRooms,
          maxStayNights: pkgData.maxStayNights,
          minStayNights: 1,
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
      details: createdHotels.map(h => ({
        name: h.name,
        location: h.location,
        packages: h.packages.length,
      })),
    });
  } catch (err) {
    console.error("Seed hotels error:", err);
    res.status(500).json({ message: "Unable to seed hotels.", error: err.message });
  }
});

// POST /api/admin/clear-hotels - Delete all hotels and packages (for re-seeding)
router.post("/clear-hotels", async (req, res) => {
  try {
    const [hotelCount, packageCount] = await Promise.all([
      Hotel.countDocuments(),
      HotelPackage.countDocuments(),
    ]);

    await Promise.all([
      Hotel.deleteMany({}),
      HotelPackage.deleteMany({}),
    ]);

    res.json({
      message: "All hotels and packages cleared successfully!",
      deleted: { hotels: hotelCount, packages: packageCount },
    });
  } catch (err) {
    console.error("Clear hotels error:", err);
    res.status(500).json({ message: "Unable to clear hotels.", error: err.message });
  }
});

module.exports = router;
