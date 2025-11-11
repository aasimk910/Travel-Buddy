// src/context/AuthContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

export type AuthUser = {
  name: string;
  email: string;
  age?: number;
  country?: string;
  travelStyle?: string;
  budgetRange?: string;
  interests?: string;
  bio?: string;
  avatarUrl?: string;
  provider?: "password" | "google";
};

interface AuthContextType {
  isAuthenticated: boolean;
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
    if (user && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    }
  }, [user]);

  const saveUser = (u: AuthUser) => {
    setUser(u);
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    }
  };

  // Simple email/password login (no backend yet)
  const login = (email: string, _password: string) => {
    const defaultName = email.split("@")[0];
    saveUser({
      name: defaultName,
      email,
      provider: "password",
    });
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

  const logout = () => {
    setUser(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const value: AuthContextType = {
    isAuthenticated: !!user,
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
