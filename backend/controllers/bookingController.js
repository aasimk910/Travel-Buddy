// backend/controllers/bookingController.js
const HotelBooking = require("../models/HotelBooking");
const HotelPackage = require("../models/HotelPackage");
const Hotel = require("../models/Hotel");
const Hike = require("../models/Hike");
const User = require("../models/User");

const createBooking = async (req, res) => {
  try {
    const userId = req.user._id;
    const { hikeId, hotelId, packageId, checkInDate, checkOutDate, numberOfRooms, specialRequests } = req.body;

    if (!hikeId || !hotelId || !packageId || !checkInDate || !checkOutDate || !numberOfRooms) {
      return res.status(400).json({
        message: "Missing required fields: hikeId, hotelId, packageId, checkInDate, checkOutDate, numberOfRooms",
      });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const pkg = await HotelPackage.findById(packageId);
    if (!pkg) return res.status(404).json({ message: "Hotel package not found" });

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (hikeId) {
      const hike = await Hike.findById(hikeId).select("date");
      if (hike && hike.date && checkIn > new Date(hike.date)) {
        return res.status(400).json({ message: "Check-in date must be on or before the hike date" });
      }
    }

    if (checkIn >= checkOut) {
      return res.status(400).json({ message: "Check-in date must be before check-out date" });
    }

    const nightsValue = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    if (nightsValue < pkg.minStayNights) {
      return res.status(400).json({ message: `Minimum stay is ${pkg.minStayNights} night(s)` });
    }

    if (pkg.maxStayNights && nightsValue > pkg.maxStayNights) {
      return res.status(400).json({ message: `Maximum stay is ${pkg.maxStayNights} night(s)` });
    }

    if (numberOfRooms > pkg.availableRooms) {
      return res.status(400).json({ message: `Only ${pkg.availableRooms} room(s) available` });
    }

    const totalPrice = pkg.pricePerNight * numberOfRooms * nightsValue;

    const booking = new HotelBooking({
      userId,
      hikeId,
      hotelId,
      packageId,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      numberOfRooms,
      numberOfNights: nightsValue,
      pricePerNight: pkg.pricePerNight,
      totalPrice,
      currency: pkg.currency || "NPR",
      guestName: user.name,
      guestEmail: user.email,
      guestPhone: user.phone || undefined,
      specialRequests: specialRequests || "",
    });

    await booking.save();

    await HotelPackage.findByIdAndUpdate(packageId, { $inc: { availableRooms: -numberOfRooms } });

    await booking.populate([
      { path: "userId", select: "name email phone" },
      { path: "hotelId", select: "name location" },
      { path: "packageId", select: "name roomType pricePerNight" },
      { path: "hikeId", select: "title location" },
    ]);

    res.status(201).json({ message: "Booking created successfully", booking });
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({ message: "Unable to create booking" });
  }
};

const getUserBookings = async (req, res) => {
  try {
    const userId = req.user._id;
    const { status } = req.query;

    const query = { userId };
    if (status) query.status = status;

    const bookings = await HotelBooking.find(query)
      .populate([
        { path: "userId", select: "name email phone" },
        { path: "hotelId", select: "name location imageUrl" },
        { path: "packageId", select: "name roomType pricePerNight capacity" },
        { path: "hikeId", select: "title location date" },
      ])
      .sort({ createdAt: -1 });

    res.json({ bookings });
  } catch (err) {
    console.error("Fetch bookings error:", err);
    res.status(500).json({ message: "Unable to fetch bookings" });
  }
};

const getBookingById = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id;

    const booking = await HotelBooking.findById(bookingId).populate([
      { path: "userId", select: "name email phone" },
      { path: "hotelId", select: "name location description contactPhone email website imageUrl amenities" },
      { path: "packageId", select: "-__v" },
      { path: "hikeId", select: "title location date" },
    ]);

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.userId._id.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.json(booking);
  } catch (err) {
    console.error("Fetch booking error:", err);
    res.status(500).json({ message: "Unable to fetch booking" });
  }
};

const updateBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id;
    const { status, notes, specialRequests } = req.body;

    const booking = await HotelBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (status) {
      const current = booking.status;
      const allowed =
        (current === "pending" && (status === "confirmed" || status === "cancelled")) ||
        (current === "confirmed" && status === "cancelled");
      if (!allowed) {
        return res.status(400).json({ message: `Cannot transition booking from '${current}' to '${status}'.` });
      }
      booking.status = status;
    }

    if (notes !== undefined) booking.notes = notes;
    if (specialRequests !== undefined && booking.status === "pending") booking.specialRequests = specialRequests;

    await booking.save();

    await booking.populate([
      { path: "userId", select: "name email phone" },
      { path: "hotelId", select: "name location" },
      { path: "packageId", select: "name roomType pricePerNight" },
      { path: "hikeId", select: "title location" },
    ]);

    res.json({ message: "Booking updated successfully", booking });
  } catch (err) {
    console.error("Update booking error:", err);
    res.status(500).json({ message: "Unable to update booking" });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user._id;

    const booking = await HotelBooking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.userId.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    if (!["pending", "confirmed"].includes(booking.status)) {
      return res.status(400).json({ message: "Cannot cancel this booking" });
    }

    booking.status = "cancelled";
    await booking.save();

    await HotelPackage.findByIdAndUpdate(booking.packageId, { $inc: { availableRooms: booking.numberOfRooms } });

    res.json({ message: "Booking cancelled successfully", booking });
  } catch (err) {
    console.error("Cancel booking error:", err);
    res.status(500).json({ message: "Unable to cancel booking" });
  }
};

const getHotelBookings = async (req, res) => {
  try {
    const hotelId = req.params.hotelId;

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Admin access required" });
    }

    const bookings = await HotelBooking.find({ hotelId })
      .populate([
        { path: "userId", select: "name email phone" },
        { path: "hotelId", select: "name location" },
        { path: "packageId", select: "name roomType" },
        { path: "hikeId", select: "title" },
      ])
      .sort({ checkInDate: 1 });

    res.json({ bookings });
  } catch (err) {
    console.error("Fetch hotel bookings error:", err);
    res.status(500).json({ message: "Unable to fetch bookings" });
  }
};

module.exports = { createBooking, getUserBookings, getBookingById, updateBooking, cancelBooking, getHotelBookings };
