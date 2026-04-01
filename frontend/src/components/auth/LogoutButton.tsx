// src/components/LogoutButton.tsx
// #region Imports
import React from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

// #endregion Imports

// #region Types
interface LogoutButtonProps {
  className?: string;
  showText?: boolean;
}
// #endregion Types

// #region Component
const LogoutButton: React.FC<LogoutButtonProps> = ({
  className = "",
  showText = true,
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Handles handleLogout logic.
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <button
      onClick={handleLogout}
      className={`inline-flex items-center gap-2 justify-center rounded-full glass-button-dark px-4 py-1.5 text-sm font-medium text-white shadow-sm transition-colors ${className}`}
    >
      <LogOut className="w-4 h-4" />
      {showText && <span className="hidden sm:inline">Logout</span>}
    </button>
  );
};
// #endregion Component

// #region Exports
export default LogoutButton;


// #endregion Exports
