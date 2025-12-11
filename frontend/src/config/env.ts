const viteEnv = (import.meta as any).env || {};

export const API_BASE_URL: string = viteEnv.VITE_API_BASE_URL || "http://localhost:5000";
export const GOOGLE_CLIENT_ID: string = viteEnv.VITE_GOOGLE_CLIENT_ID || "";

if (!viteEnv.VITE_API_BASE_URL) {
  console.warn("VITE_API_BASE_URL is not set. Falling back to http://localhost:5000");
}

if (!GOOGLE_CLIENT_ID) {
  console.warn("VITE_GOOGLE_CLIENT_ID is not set. Google auth is disabled.");
}

export const hasGoogleClientId = (): boolean => !!GOOGLE_CLIENT_ID;
