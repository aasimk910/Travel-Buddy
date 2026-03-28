const express = require("express");
const Hotel = require("../models/Hotel");
const HotelPackage = require("../models/HotelPackage");
const Hike = require("../models/Hike");
const { authenticateToken, adminOnly } = require("../middleware/auth");
const { createContentLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// GET /api/hotels - Get all hotels
router.get("/", async (req, res) => {
  try {
    const hotels = await Hotel.find()
      .populate("packages")
      .sort({ createdAt: -1 });

    res.json(hotels);
  } catch (err) {
    console.error("Fetch hotels error:", err);
    res.status(500).json({ message: "Unable to fetch hotels." });
  }
});

// GET /api/hotels/:id - Get single hotel with packages
router.get("/:id", async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id)
      .populate("packages");

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found." });
    }

    res.json(hotel);
  } catch (err) {
    console.error("Fetch hotel error:", err);
    res.status(500).json({ message: "Unable to fetch hotel." });
  }
});

// POST /api/hotels - Create new hotel (admin only)
router.post("/", authenticateToken, adminOnly, createContentLimiter, async (req, res) => {
  try {
    const { name, location, coordinates, description, contactPhone, email, website, imageUrl, amenities } = req.body;

    if (!name || !location) {
      return res.status(400).json({ message: "Name and location are required." });
    }

    const hotel = new Hotel({
      name,
      location,
      coordinates,
      description,
      contactPhone,
      email,
      website,
      imageUrl,
      amenities: amenities || [],
    });

    await hotel.save();
    res.status(201).json(hotel);
  } catch (err) {
    console.error("Create hotel error:", err);
    res.status(500).json({ message: "Unable to create hotel." });
  }
});

// PUT /api/hotels/:id - Update hotel (admin only)
router.put("/:id", authenticateToken, adminOnly, createContentLimiter, async (req, res) => {
  try {
    const { name, location, coordinates, description, contactPhone, email, website, imageUrl, amenities, rating, reviewCount } = req.body;

    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(location && { location }),
        ...(coordinates && { coordinates }),
        ...(description && { description }),
        ...(contactPhone && { contactPhone }),
        ...(email && { email }),
        ...(website && { website }),
        ...(imageUrl && { imageUrl }),
        ...(amenities && { amenities }),
        ...(rating && { rating }),
        ...(reviewCount !== undefined && { reviewCount }),
      },
      { new: true }
    ).populate("packages");

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found." });
    }

    res.json(hotel);
  } catch (err) {
    console.error("Update hotel error:", err);
    res.status(500).json({ message: "Unable to update hotel." });
  }
});

// DELETE /api/hotels/:id - Delete hotel (admin only)
router.delete("/:id", authenticateToken, adminOnly, async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);

    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found." });
    }

    // Delete all packages for this hotel
    await HotelPackage.deleteMany({ hotelId: req.params.id });

    // Remove hotel from all hikes
    await Hike.updateMany({}, { $pull: { hotels: req.params.id } });

    res.json({ message: "Hotel deleted successfully." });
  } catch (err) {
    console.error("Delete hotel error:", err);
    res.status(500).json({ message: "Unable to delete hotel." });
  }
});

// POST /api/hotels/:id/packages - Create hotel package
router.post("/:id/packages", authenticateToken, createContentLimiter, async (req, res) => {
  try {
    const { name, description, roomType, pricePerNight, currency, capacity, amenities, image, availableRooms, maxStayNights, minStayNights, cancellationPolicy } = req.body;

    if (!name || !roomType || pricePerNight === undefined) {
      return res.status(400).json({ message: "Name, room type, and price are required." });
    }

    // Verify hotel exists
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found." });
    }

    const package_ = new HotelPackage({
      hotelId: req.params.id,
      name,
      description,
      roomType,
      pricePerNight,
      currency: currency || "NPR",
      capacity: capacity || 2,
      amenities: amenities || [],
      image,
      availableRooms: availableRooms || 5,
      maxStayNights,
      minStayNights: minStayNights || 1,
      cancellationPolicy: cancellationPolicy || "free",
    });

    await package_.save();

    // Add package to hotel's packages array
    hotel.packages.push(package_._id);
    await hotel.save();

    res.status(201).json(package_);
  } catch (err) {
    console.error("Create hotel package error:", err);
    res.status(500).json({ message: "Unable to create package." });
  }
});

