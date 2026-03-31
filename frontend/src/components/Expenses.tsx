// src/components/Expenses.tsx
// Expense tracker UI for hike groups. Supports adding, editing, deleting expenses
// with equal/share/custom splits and shows settlement summary.
// #region Imports
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
// #endregion Imports
  DollarSign,
  Plus,
  Edit2,
  Trash2,
  Download,
  X,
  Users,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import {
  getExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
  Expense,
  ExpenseSummary,
} from "../services/expenses";
import { API_BASE_URL } from "../config/env";
import { getToken } from "../services/auth";

interface ExpensesProps {
  roomId?: string;
}

const CATEGORIES = [
  "Food",
  "Transport",
  "Accommodation",
  "Activities",
  "Equipment",
  "Emergency",
  "Other",
];

const SPLIT_TYPES = [
  { value: "equal", label: "Split Equally" },
  { value: "shares", label: "By Shares" },
  { value: "custom", label: "Custom Amount" },
];

interface HikeParticipant {
  _id: string;
  name: string;
  email: string;
}

// Handles Expenses logic.
const Expenses = ({ roomId }: ExpensesProps) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { showSuccess, showError } = useToast();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [summary, setSummary] = useState<ExpenseSummary | null>(null);
  const [participants, setParticipants] = useState<HikeParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "Food",
    paidBy: "",
    splitType: "equal" as "equal" | "shares" | "custom",
    notes: "",
  });
  const [selectedParticipants, setSelectedParticipants] = useState<
    Array<{ userId: string; name: string; share: number; amount: number }>
  >([]);

  useEffect(() => {
    if (roomId) {
      fetchExpenses();
      fetchSummary();
      fetchParticipants();
    }
  }, [roomId]);

  // Handles fetchParticipants logic.
  const fetchParticipants = async () => {
    if (!roomId) return;
    try {
      const token = getToken();
      const res = await fetch(`${API_BASE_URL}/api/hikes/${roomId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const hike = await res.json();
        const creator = {
          _id: hike.userId._id || hike.userId,
          name: hike.userId.name || "Creator",
          email: hike.userId.email || "",
        };
        const participantsList = hike.participants?.map((p: any) => ({
          _id: p._id || p,
          name: p.name || "User",
          email: p.email || "",
        })) || [];
        setParticipants([creator, ...participantsList]);
      }
    } catch (error) {
      console.error("Failed to fetch participants:", error);
    }
  };

  // Handles fetchExpenses logic.
  const fetchExpenses = async () => {
    if (!roomId) return;
    setIsLoading(true);
    try {
      const data = await getExpenses(roomId);
      setExpenses(data);
    } catch (error) {
      handleAuthError(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handles fetchSummary logic.
  const fetchSummary = async () => {
    if (!roomId) return;
    try {
      const data = await getExpenseSummary(roomId);
      setSummary(data);
    } catch (error) {
      console.error("Failed to fetch summary:", error);
    }
  };

  // Handles handleAuthError logic.
  const handleAuthError = (error: any) => {
    if (error instanceof Error && error.message === "AUTH_EXPIRED") {
      logout();
      navigate("/login");
      showError("Your session has expired. Please log in again.");
    } else {
      showError(error instanceof Error ? error.message : "An error occurred");
    }
  };

  // Handles openModal logic.
  const openModal = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        description: expense.description,
        amount: expense.amount.toString(),
        category: expense.category,
        paidBy: expense.paidBy.userId,
        splitType: expense.splitType,
        notes: expense.notes || "",
      });
      setSelectedParticipants(expense.participants);
    } else {
      setEditingExpense(null);
      setFormData({
        description: "",
        amount: "",
        category: "Food",
        paidBy: user?.name || "",
        splitType: "equal",
        notes: "",
      });
      // Select all participants by default
      setSelectedParticipants(
        participants.map((p) => ({
          userId: p._id,
          name: p.name,
          share: 1,
          amount: 0,
        }))
      );
    }
    setShowModal(true);
  };

  // Handles closeModal logic.
  const closeModal = () => {
    setShowModal(false);
    setEditingExpense(null);
  };

  // Handles toggleParticipant logic.
  const toggleParticipant = (participant: HikeParticipant) => {
    const exists = selectedParticipants.find((p) => p.userId === participant._id);
    if (exists) {
      setSelectedParticipants(
        selectedParticipants.filter((p) => p.userId !== participant._id)
      );
    } else {
      setSelectedParticipants([
        ...selectedParticipants,
        { userId: participant._id, name: participant.name, share: 1, amount: 0 },
      ]);
    }
  };

  // Handles updateParticipantShare logic.
  const updateParticipantShare = (userId: string, value: number) => {
    setSelectedParticipants(
      selectedParticipants.map((p) =>
        p.userId === userId ? { ...p, share: value } : p
      )
    );
  };

  // Handles updateParticipantAmount logic.
  const updateParticipantAmount = (userId: string, value: number) => {
    setSelectedParticipants(
      selectedParticipants.map((p) =>
        p.userId === userId ? { ...p, amount: value } : p
      )
    );
  };

  // Handles handleSubmit logic.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId) return;

    if (selectedParticipants.length === 0) {
      showError("Please select at least one participant");
      return;
    }

    const payer = participants.find((p) => p._id === formData.paidBy);
    if (!payer) {
      showError("Please select who paid");
      return;
    }

    try {
      const expenseData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        paidBy: {
          userId: payer._id,
          name: payer.name,
        },
        splitType: formData.splitType,
        participants: selectedParticipants,
        notes: formData.notes,
      };

      if (editingExpense) {
        await updateExpense(roomId, editingExpense._id, expenseData);
        showSuccess("Expense updated successfully!");
      } else {
        await createExpense(roomId, expenseData);
        showSuccess("Expense added successfully!");
      }

      closeModal();
      fetchExpenses();
      fetchSummary();
    } catch (error) {
      handleAuthError(error);
    }
  };

  // Handles handleDelete logic.
  const handleDelete = async (expenseId: string) => {
    if (!roomId) return;
    if (!confirm("Are you sure you want to delete this expense?")) return;

    try {
      await deleteExpense(roomId, expenseId);
      showSuccess("Expense deleted successfully!");
      fetchExpenses();
      fetchSummary();
    } catch (error) {
      handleAuthError(error);
    }
  };

  // Handles exportToCSV logic.
  const exportToCSV = () => {
    if (!expenses.length) return;

    const headers = [
      "Date",
      "Description",
      "Amount",
      "Category",
      "Paid By",
      "Split Type",
      "Participants",
      "Notes",
    ];

    const rows = expenses.map((exp) => [
      new Date(exp.date).toLocaleDateString(),
      exp.description,
      exp.amount.toFixed(2),
      exp.category,
      exp.paidBy.name,
      exp.splitType,
      exp.participants.map((p) => `${p.name} (NPR ${p.amount.toFixed(2)})`).join("; "),
      exp.notes || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `expenses_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess("Expenses exported successfully!");
  };

  if (!roomId) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <p className="text-glass-dim">Select a trip to view expenses</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-transparent">
      {/* Header */}
      <div className="p-4 border-b border-white/20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-glass">Expenses</h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSummary(!showSummary)}
            className="px-3 py-1.5 rounded-md glass-button text-glass-light text-sm flex items-center gap-2 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            {showSummary ? "Hide" : "Show"} Summary
          </button>
          <button
            onClick={exportToCSV}
            disabled={expenses.length === 0}
            className="px-3 py-1.5 rounded-md glass-button text-glass-light text-sm flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
          <button
            onClick={() => openModal()}
            className="px-3 py-1.5 rounded-md glass-button-dark text-white text-sm flex items-center gap-2 transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Expense
          </button>
        </div>
      </div>

      {/* Summary Panel */}
      {showSummary && summary && (
        <div className="p-4 bg-white/5 border-b border-white/10 backdrop-blur-sm">
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-400">
                NPR {summary.totalExpenses.toFixed(2)}
              </p>
              <p className="text-sm text-glass-dim">Total Expenses</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-glass">
                {summary.expenseCount}
              </p>
              <p className="text-sm text-glass-dim">Transactions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-glass">
                {Object.keys(summary.categoryTotals).length}
              </p>
              <p className="text-sm text-glass-dim">Categories</p>
            </div>
          </div>

          {/* Settlements */}
          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-glass mb-2">
              Settlements
            </h4>
            {summary.settlements.map((settlement) => (
              <div
                key={settlement.userId}
                className="glass flex justify-between items-center p-3 rounded-lg"
              >
                <span className="text-sm text-glass">{settlement.name}</span>
                <div className="flex gap-4 text-sm">
                  <span className="text-glass-dim">
                    Paid: NPR {settlement.paid.toFixed(2)}
                  </span>
                  <span className="text-glass-dim">
                    Owes: NPR {settlement.owes.toFixed(2)}
                  </span>
                  <span
                    className={`font-semibold ${
                      settlement.balance >= 0
                        ? "text-emerald-400"
                        : "text-rose-400"
                    }`}
                  >
                    {settlement.balance >= 0 ? "+" : ""}NPR{" "}
                    {settlement.balance.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expense List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <p className="text-glass-dim">Loading expenses...</p>
          </div>
        ) : expenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <DollarSign className="w-16 h-16 text-glass-dim mb-4 opacity-50" />
            <p className="text-glass-dim mb-2">No expenses yet</p>
            <button
              onClick={() => openModal()}
              className="text-emerald-400 hover:text-emerald-300 hover:underline transition-colors"
            >
              Add your first expense
            </button>
          </div>
        ) : (
          expenses.map((expense) => (
            <div
              key={expense._id}
              className="glass-card p-4 rounded-lg hover:bg-white/20 transition-all"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h4 className="font-semibold text-glass">
                    {expense.description}
                  </h4>
                  <p className="text-sm text-glass-dim">
                    {new Date(expense.date).toLocaleDateString()} —{" "}
                    {expense.category}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-emerald-400">
                    NPR {expense.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => openModal(expense)}
                    className="p-1.5 rounded hover:bg-white/10 transition-colors text-glass-light"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(expense._id)}
                    className="p-1.5 rounded hover:bg-white/10 text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="text-sm">
                <p className="text-glass-dim mb-1">
                  Paid by <span className="text-glass font-medium">{expense.paidBy.name}</span>
                  {" — "}
                  <span className="capitalize">{expense.splitType} split</span>
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {expense.participants.map((p) => (
                    <span
                      key={p.userId}
                      className="px-2 py-1 rounded bg-white/10 text-xs text-glass-light border border-white/10"
                    >
                      {p.name}: NPR {p.amount.toFixed(2)}
                    </span>
                  ))}
                </div>
                {expense.notes && (
                  <p className="text-glass-dim mt-2 text-xs italic">
                    {expense.notes}
                  </p>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="glass-card rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-glass">
                  {editingExpense ? "Edit Expense" : "Add Expense"}
                </h3>
                <button
                  onClick={closeModal}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-glass-light"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-glass mb-2">
                    Description *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="glass-input w-full px-3 py-2 rounded-lg text-glass placeholder-glass-dim focus:outline-none focus:border-emerald-400 transition-colors"
                    placeholder="e.g., Lunch at restaurant"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-glass mb-2">
                      Amount *
                    </label>
                    <input
                      type="number"
                      required
                      step="0.01"
                      min="0"
                      value={formData.amount}
                      onChange={(e) =>
                        setFormData({ ...formData, amount: e.target.value })
                      }
                      className="glass-input w-full px-3 py-2 rounded-lg text-glass placeholder-glass-dim focus:outline-none focus:border-emerald-400 transition-colors"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-glass mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="glass-input w-full px-3 py-2 rounded-lg text-glass focus:outline-none focus:border-emerald-400 transition-colors [color-scheme:dark]"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat} className="bg-gray-900 text-white">
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-glass mb-2">
                    Paid By *
                  </label>
                  <select
                    required
                    value={formData.paidBy}
                    onChange={(e) =>
                      setFormData({ ...formData, paidBy: e.target.value })
                    }
                    className="glass-input w-full px-3 py-2 rounded-lg text-glass focus:outline-none focus:border-emerald-400 transition-colors [color-scheme:dark]"
                  >
                    <option value="" className="bg-gray-900 text-white">Select who paid</option>
                    {participants.map((p) => (
                      <option key={p._id} value={p._id} className="bg-gray-900 text-white">
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-glass mb-2">
                    Split Type
                  </label>
                  <div className="flex gap-2">
                    {SPLIT_TYPES.map((type) => (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            splitType: type.value as any,
                          })
                        }
                        className={`px-4 py-2 rounded-lg text-sm transition-all ${
                          formData.splitType === type.value
                            ? "glass-button-dark text-white shadow-lg"
                            : "glass-button text-glass-light"
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-glass mb-2">
                    <Users className="w-4 h-4 inline mr-1" />
                    Participants *
                  </label>
                  <div className="glass space-y-2 max-h-48 overflow-y-auto p-3 rounded-lg">
                    {participants.map((participant) => {
                      const selected = selectedParticipants.find(
                        (p) => p.userId === participant._id
                      );
                      return (
                        <div
                          key={participant._id}
                          className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={!!selected}
                            onChange={() => toggleParticipant(participant)}
                            className="w-4 h-4 rounded accent-emerald-500"
                          />
                          <span className="flex-1 text-sm text-glass">{participant.name}</span>
                          {selected && formData.splitType === "shares" && (
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={selected.share}
                              onChange={(e) =>
                                updateParticipantShare(
                                  participant._id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-20 px-2 py-1 rounded bg-white/10 border border-white/20 text-sm text-glass placeholder-glass-dim"
                              placeholder="Share"
                            />
                          )}
                          {selected && formData.splitType === "custom" && (
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={selected.amount}
                              onChange={(e) =>
                                updateParticipantAmount(
                                  participant._id,
                                  parseFloat(e.target.value) || 0
                                )
                              }
                              className="w-24 px-2 py-1 rounded bg-white/10 border border-white/20 text-sm text-glass placeholder-glass-dim"
                              placeholder="Amount"
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-glass mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    rows={2}
                    className="glass-input w-full px-3 py-2 rounded-lg text-glass placeholder-glass-dim focus:outline-none focus:border-emerald-400 resize-none transition-colors"
                    placeholder="Add any additional notes..."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 rounded-lg glass-button transition-colors text-glass"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 rounded-lg glass-button-dark text-white transition-all"
                  >
                    {editingExpense ? "Update" : "Add"} Expense
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// #region Exports
export default Expenses;
// #endregion Exports
