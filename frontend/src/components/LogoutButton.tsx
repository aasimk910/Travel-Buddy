// src/components/LogoutButton.tsx
import React from "react";
import { LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface LogoutButtonProps {
  className?: string;
  showText?: boolean;
}

const LogoutButton: React.FC<LogoutButtonProps> = ({
  className = "",
  showText = true,
}) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

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

export default LogoutButton;


