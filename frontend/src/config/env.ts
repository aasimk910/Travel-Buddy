// frontend/src/config/env.ts
// Centralizes all Vite environment variables with sensible fallback defaults.
// Warns in the console when critical variables (API URL, Google Client ID) are missing.

const viteEnv = (import.meta as any).env || {};

// Backend API base URL (no trailing slash)
export const API_BASE_URL: string = viteEnv.VITE_API_BASE_URL || "http://localhost:5000";
// Google OAuth 2.0 client ID for frontend sign-in
export const GOOGLE_CLIENT_ID: string = viteEnv.VITE_GOOGLE_CLIENT_ID || "";
// reCAPTCHA v3 site key for signup form
export const VITE_RECAPTCHA_SITE_KEY: string = viteEnv.VITE_RECAPTCHA_SITE_KEY || "";

if (!viteEnv.VITE_API_BASE_URL) {
  console.warn("VITE_API_BASE_URL is not set. Falling back to http://localhost:5000");
}

if (!GOOGLE_CLIENT_ID) {
  console.warn("VITE_GOOGLE_CLIENT_ID is not set. Google auth is disabled.");
}

export const hasGoogleClientId = (): boolean => !!GOOGLE_CLIENT_ID;
