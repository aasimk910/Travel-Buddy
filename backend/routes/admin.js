// backend/routes/admin.js
const express = require("express");
const { authenticateToken, adminOnly } = require("../middleware/auth");
const {
  listUsers,
  createUser,
  updateUser,
  updateUserRole,
  deleteUser,
  listHikes,
  createHikeAdmin,
  updateHikeAdmin,
  deleteHikeAdmin,
  seedHikes,
  clearHikes,
  listHotelsAdmin,
  getHotelAdmin,
  createHotelAdmin,
  updateHotelAdmin,
  deleteHotelAdmin,
  listPackagesAdmin,
  addPackageToHotel,
  updatePackageAdmin,
  deletePackageAdmin,
  listBookingsAdmin,
  updateBookingStatusAdmin,
  deleteBookingAdmin,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listOrders,
  updateOrderStatus,
  deleteOrder,
  getStats,
  seedHotels,
  clearHotels,
} = require("../controllers/adminController");

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticateToken, adminOnly);

// Users
router.get("/users", listUsers);
router.post("/users", createUser);
router.put("/users/:id", updateUser);
router.patch("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

// Hikes
router.get("/hikes", listHikes);
router.post("/hikes", createHikeAdmin);
router.put("/hikes/:id", updateHikeAdmin);
router.delete("/hikes/:id", deleteHikeAdmin);
router.post("/seed-hikes", seedHikes);
router.post("/clear-hikes", clearHikes);

// Hotels
router.get("/hotels", listHotelsAdmin);
router.get("/hotels/:id", getHotelAdmin);
router.post("/hotels", createHotelAdmin);
router.put("/hotels/:id", updateHotelAdmin);
router.delete("/hotels/:id", deleteHotelAdmin);

// Packages
router.get("/packages", listPackagesAdmin);
router.post("/hotels/:id/packages", addPackageToHotel);
router.put("/packages/:id", updatePackageAdmin);
router.delete("/packages/:id", deletePackageAdmin);

// Bookings
router.get("/bookings", listBookingsAdmin);
router.patch("/bookings/:id/status", updateBookingStatusAdmin);
router.delete("/bookings/:id", deleteBookingAdmin);

// Products
router.get("/products", listProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);

// Orders
router.get("/orders", listOrders);
router.patch("/orders/:id/status", updateOrderStatus);
router.delete("/orders/:id", deleteOrder);

// Stats & seed
router.get("/stats", getStats);
router.post("/seed-hotels", seedHotels);
router.post("/clear-hotels", clearHotels);

module.exports = router;
