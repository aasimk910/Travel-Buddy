// backend/routes/photos.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const { createContentLimiter } = require("../middleware/rateLimiter");
const {
  getPhotos,
  getLatestPhotos,
  createPhoto,
  deletePhoto,
} = require("../controllers/photoController");

const router = express.Router();

router.get("/", getPhotos);
router.get("/latest", getLatestPhotos);
router.post("/", authenticateToken, createContentLimiter, createPhoto);
router.delete("/:id", authenticateToken, deletePhoto);

module.exports = router;
