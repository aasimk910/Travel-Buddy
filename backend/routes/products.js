// backend/routes/products.js  — public read-only product listing (no auth required)
const express = require("express");
const Product = require("../models/Product");

const router = express.Router();

// GET /api/products?limit=100&page=1&search=...&category=...
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, search = "", category = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    if (search) query.name = { $regex: search, $options: "i" };
    if (category) query.category = category;
    const [products, total] = await Promise.all([
      Product.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Product.countDocuments(query),
    ]);
    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("List products error:", err);
    res.status(500).json({ message: "Unable to fetch products." });
  }
});

module.exports = router;
