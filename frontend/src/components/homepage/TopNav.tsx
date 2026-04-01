// src/components/homepage/TopNav.tsx
// Main application navigation bar with links to Hikes, Maps, Dashboard, Shop, and admin panel.
// #region Imports
import React from "react";
import { Map, LayoutDashboard, LogOut, ShieldCheck } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

// #endregion Imports

// #region Component
const TopNav: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const location = useLocation();

  // Handles getLinkClass logic.
  const getLinkClass = (path: string) => {
    const baseClass = "transition-colors";
    if (location.pathname === path) {
      return `${baseClass} text-white font-medium border-b-2 border-white pb-1`;
    }
    return `${baseClass} text-gray-200 hover:text-white`;
  };

  return (
    <header className="glass-nav sticky top-0 z-10">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 flex items-center justify-between h-16">
        <button
          type="button"
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate(isAuthenticated ? "/homepage" : "/")}
        >
          <div className="glass-button-dark p-2 rounded-lg shadow-sm">
            <Map className="w-5 h-5 text-white" />
          </div>
          <span className="text-base sm:text-lg font-semibold text-white">
            Travel Buddy
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link to={isAuthenticated ? "/homepage" : "/"} className={getLinkClass(isAuthenticated ? "/homepage" : "/")}>
            Home
          </Link>
          <Link to="/hikes" className={getLinkClass("/hikes")}>
            Hikes
          </Link>
          <Link to="/maps" className={getLinkClass("/maps")}>
            Maps
          </Link>
          <Link to="/shop" className={getLinkClass("/shop")}>
            Shop
          </Link>
          <Link to="/about" className={getLinkClass("/about")}>
            About
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate("/profile")}
                className="hidden sm:flex items-center gap-2 text-sm text-gray-200 hover:text-white transition-colors"
              >
                <div className="w-7 h-7 rounded-full glass-button-dark flex items-center justify-center text-xs font-semibold text-white">
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <span className="max-w-[120px] truncate">{user?.name}</span>
              </button>
              <Link
                to="/dashboard"
                className="inline-flex items-center justify-center gap-1.5 rounded-full glass-button-dark px-4 py-1.5 text-sm font-medium text-white shadow-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full glass-button-dark px-4 py-1.5 text-sm font-medium text-amber-300 shadow-sm hover:text-amber-200 transition-colors"
                  title="Admin Panel"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin
                </Link>
              )}
              <button
                onClick={() => { logout?.(); navigate("/"); }}
                className="hidden sm:inline-flex items-center justify-center rounded-full glass-button px-3 py-1.5 text-sm text-gray-200 hover:text-white transition-colors gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm glass-button rounded-lg text-white transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-sm glass-button-dark rounded-lg text-white transition-colors"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

// #endregion Component

// #region Exports
export default TopNav;
// #endregion Exports
