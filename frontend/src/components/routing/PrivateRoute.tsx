// src/components/PrivateRoute.tsx
// Route guard that redirects unauthenticated users to the login page.
// #region Imports
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// #endregion Imports

// #region Types
type PrivateRouteProps = {
  children: React.ReactElement;
};
// #endregion Types

// #region Component
const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isAdmin, user } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  const isOnboardingPath = location.pathname === "/onboarding";
  const needsOnboarding = !isAdmin && !user?.onboardingCompleted;

  if (needsOnboarding && !isOnboardingPath) {
    return (
      <Navigate
        to="/onboarding"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  if (!needsOnboarding && isOnboardingPath) {
    return <Navigate to="/homepage" replace />;
  }

  return children;
};
// #endregion Component

// #region Exports
export default PrivateRoute;

// #endregion Exports
