// src/context/AuthContext.tsx
// Global authentication context. Persists the logged-in user in localStorage
// and manages Socket.IO connection lifecycle (connect on login, disconnect on logout).

// #region Imports
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { socket } from '../utils/socket';
import { clearToken } from '../services/auth';
// #endregion Imports

// #region Types
export type AuthUser = {
  id?: string;
  name: string;
  email: string;
  age?: number;
  country?: string;
  travelStyle?: string;
  budgetRange?: string;
  interests?: string;
  avatarUrl?: string;
  provider?: "password" | "google";
  role?: "user" | "admin";
  onboardingCompleted?: boolean;
  hikingProfile?: {
    experienceLevel?: "beginner" | "intermediate" | "advanced";
    fitnessLevel?: "low" | "medium" | "high";
    preferredDifficulty?: number;
    preferredRegion?: string;
    preferredSeason?: "spring" | "summer" | "autumn" | "winter";
    tripGoal?: "scenic" | "challenge" | "social" | "photography";
    hikeDuration?: "half-day" | "full-day" | "multi-day";
    groupPreference?: "solo" | "small-group" | "large-group";
    maxBudgetPerDay?: number;
    accommodationPreference?: "basic" | "comfortable" | "luxury";
    wantsGuide?: boolean;
    medicalConsiderations?: string;
  } | null;
};

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: AuthUser | null;
  login: (email: string, password: string) => void;
  loginWithGoogle: (user: AuthUser) => void;
  loginWithProfile: (user: AuthUser) => void;
  logout: () => void;
}
// #endregion Types

// #region AuthProvider
const STORAGE_KEY = "travelBuddyUser";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // Check both storages so "Remember me" preference is respected
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored =
        localStorage.getItem(STORAGE_KEY) ||
        sessionStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  // Determine which storage to use based on the remember-me preference
  const getStorage = (): Storage => {
    return localStorage.getItem("travelBuddyRemember") === "true"
      ? localStorage
      : sessionStorage;
  };

  useEffect(() => {
    const storage = getStorage();
    if (user) {
      if (!socket.connected) {
        socket.connect();
      }
      storage.setItem(STORAGE_KEY, JSON.stringify(user));
      // Clean the other storage to avoid stale data
      if (storage === localStorage) {
        sessionStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } else {
      if (socket.connected) {
        socket.disconnect();
      }
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    }

    // Don't disconnect in cleanup - let the socket persist across re-renders
    // Only disconnect when user logs out (handled above when user becomes null)
  }, [user]);

  // Persist user to the correct storage
  const saveUser = (u: AuthUser) => {
    setUser(u);
    if (typeof window !== "undefined") {
      const storage = getStorage();
      storage.setItem(STORAGE_KEY, JSON.stringify(u));
    }
  };

  // Email/password login — delegates to the caller (Login.tsx uses loginWithProfile directly)
  // This stub is kept for interface compatibility; real login flow is in Login.tsx via loginRequest()
  const login = (email: string, password: string) => {
    console.warn("login() called directly — use loginRequest() from services/auth.ts instead");
  };

  // Used by Google login
  const loginWithGoogle = (googleUser: AuthUser) => {
    saveUser({
      ...googleUser,
      provider: "google",
    });
  };

  // Used by Signup form to store full profile
  const loginWithProfile = (profileUser: AuthUser) => {
    saveUser({
      ...profileUser,
      provider: profileUser.provider ?? "password",
    });
  };

  // Handles logout logic — clears user and token from both storages.
  const logout = () => {
    setUser(null);
    clearToken();
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem("travelBuddyRemember");
    localStorage.removeItem("travelBuddyRememberEmail");
    window.location.href = "/";
  };

  const value: AuthContextType = {
    isAuthenticated: !!user,
    isAdmin: user?.role === "admin",
    user,
    login,
    loginWithGoogle,
    loginWithProfile,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
// #endregion AuthProvider

// #region Hook
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
// #endregion Hook
