// frontend/src/services/auth.ts
// API client for authentication: login, signup, Google auth, password reset.
// #region Imports
import { API_BASE_URL } from "../config/env";
import type { AuthUser } from "../context/AuthContext";

// #endregion Imports

// #region Types
export type AuthResponse = {
  token?: string;
  user?: AuthUser;
  message?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  recaptchaToken: string;
  name: string;
  email: string;
  password: string;
  country?: string;
  travelStyle?: string;
  budgetRange?: string;
  interests?: string;
};
// #endregion Types

// #region Helpers
const postJson = async (path: string, body: unknown): Promise<AuthResponse> => {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  let data: AuthResponse = {};
  try {
    data = (await res.json()) as AuthResponse;
  } catch {
    // Non-JSON response (e.g. proxy misconfig, HTML error page, empty response)
    const text = await res.text().catch(() => "");
    data = { message: text || "Request failed" };
  }
  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
};
// #endregion Helpers

// #region Auth API
// Handles login logic.
export const login = (payload: LoginPayload) => postJson("/api/auth/login", payload);

// Handles signup logic.
export const signup = (payload: SignupPayload) => postJson("/api/auth/signup", payload);

// Handles googleAuth logic.
export const googleAuth = (credential: string) => postJson("/api/auth/google", { credential });
// #endregion Auth API

// #region Token Management
// Key used to remember whether the user chose "Remember me"
const REMEMBER_KEY = "travelBuddyRemember";
const TOKEN_KEY = "travelBuddyToken";

// Store the JWT token in the appropriate storage based on the "Remember me" choice.
// localStorage persists across browser sessions; sessionStorage is cleared when the tab closes.
export const storeToken = (token?: string, remember?: boolean) => {
  if (!token) return;
  // If remember flag is explicitly provided, persist the preference
  if (remember !== undefined) {
    if (remember) {
      localStorage.setItem(REMEMBER_KEY, "true");
    } else {
      localStorage.removeItem(REMEMBER_KEY);
    }
  }
  // Determine which storage to use
  const shouldPersist = remember ?? localStorage.getItem(REMEMBER_KEY) === "true";
  if (shouldPersist) {
    localStorage.setItem(TOKEN_KEY, token);
    sessionStorage.removeItem(TOKEN_KEY); // clean up the other storage
  } else {
    sessionStorage.setItem(TOKEN_KEY, token);
    localStorage.removeItem(TOKEN_KEY); // clean up the other storage
  }
};

// Retrieve the JWT token from whichever storage it was placed in.
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
};

// Remove the JWT token from both storages (used on logout / 401).
export const clearToken = () => {
  localStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
};
// #endregion Token Management

// #region Password Reset
// Handles forgotPassword logic.
export const forgotPassword = (email: string) =>
  postJson("/api/auth/forgot-password", { email }) as Promise<{ message: string; provider?: string }>;

// Handles resetPassword logic.
export const resetPassword = (token: string, password: string) =>
  postJson(`/api/auth/reset-password/${token}`, { password });
// #endregion Password Reset
