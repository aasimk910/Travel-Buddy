// backend/controllers/expenseController.js
const Expense = require("../models/Expense");
const Hike = require("../models/Hike");

const getExpenses = async (req, res) => {
  try {
    const { hikeId } = req.params;

    const hike = await Hike.findById(hikeId);
    if (!hike) return res.status(404).json({ message: "Hike not found." });

    const participantIds = hike.participants.map((p) => p.toString());
    if (!participantIds.includes(req.user._id.toString())) {
      return res.status(403).json({ message: "You are not a participant of this hike." });
    }

    const expenses = await Expense.find({ hikeId }).sort({ createdAt: -1 });
    res.json(expenses);
  } catch (err) {
    console.error("Fetch expenses error:", err);
    res.status(500).json({ message: "Unable to fetch expenses." });
  }
};

const createExpense = async (req, res) => {
  try {
    const { hikeId } = req.params;
    const { description, amount, category, paidBy, splitType, participants, date, notes } = req.body;

    if (!description || !amount || !paidBy || !participants || participants.length === 0) {
      return res.status(400).json({
        message: "Description, amount, paidBy, and participants are required.",
      });
    }

    const hike = await Hike.findById(hikeId);
    if (!hike) return res.status(404).json({ message: "Hike not found." });

    const participantIds = hike.participants.map((p) => p.toString());
    if (!participantIds.includes(req.user._id.toString())) {
      return res.status(403).json({ message: "You are not a participant of this hike." });
    }

    let processedParticipants = [...participants];

    if (splitType === "equal") {
      const splitAmount = amount / participants.length;
      processedParticipants = participants.map((p) => ({
        ...p,
        share: 1,
        amount: parseFloat(splitAmount.toFixed(2)),
      }));
    } else if (splitType === "shares") {
      const totalShares = participants.reduce((sum, p) => sum + (p.share || 1), 0);
      processedParticipants = participants.map((p) => ({
        ...p,
        share: p.share || 1,
        amount: parseFloat(((amount * (p.share || 1)) / totalShares).toFixed(2)),
      }));
    } else if (splitType === "custom") {
      processedParticipants = participants.map((p) => ({
        ...p,
        share: p.share || 1,
        amount: p.amount,
      }));
    }

    const expense = await Expense.create({
      hikeId,
      description,
      amount: parseFloat(amount),
      category: category || "Other",
      paidBy,
      splitType: splitType || "equal",
      participants: processedParticipants,
      date: date || Date.now(),
      notes: notes || "",
    });

    res.status(201).json(expense);
  } catch (err) {
    console.error("Create expense error:", err);
    res.status(500).json({ message: "Unable to create expense." });
  }
};

const updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const { description, amount, category, paidBy, splitType, participants, date, notes } = req.body;

    const expense = await Expense.findById(expenseId);
    if (!expense) return res.status(404).json({ message: "Expense not found." });

    let processedParticipants = participants || expense.participants;
    const finalAmount = amount || expense.amount;
    const finalSplitType = splitType || expense.splitType;

    if (splitType === "equal") {
      const splitAmount = finalAmount / processedParticipants.length;
      processedParticipants = processedParticipants.map((p) => ({
        ...p,
        share: 1,
        amount: parseFloat(splitAmount.toFixed(2)),
      }));
    } else if (splitType === "shares") {
      const totalShares = processedParticipants.reduce((sum, p) => sum + (p.share || 1), 0);
      processedParticipants = processedParticipants.map((p) => ({
        ...p,
        share: p.share || 1,
        amount: parseFloat(((finalAmount * (p.share || 1)) / totalShares).toFixed(2)),
      }));
    }

    expense.description = description || expense.description;
    expense.amount = finalAmount;
    expense.category = category || expense.category;
    expense.paidBy = paidBy || expense.paidBy;
    expense.splitType = finalSplitType;
    expense.participants = processedParticipants;
    expense.date = date || expense.date;
    expense.notes = notes !== undefined ? notes : expense.notes;

    await expense.save();
    res.json(expense);
  } catch (err) {
    console.error("Update expense error:", err);
    res.status(500).json({ message: "Unable to update expense." });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params;
    const expense = await Expense.findByIdAndDelete(expenseId);
    if (!expense) return res.status(404).json({ message: "Expense not found." });
    res.json({ message: "Expense deleted successfully." });
  } catch (err) {
    console.error("Delete expense error:", err);
    res.status(500).json({ message: "Unable to delete expense." });
  }
};

const getExpenseSummary = async (req, res) => {
  try {
    const { hikeId } = req.params;
    const expenses = await Expense.find({ hikeId });

    const balances = {};
    const categoryTotals = {};

    expenses.forEach((expense) => {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;

      const paidByUserId = expense.paidBy.userId;
      if (!balances[paidByUserId]) {
        balances[paidByUserId] = { name: expense.paidBy.name, paid: 0, owes: 0 };
      }
      balances[paidByUserId].paid += expense.amount;

      expense.participants.forEach((participant) => {
        if (!balances[participant.userId]) {
          balances[participant.userId] = { name: participant.name, paid: 0, owes: 0 };
        }
        balances[participant.userId].owes += participant.amount;
      });
    });

    const settlements = Object.entries(balances).map(([userId, data]) => ({
      userId,
      name: data.name,
      paid: parseFloat(data.paid.toFixed(2)),
      owes: parseFloat(data.owes.toFixed(2)),
      balance: parseFloat((data.paid - data.owes).toFixed(2)),
    }));

    const summary = {
      totalExpenses: expenses.reduce((sum, exp) => sum + exp.amount, 0),
      expenseCount: expenses.length,
      categoryTotals,
      settlements: settlements.sort((a, b) => b.balance - a.balance),
    };

    res.json(summary);
  } catch (err) {
    console.error("Fetch expense summary error:", err);
    res.status(500).json({ message: "Unable to fetch expense summary." });
  }
};

module.exports = { getExpenses, createExpense, updateExpense, deleteExpense, getExpenseSummary };
