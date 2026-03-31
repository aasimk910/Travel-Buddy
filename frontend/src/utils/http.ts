// frontend/src/utils/http.ts
// Shared HTTP utility wrapping fetch with auth headers and JSON parsing.
// #region Imports
import { API_BASE_URL } from "../config/env";

// #endregion Imports
type HeadersInit = Record<string, string>;

// Handles getJson logic.
export const getJson = async (path: string) => {
  const res = await fetch(`${API_BASE_URL}${path}`);
  const data = await res.json();
  return { res, data };
};

// Handles postJson logic.
export const postJson = async (path: string, body: unknown, token?: string) => {
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return { res, data };
};

// Handles deleteJson logic.
export const deleteJson = async (path: string, token?: string) => {
  const headers: HeadersInit = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "DELETE",
    headers,
  });
  const data = await res.json();
  return { res, data };
};

