// backend/models/Product.js
// Mongoose schema for shop products (outdoor/travel gear). Categorized by type
// (Backpacks, Camping, etc.) with pricing, images, badge labels, and stock status.

// #region Imports
const mongoose = require("mongoose");

// #endregion Imports

// #region Schema
const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    category: {
      type: String,
      required: true,
      enum: ["Backpacks", "Camping", "Photography", "Footwear", "Navigation", "Safety"],
    },
    price: { type: Number, required: true, min: 0 },
    description: { type: String, default: "" },
    badge: { type: String, default: null }, // e.g. "Best Seller", "New", "Top Rated"
    img: { type: String, default: "" },      // primary image URL
    images: [{ type: String }],              // gallery image URLs
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviews: { type: Number, default: 0 },
    inStock: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
  },
  { timestamps: true }
);
// #endregion Schema

// #region Exports
module.exports = mongoose.model("Product", productSchema);
// #endregion Exports
