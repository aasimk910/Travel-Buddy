// backend/routes/photos.js
// Photo gallery routes. Public: browse photos. Authenticated: upload and delete own photos.

// #region Imports
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { createContentLimiter } = require("../middleware/rateLimiter");
// #endregion Imports
const {
  getPhotos,
  getLatestPhotos,
  createPhoto,
  deletePhoto,
} = require("../controllers/photoController");

const router = express.Router();

// GET /api/photos — list all photos (optionally filtered by userName)
router.get("/", getPhotos);
// GET /api/photos/latest — paginated latest photos
router.get("/latest", getLatestPhotos);
// POST /api/photos — upload photo(s) to Cloudinary (auth + rate-limited)
router.post("/", authenticateToken, createContentLimiter, createPhoto);
// DELETE /api/photos/:id — delete own photo (removes from Cloudinary too)
router.delete("/:id", authenticateToken, deletePhoto);

// #region Exports
module.exports = router;
// #endregion Exports
