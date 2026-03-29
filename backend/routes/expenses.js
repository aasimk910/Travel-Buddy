// backend/routes/expenses.js
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
} = require("../controllers/expenseController");

const router = express.Router();

router.get("/:hikeId/summary", authenticateToken, getExpenseSummary);
router.get("/:hikeId", authenticateToken, getExpenses);
router.post("/:hikeId", authenticateToken, createExpense);
router.put("/:hikeId/:expenseId", authenticateToken, updateExpense);
router.delete("/:hikeId/:expenseId", authenticateToken, deleteExpense);

module.exports = router;