// GET /api/hotels/:id/packages - Get all packages for a hotel
router.get("/:id/packages", async (req, res) => {
  try {
    const packages = await HotelPackage.find({ hotelId: req.params.id });
    res.json(packages);
  } catch (err) {
    console.error("Fetch packages error:", err);
    res.status(500).json({ message: "Unable to fetch packages." });
  }
});

// PUT /api/hotels/packages/:packageId - Update hotel package
router.put("/packages/:packageId", authenticateToken, createContentLimiter, async (req, res) => {
  try {
    const { name, description, roomType, pricePerNight, currency, capacity, amenities, image, availableRooms, maxStayNights, minStayNights, cancellationPolicy } = req.body;

    const package_ = await HotelPackage.findByIdAndUpdate(
      req.params.packageId,
      {
        ...(name && { name }),
        ...(description && { description }),
        ...(roomType && { roomType }),
        ...(pricePerNight !== undefined && { pricePerNight }),
        ...(currency && { currency }),
        ...(capacity && { capacity }),
        ...(amenities && { amenities }),
        ...(image && { image }),
        ...(availableRooms !== undefined && { availableRooms }),
        ...(maxStayNights && { maxStayNights }),
        ...(minStayNights && { minStayNights }),
        ...(cancellationPolicy && { cancellationPolicy }),
      },
      { new: true }
    );

    if (!package_) {
      return res.status(404).json({ message: "Package not found." });
    }

    res.json(package_);
  } catch (err) {
    console.error("Update package error:", err);
    res.status(500).json({ message: "Unable to update package." });
  }
});

// DELETE /api/hotels/packages/:packageId - Delete hotel package
router.delete("/packages/:packageId", authenticateToken, async (req, res) => {
  try {
    const package_ = await HotelPackage.findByIdAndDelete(req.params.packageId);

    if (!package_) {
      return res.status(404).json({ message: "Package not found." });
    }

    // Remove package from hotel's packages array
    await Hotel.findByIdAndUpdate(
      package_.hotelId,
      { $pull: { packages: req.params.packageId } }
    );

    res.json({ message: "Package deleted successfully." });
  } catch (err) {
    console.error("Delete package error:", err);
    res.status(500).json({ message: "Unable to delete package." });
  }
});

// POST /api/hikes/:hikeId/hotels/:hotelId - Add hotel to hike
router.post("/hikes/:hikeId/hotels/:hotelId", authenticateToken, async (req, res) => {
  try {
    const { hikeId, hotelId } = req.params;

    const hike = await Hike.findByIdAndUpdate(
      hikeId,
      { $addToSet: { hotels: hotelId } },
      { new: true }
    ).populate("hotels");

    if (!hike) {
      return res.status(404).json({ message: "Hike not found." });
    }

    res.json(hike);
  } catch (err) {
    console.error("Add hotel to hike error:", err);
    res.status(500).json({ message: "Unable to add hotel to hike." });
  }
});

// DELETE /api/hikes/:hikeId/hotels/:hotelId - Remove hotel from hike
router.delete("/hikes/:hikeId/hotels/:hotelId", authenticateToken, async (req, res) => {
  try {
    const { hikeId, hotelId } = req.params;

    const hike = await Hike.findByIdAndUpdate(
      hikeId,
      { $pull: { hotels: hotelId } },
      { new: true }
    ).populate("hotels");

    if (!hike) {
      return res.status(404).json({ message: "Hike not found." });
    }

    res.json(hike);
  } catch (err) {
    console.error("Remove hotel from hike error:", err);
    res.status(500).json({ message: "Unable to remove hotel from hike." });
  }
});

module.exports = router;
