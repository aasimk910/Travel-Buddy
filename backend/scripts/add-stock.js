// backend/scripts/add-stock.js
// One-off script: sets a random stock quantity (10–50) on every product that has stock = 0.
// Usage: node scripts/add-stock.js  (run from backend/)

const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const Product = require("../models/Product");

const MONGO_URI = process.env.MONGO_URI;
const MONGO_DB_NAME = process.env.MONGO_DB_NAME;

async function run() {
  try {
    const connectOptions = {};
    if (!MONGO_URI.includes("travelbuddy")) {
      connectOptions.dbName = MONGO_DB_NAME || "travelbuddy";
    }
    await mongoose.connect(MONGO_URI, connectOptions);
    console.log("✅ Connected to MongoDB");

    const products = await Product.find({ stock: { $lte: 0 } });
    console.log(`📦 Found ${products.length} product(s) with zero stock`);

    for (const product of products) {
      const stock = Math.floor(Math.random() * 41) + 10; // 10–50
      product.stock = stock;
      product.inStock = true;
      await product.save();
      console.log(`  ✔ "${product.name}" → stock set to ${stock}`);
    }

    console.log("✅ Done.");
  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

run();
