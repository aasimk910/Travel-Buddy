const express = require("express");
const Trip = require("../models/Trip");

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

module.exports = router;

