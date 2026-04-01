// backend/controllers/productController.js
// Product operations: list (public + admin), create, update, delete.

// #region Imports
const Product = require("../models/Product");

// #endregion Imports

// GET /api/products — public product listing (paginated, searchable)
const listProducts = async (req, res) => {
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
};

// POST /api/admin/products — create a product (admin)
const createProduct = async (req, res) => {
  try {
    const { name, category, price, description, badge, img, images, inStock, featured } = req.body;
    if (!name || !category || price === undefined) {
      return res.status(400).json({ message: "Name, category, and price are required." });
    }
    const product = await Product.create({ name, category, price, description, badge: badge || null, img, images: images || [], inStock, featured });
    res.status(201).json({ message: "Product created.", product });
  } catch (err) {
    console.error("Create product error:", err);
    res.status(500).json({ message: "Unable to create product." });
  }
};

// PUT /api/admin/products/:id — update a product (admin)
const updateProduct = async (req, res) => {
  try {
    const { name, category, price, description, badge, img, images, inStock, featured } = req.body;
    if (!name || !category || price === undefined) {
      return res.status(400).json({ message: "Name, category, and price are required." });
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, category, price, description, badge: badge || null, img, images: images || [], inStock, featured },
      { new: true, runValidators: true }
    );
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json({ message: "Product updated.", product });
  } catch (err) {
    console.error("Update product error:", err);
    res.status(500).json({ message: "Unable to update product." });
  }
};

// DELETE /api/admin/products/:id — delete a product (admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found." });
    res.json({ message: "Product deleted." });
  } catch (err) {
    console.error("Delete product error:", err);
    res.status(500).json({ message: "Unable to delete product." });
  }
};

// #region Exports
module.exports = { listProducts, createProduct, updateProduct, deleteProduct };
// #endregion Exports
