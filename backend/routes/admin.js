// backend/routes/admin.js
// Admin panel routes. All endpoints require JWT auth + admin role.
// Provides CRUD for users, hikes, hotels, packages, bookings, products, orders, and stats.

// #region Imports
const express = require("express");
const { authenticateToken, adminOnly } = require("../middleware/auth");
// #endregion Imports

// #region Controller Imports
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
// #endregion Controller Imports

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticateToken, adminOnly);

// #region User Routes
// --- Users CRUD ---
router.get("/users", listUsers);              // List all users (paginated, searchable)
router.post("/users", createUser);            // Create a new user
router.put("/users/:id", updateUser);         // Update user details
router.patch("/users/:id/role", updateUserRole); // Change a user's role (user/admin)
router.delete("/users/:id", deleteUser);      // Delete a user and their related data
// #endregion User Routes

// #region Hike Routes
// --- Hikes CRUD + Seeding ---
router.get("/hikes", listHikes);              // List all hikes (paginated)
router.post("/hikes", createHikeAdmin);       // Create a hike as admin
router.put("/hikes/:id", updateHikeAdmin);    // Update hike details
router.delete("/hikes/:id", deleteHikeAdmin); // Delete a hike and cascade
router.post("/seed-hikes", seedHikes);        // Seed dummy hikes into the DB
router.post("/clear-hikes", clearHikes);      // Delete all hikes
// #endregion Hike Routes

// #region Hotel Routes
// --- Hotels CRUD ---
router.get("/hotels", listHotelsAdmin);       // List hotels (paginated)
router.get("/hotels/:id", getHotelAdmin);     // Get hotel with packages
router.post("/hotels", createHotelAdmin);     // Create a hotel
router.put("/hotels/:id", updateHotelAdmin);  // Update hotel details
router.delete("/hotels/:id", deleteHotelAdmin); // Delete hotel + packages + bookings
// #endregion Hotel Routes

// #region Package Routes
// --- Packages CRUD ---
router.get("/packages", listPackagesAdmin);   // List all packages (filterable by hotel)
router.post("/hotels/:id/packages", addPackageToHotel); // Add a room package to hotel
router.put("/packages/:id", updatePackageAdmin);   // Update a package
router.delete("/packages/:id", deletePackageAdmin); // Delete a package
// #endregion Package Routes

// #region Booking Routes
// --- Bookings Management ---
router.get("/bookings", listBookingsAdmin);               // List bookings (paginated, filterable)
router.patch("/bookings/:id/status", updateBookingStatusAdmin); // Update booking/payment status
router.delete("/bookings/:id", deleteBookingAdmin);        // Delete a booking
// #endregion Booking Routes

// #region Product Routes
// --- Products CRUD ---
router.get("/products", listProducts);
router.post("/products", createProduct);
router.put("/products/:id", updateProduct);
router.delete("/products/:id", deleteProduct);
// #endregion Product Routes

// #region Order Routes
// --- Orders CRUD ---
router.get("/orders", listOrders);
router.patch("/orders/:id/status", updateOrderStatus);
router.delete("/orders/:id", deleteOrder);
// #endregion Order Routes

// #region Stats & Seed Routes
// --- Stats & seed ---
router.get("/stats", getStats);
router.post("/seed-hotels", seedHotels);
router.post("/clear-hotels", clearHotels);
// #endregion Stats & Seed Routes

// #region Exports
module.exports = router;
// #endregion Exports
