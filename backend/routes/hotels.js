// backend/routes/hotels.js
// Hotel and package routes. Public: list/view hotels. Admin: create/update/delete.
// Also manages hotel-to-hike associations and room packages.

// #region Imports
const express = require("express");
const { authenticateToken, adminOnly } = require("../middleware/auth");
const { createContentLimiter } = require("../middleware/rateLimiter");
// #endregion Imports
const {
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
} = require("../controllers/hotelController");

const router = express.Router();

// GET /api/hotels — list all hotels with packages (public)
router.get("/", getHotels);
// GET /api/hotels/:id — single hotel with packages (public)
router.get("/:id", getHotelById);
// POST /api/hotels — create hotel (admin only, rate-limited)
router.post("/", authenticateToken, adminOnly, createContentLimiter, createHotel);
// PUT /api/hotels/:id — update hotel (admin only)
router.put("/:id", authenticateToken, adminOnly, createContentLimiter, updateHotel);
// DELETE /api/hotels/:id — delete hotel + cascading (admin only)
router.delete("/:id", authenticateToken, adminOnly, deleteHotel);
// POST /api/hotels/:id/packages — add a room package to a hotel
router.post("/:id/packages", authenticateToken, createContentLimiter, createHotelPackage);
// GET /api/hotels/:id/packages — list packages for a hotel (public)
router.get("/:id/packages", getHotelPackages);
// PUT /api/hotels/packages/:packageId — update a package
router.put("/packages/:packageId", authenticateToken, createContentLimiter, updateHotelPackage);
// DELETE /api/hotels/packages/:packageId — delete a package
router.delete("/packages/:packageId", authenticateToken, deleteHotelPackage);
// POST /api/hotels/hikes/:hikeId/hotels/:hotelId — link hotel to hike
router.post("/hikes/:hikeId/hotels/:hotelId", authenticateToken, addHotelToHike);
// DELETE /api/hotels/hikes/:hikeId/hotels/:hotelId — unlink hotel from hike
router.delete("/hikes/:hikeId/hotels/:hotelId", authenticateToken, removeHotelFromHike);

// #region Exports
module.exports = router;
// #endregion Exports
