// backend/models/Product.js
const mongoose = require("mongoose");

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

module.exports = mongoose.model("Product", productSchema);
