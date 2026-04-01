// src/components/AdminRoute.tsx
// Route guard that restricts access to admin-only pages. Redirects non-admins to homepage.
// #region Imports
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// #endregion Imports
type AdminRouteProps = {
  children: React.ReactElement;
};

const AdminRoute: React.FC<AdminRouteProps> = ({ children }) => {
  const { isAuthenticated, isAdmin } = useAuth();
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

  if (!isAdmin) {
    return <Navigate to="/homepage" replace />;
  }

  return children;
};

// #region Exports
export default AdminRoute;
// #endregion Exports
