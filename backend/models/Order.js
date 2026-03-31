// backend/models/Order.js
// Mongoose schema for shop orders. Tracks order items, customer details, pricing,
// payment method (COD/Khalti), payment status, and fulfillment status lifecycle.

// #region Imports
const mongoose = require("mongoose");

// #endregion Imports
const orderItemSchema = new mongoose.Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    category: { type: String, default: "" },
    price: { type: Number, required: true },
    qty: { type: Number, required: true, min: 1 },
    img: { type: String, default: "" },
  },
  { _id: false }
);

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String, default: "" },
    address: { type: String, required: true },
    city: { type: String, required: true },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    items: [orderItemSchema],
    customer: customerSchema,
    subtotal: { type: Number, required: true },
    shipping: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: { type: String, enum: ["cod", "khalti"], required: true },
    paymentStatus: { type: String, enum: ["unpaid", "paid"], default: "unpaid" },
    status: {
      type: String,
      enum: ["placed", "processing", "out_for_delivery", "delivered", "cancelled"],
      default: "placed",
    },
  },
  { timestamps: true }
);

orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ createdAt: -1 });

// #region Exports
module.exports = mongoose.model("Order", orderSchema);
// #endregion Exports
