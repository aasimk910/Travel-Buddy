// backend/controllers/orderController.js
// Order operations: create, list (admin), update status, delete, and user's own orders.

// #region Imports
const Order = require("../models/Order");

// #endregion Imports

// #region Create Order
// POST /api/orders — create order on checkout (public, optional auth)
const createOrder = async (req, res) => {
  try {
    const { orderId, items, customer, subtotal, shipping, total, paymentMethod } = req.body;
    if (!orderId || !items?.length || !customer || !total || !paymentMethod) {
      return res.status(400).json({ message: "Missing required order fields." });
    }
    const existing = await Order.findOne({ orderId });
    if (existing) return res.json({ order: existing }); // idempotent — same orderId → return existing
    const order = await Order.create({
      orderId,
      userId: req.user?._id || null,
      items,
      customer,
      subtotal,
      shipping: shipping || 0,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === "khalti" ? "paid" : "unpaid",
      status: "placed",
    });
    res.status(201).json({ order });
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: "Unable to create order." });
  }
};
// #endregion Create Order

// #region User Orders
// GET /api/orders/mine — fetch orders for the logged-in user
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id })
      .select("orderId status paymentStatus paymentMethod createdAt")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ orders });
  } catch (err) {
    console.error("Get my orders error:", err);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};
// #endregion User Orders

// #region Admin Orders
// GET /api/admin/orders — list all orders (admin, paginated)
const listOrders = async (req, res) => {
  try {
    const { page = 1, limit = 15, search = "", status = "", paymentMethod = "" } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const query = {};
    if (status) query.status = status;
    if (paymentMethod) query.paymentMethod = paymentMethod;
    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { "customer.name": { $regex: search, $options: "i" } },
        { "customer.phone": { $regex: search, $options: "i" } },
        { "customer.city": { $regex: search, $options: "i" } },
      ];
    }
    const [orders, total] = await Promise.all([
      Order.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)).lean(),
      Order.countDocuments(query),
    ]);
    res.json({ orders, pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / parseInt(limit)) } });
  } catch (err) {
    console.error("List orders error:", err);
    res.status(500).json({ message: "Unable to fetch orders." });
  }
};

// PATCH /api/admin/orders/:id/status — update order status
const updateOrderStatus = async (req, res) => {
  try {
    const { status, paymentStatus } = req.body;
    const update = {};
    if (status) update.status = status;
    if (paymentStatus) update.paymentStatus = paymentStatus;
    const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json({ message: "Order updated.", order });
  } catch (err) {
    console.error("Update order status error:", err);
    res.status(500).json({ message: "Unable to update order." });
  }
};

// DELETE /api/admin/orders/:id — delete an order
const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findByIdAndDelete(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found." });
    res.json({ message: "Order deleted." });
  } catch (err) {
    console.error("Delete order error:", err);
    res.status(500).json({ message: "Unable to delete order." });
  }
};
// #endregion Admin Orders

// #region Exports
module.exports = { createOrder, getMyOrders, listOrders, updateOrderStatus, deleteOrder };
// #endregion Exports
