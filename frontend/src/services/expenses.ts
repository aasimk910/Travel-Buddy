// frontend/src/services/expenses.ts
// API client for hike expense CRUD and summary retrieval.
// #region Imports
import { API_BASE_URL } from "../config/env";
import { getToken, clearToken } from "./auth";

// #endregion Imports
export interface Expense {
  _id: string;
  hikeId: string;
  description: string;
  amount: number;
  category: string;
  paidBy: {
    userId: string;
    name: string;
  };
  splitType: "equal" | "shares" | "custom";
  participants: Array<{
    userId: string;
    name: string;
    share: number;
    amount: number;
  }>;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseSummary {
  totalExpenses: number;
  expenseCount: number;
  categoryTotals: Record<string, number>;
  settlements: Array<{
    userId: string;
    name: string;
    paid: number;
    owes: number;
    balance: number;
  }>;
}

// Handles handleResponse logic.
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    if (response.status === 401) {
      clearToken();
      throw new Error("AUTH_EXPIRED");
    }
    if (response.status === 429) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    }
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || "Request failed");
    } catch (e) {
      if (e instanceof Error && e.message.includes("Too many requests")) throw e;
      throw new Error("Request failed");
    }
  }
  return response.json();
};

export const getExpenses = async (hikeId: string): Promise<Expense[]> => {
  const token = getToken();
  if (!token) {
    throw new Error("No authentication token found.");
  }

  const response = await fetch(`${API_BASE_URL}/api/expenses/${hikeId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return handleResponse(response);
};

export const createExpense = async (
  hikeId: string,
  expenseData: Partial<Expense>
): Promise<Expense> => {
  const token = getToken();
  if (!token) {
    throw new Error("No authentication token found.");
  }

  const response = await fetch(`${API_BASE_URL}/api/expenses/${hikeId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(expenseData),
  });

  return handleResponse(response);
};

export const updateExpense = async (
  hikeId: string,
  expenseId: string,
  expenseData: Partial<Expense>
): Promise<Expense> => {
  const token = getToken();
  if (!token) {
    throw new Error("No authentication token found.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/expenses/${hikeId}/${expenseId}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(expenseData),
    }
  );

  return handleResponse(response);
};

export const deleteExpense = async (
  hikeId: string,
  expenseId: string
): Promise<void> => {
  const token = getToken();
  if (!token) {
    throw new Error("No authentication token found.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/expenses/${hikeId}/${expenseId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  await handleResponse(response);
};

export const getExpenseSummary = async (
  hikeId: string
): Promise<ExpenseSummary> => {
  const token = getToken();
  if (!token) {
    throw new Error("No authentication token found.");
  }

  const response = await fetch(
    `${API_BASE_URL}/api/expenses/${hikeId}/summary`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return handleResponse(response);
};
