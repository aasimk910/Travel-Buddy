const express = require("express");
const Trip = require("../models/Trip");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const trips = await Trip.find().sort({ startDate: 1 });
    res.json(trips);
  } catch (err) {
    console.error("Fetch trips error:", err);
    res.status(500).json({ message: "Unable to fetch trips." });
  }
});

router.post("/", async (req, res) => {
  try {
    const {
      name,
      organizerName,
      destination,
      startDate,
      endDate,
      description,
      status,
      maxTravelers,
    } = req.body;

    if (!name || !organizerName || !destination || !startDate || !endDate) {
      return res.status(400).json({
        message:
          "name, organizerName, destination, startDate and endDate are required.",
      });
    }

    const trip = await Trip.create({
      name,
      organizerName,
      destination,
      startDate,
      endDate,
      description,
      status,
      maxTravelers,
    });

    res.status(201).json(trip);
  } catch (err) {
    console.error("Create trip error:", err);
    res.status(500).json({ message: "Unable to create trip." });
  }
});

// POST /api/trips/:id/join - Join a trip
router.post("/:id/join", authenticateToken, async (req, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user._id;

    const trip = await Trip.findById(tripId);
    if (!trip) {
      return res.status(404).json({ message: "Trip not found." });
    }

    // Check if user already joined
    if (trip.participants && trip.participants.some(p => p.equals(userId))) {
      return res.status(400).json({ message: "You have already joined this trip." });
    }

    // Check max travelers
    if (trip.participants && trip.participants.length >= trip.maxTravelers) {
      return res.status(400).json({ message: "This trip is full." });
    }

    // Add user to participants
    trip.participants = trip.participants || [];
    trip.participants.push(userId);
    await trip.save();

    res.json({ message: "Successfully joined the trip!", trip });
  } catch (err) {
    console.error("Join trip error:", err);
    res.status(500).json({ message: "Unable to join trip." });
  }
});

module.exports = router;

