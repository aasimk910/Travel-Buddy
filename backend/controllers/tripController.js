// backend/controllers/tripController.js
const Trip = require("../models/Trip");

const joinTrip = async (req, res) => {
  try {
    const tripId = req.params.id;
    const userId = req.user._id;

    // Atomic update: only add user if not already a participant and spots available.
    // Uses $expr to compare array length against maxTravelers field atomically.
    const trip = await Trip.findOneAndUpdate(
      {
        _id: tripId,
        participants: { $ne: userId },
        $expr: { $lt: [{ $size: { $ifNull: ["$participants", []] } }, "$maxTravelers"] },
      },
      { $push: { participants: userId } },
      { new: true }
    );

    if (!trip) {
      const existing = await Trip.findById(tripId).select("participants maxTravelers").lean();
      if (!existing) return res.status(404).json({ message: "Trip not found." });
      if (existing.participants?.some((p) => p.equals(userId))) {
        return res.status(400).json({ message: "You have already joined this trip." });
      }
      return res.status(400).json({ message: "This trip is full." });
    }

    res.json({ message: "Successfully joined the trip!", trip });
  } catch (err) {
    console.error("Join trip error:", err);
    res.status(500).json({ message: "Unable to join trip." });
  }
};

module.exports = { joinTrip };
