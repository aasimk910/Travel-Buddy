// src/context/AuthContext.tsx
// Global authentication context. Persists the logged-in user in localStorage
// and manages Socket.IO connection lifecycle (connect on login, disconnect on logout).

// #region Imports
import React, {
// #endregion Imports
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";
import { socket } from '../utils/socket';

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

const STORAGE_KEY = "travelBuddyUser";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? (JSON.parse(stored) as AuthUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      if (!socket.connected) {
        socket.connect();
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      if (socket.connected) {
        socket.disconnect();
      }
      localStorage.removeItem(STORAGE_KEY);
    }

    // Don't disconnect in cleanup - let the socket persist across re-renders
    // Only disconnect when user logs out (handled above when user becomes null)
  }, [user]);

  // Handles saveUser logic.
  const saveUser = (u: AuthUser) => {
    setUser(u);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
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

  // Handles logout logic.
  const logout = () => {
    setUser(null);
    localStorage.removeItem("travelBuddyToken");
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

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
};
