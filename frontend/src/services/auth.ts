import { API_BASE_URL } from "../config/env";
import type { AuthUser } from "../context/AuthContext";

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
  const data = (await res.json()) as AuthResponse;
  if (!res.ok) {
    throw new Error(data?.message || "Request failed");
  }
  return data;
};

export const login = (payload: LoginPayload) => postJson("/api/auth/login", payload);

export const signup = (payload: SignupPayload) => postJson("/api/auth/signup", payload);

export const googleAuth = (credential: string) => postJson("/api/auth/google", { credential });

export const storeToken = (token?: string) => {
  if (token) localStorage.setItem("travelBuddyToken", token);
};
