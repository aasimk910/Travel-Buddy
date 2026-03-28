const mongoose = require("mongoose");

const ExpenseSchema = new mongoose.Schema(
  {
    hikeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hike",
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
      enum: [
        "Food",
        "Transport",
        "Accommodation",
        "Activities",
        "Equipment",
        "Emergency",
        "Other",
      ],
      default: "Other",
    },
    paidBy: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: {
        type: String,
        required: true,
      },
    },
    splitType: {
      type: String,
      enum: ["equal", "shares", "custom"],
      default: "equal",
      required: true,
    },
    participants: [
      {
        userId: {
          type: String,
          required: true,
        },
        name: {
          type: String,
          required: true,
        },
        share: {
          type: Number,
          default: 1, // For equal split, all get 1. For shares, can be custom
        },
        amount: {
          type: Number,
          required: true,
        },
      },
    ],
    date: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
ExpenseSchema.index({ hikeId: 1, createdAt: -1 });

const Expense = mongoose.model("Expense", ExpenseSchema);

module.exports = Expense;
