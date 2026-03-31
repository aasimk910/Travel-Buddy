// frontend/src/services/auth.ts
// API client for authentication: login, signup, Google auth, password reset.
// #region Imports
import { API_BASE_URL } from "../config/env";
import type { AuthUser } from "../context/AuthContext";

// #endregion Imports
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

// Handles login logic.
export const login = (payload: LoginPayload) => postJson("/api/auth/login", payload);

// Handles signup logic.
export const signup = (payload: SignupPayload) => postJson("/api/auth/signup", payload);

// Handles googleAuth logic.
export const googleAuth = (credential: string) => postJson("/api/auth/google", { credential });

// Handles storeToken logic.
export const storeToken = (token?: string) => {
  if (token) localStorage.setItem("travelBuddyToken", token);
};

// Handles forgotPassword logic.
export const forgotPassword = (email: string) =>
  postJson("/api/auth/forgot-password", { email }) as Promise<{ message: string; provider?: string }>;

// Handles resetPassword logic.
export const resetPassword = (token: string, password: string) =>
  postJson(`/api/auth/reset-password/${token}`, { password });
