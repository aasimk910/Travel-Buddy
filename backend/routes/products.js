// backend/routes/products.js — public read-only product listing (no auth required)
// #region Imports
const express = require("express");
const { listProducts } = require("../controllers/productController");

// #endregion Imports
const router = express.Router();

// GET /api/products?limit=100&page=1&search=...&category=...
router.get("/", listProducts);

// #region Exports
module.exports = router;
// #endregion Exports
