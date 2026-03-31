// backend/routes/expenses.js
// Hike expense-splitting routes. All endpoints require JWT authentication.
// Expenses are scoped to a specific hike and only accessible by its participants.

// #region Imports
const express = require("express");
const { authenticateToken } = require("../middleware/auth");
// #endregion Imports
const {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
} = require("../controllers/expenseController");

const router = express.Router();

// GET /api/expenses/:hikeId/summary — aggregated expense summary with settlement balances
router.get("/:hikeId/summary", authenticateToken, getExpenseSummary);
// GET /api/expenses/:hikeId — list all expenses for a hike
router.get("/:hikeId", authenticateToken, getExpenses);
// POST /api/expenses/:hikeId — create a new expense (equal/shares/custom split)
router.post("/:hikeId", authenticateToken, createExpense);
// PUT /api/expenses/:hikeId/:expenseId — update an expense
router.put("/:hikeId/:expenseId", authenticateToken, updateExpense);
// DELETE /api/expenses/:hikeId/:expenseId — delete an expense
router.delete("/:hikeId/:expenseId", authenticateToken, deleteExpense);

// #region Exports
module.exports = router;
// #endregion Exports
