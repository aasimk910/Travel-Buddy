// backend/routes/hotels.js
const express = require("express");
const { authenticateToken, adminOnly } = require("../middleware/auth");
const { createContentLimiter } = require("../middleware/rateLimiter");
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

router.get("/", getHotels);
router.get("/:id", getHotelById);
router.post("/", authenticateToken, adminOnly, createContentLimiter, createHotel);
router.put("/:id", authenticateToken, adminOnly, createContentLimiter, updateHotel);
router.delete("/:id", authenticateToken, adminOnly, deleteHotel);
router.post("/:id/packages", authenticateToken, createContentLimiter, createHotelPackage);
router.get("/:id/packages", getHotelPackages);
router.put("/packages/:packageId", authenticateToken, createContentLimiter, updateHotelPackage);
router.delete("/packages/:packageId", authenticateToken, deleteHotelPackage);
router.post("/hikes/:hikeId/hotels/:hotelId", authenticateToken, addHotelToHike);
router.delete("/hikes/:hikeId/hotels/:hotelId", authenticateToken, removeHotelFromHike);

module.exports = router;
