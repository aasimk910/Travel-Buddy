// backend/controllers/hotelController.js
// CRUD for hotels, hotel packages, and hotel-to-hike associations.
// Hotels contain packages (room types); packages can be linked to hikes.

// #region Imports
const Hotel = require("../models/Hotel");
const HotelPackage = require("../models/HotelPackage");
const Hike = require("../models/Hike");

// #endregion Imports

// #region Hotels
// Returns all hotels with their populated packages, newest first.
const getHotels = async (req, res) => {
  try {
    const hotels = await Hotel.find().populate("packages").sort({ createdAt: -1 });
    res.json(hotels);
  } catch (err) {
    console.error("Fetch hotels error:", err);
    res.status(500).json({ message: "Unable to fetch hotels." });
  }
};

// Returns a single hotel by ID with its packages.
const getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id).populate("packages");
    if (!hotel) return res.status(404).json({ message: "Hotel not found." });
    res.json(hotel);
  } catch (err) {
    console.error("Fetch hotel error:", err);
    res.status(500).json({ message: "Unable to fetch hotel." });
  }
};

// Creates a new hotel record. Name and location are required.
const createHotel = async (req, res) => {
  try {
    const { name, location, coordinates, description, contactPhone, email, website, imageUrl, amenities } = req.body;

    if (!name || !location) {
      return res.status(400).json({ message: "Name and location are required." });
    }

    const hotel = new Hotel({ name, location, coordinates, description, contactPhone, email, website, imageUrl, amenities: amenities || [] });
    await hotel.save();
    res.status(201).json(hotel);
  } catch (err) {
    console.error("Create hotel error:", err);
    res.status(500).json({ message: "Unable to create hotel." });
  }
};

// Updates an existing hotel. Only provided fields are overwritten (sparse update).
const updateHotel = async (req, res) => {
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

    if (!hotel) return res.status(404).json({ message: "Hotel not found." });
    res.json(hotel);
  } catch (err) {
    console.error("Update hotel error:", err);
    res.status(500).json({ message: "Unable to update hotel." });
  }
};

// Deletes a hotel and cascades: removes all its packages and unlinks from hikes.
const deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findByIdAndDelete(req.params.id);
    if (!hotel) return res.status(404).json({ message: "Hotel not found." });

    await HotelPackage.deleteMany({ hotelId: req.params.id });
    await Hike.updateMany({}, { $pull: { hotels: req.params.id } });

    res.json({ message: "Hotel deleted successfully." });
  } catch (err) {
    console.error("Delete hotel error:", err);
    res.status(500).json({ message: "Unable to delete hotel." });
  }
};
// #endregion Hotels

// #region Packages
// Creates a new room package under a specific hotel and links it to the hotel.
const createHotelPackage = async (req, res) => {
  try {
    const { name, description, roomType, pricePerNight, currency, capacity, amenities, image, availableRooms, maxStayNights, minStayNights, cancellationPolicy } = req.body;

    if (!name || !roomType || pricePerNight === undefined) {
      return res.status(400).json({ message: "Name, room type, and price are required." });
    }

    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) return res.status(404).json({ message: "Hotel not found." });

    const pkg = new HotelPackage({
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

    await pkg.save();
    hotel.packages.push(pkg._id);
    await hotel.save();

    res.status(201).json(pkg);
  } catch (err) {
    console.error("Create hotel package error:", err);
    res.status(500).json({ message: "Unable to create package." });
  }
};

// Returns all packages belonging to a hotel.
const getHotelPackages = async (req, res) => {
  try {
    const packages = await HotelPackage.find({ hotelId: req.params.id });
    res.json(packages);
  } catch (err) {
    console.error("Fetch packages error:", err);
    res.status(500).json({ message: "Unable to fetch packages." });
  }
};

// Updates a hotel package by ID.
const updateHotelPackage = async (req, res) => {
  try {
    const { name, description, roomType, pricePerNight, currency, capacity, amenities, image, availableRooms, maxStayNights, minStayNights, cancellationPolicy } = req.body;

    const pkg = await HotelPackage.findByIdAndUpdate(
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

    if (!pkg) return res.status(404).json({ message: "Package not found." });
    res.json(pkg);
  } catch (err) {
    console.error("Update package error:", err);
    res.status(500).json({ message: "Unable to update package." });
  }
};

// Deletes a hotel package and removes its reference from the parent hotel.
const deleteHotelPackage = async (req, res) => {
  try {
    const pkg = await HotelPackage.findByIdAndDelete(req.params.packageId);
    if (!pkg) return res.status(404).json({ message: "Package not found." });

    await Hotel.findByIdAndUpdate(pkg.hotelId, { $pull: { packages: req.params.packageId } });
    res.json({ message: "Package deleted successfully." });
  } catch (err) {
    console.error("Delete package error:", err);
    res.status(500).json({ message: "Unable to delete package." });
  }
};
// #endregion Packages

// #region Hike Associations
// Links a hotel to a hike using $addToSet (prevents duplicates).
const addHotelToHike = async (req, res) => {
  try {
    const { hikeId, hotelId } = req.params;
    const hike = await Hike.findByIdAndUpdate(
      hikeId,
      { $addToSet: { hotels: hotelId } },
      { new: true }
    ).populate("hotels");

    if (!hike) return res.status(404).json({ message: "Hike not found." });
    res.json(hike);
  } catch (err) {
    console.error("Add hotel to hike error:", err);
    res.status(500).json({ message: "Unable to add hotel to hike." });
  }
};

// Handles removeHotelFromHike logic.
const removeHotelFromHike = async (req, res) => {
  try {
    const { hikeId, hotelId } = req.params;
    const hike = await Hike.findByIdAndUpdate(
      hikeId,
      { $pull: { hotels: hotelId } },
      { new: true }
    ).populate("hotels");

    if (!hike) return res.status(404).json({ message: "Hike not found." });
    res.json(hike);
  } catch (err) {
    console.error("Remove hotel from hike error:", err);
    res.status(500).json({ message: "Unable to remove hotel from hike." });
  }
};
// #endregion Hike Associations

// #region Exports
module.exports = {
  getHotels,
  getHotelById,
  createHotel,
  updateHotel,
  deleteHotel,
  createHotelPackage,
  getHotelPackages,
  updateHotelPackage,
  deleteHotelPackage,
  addHotelToHike,
  removeHotelFromHike,
};
// #endregion Exports
