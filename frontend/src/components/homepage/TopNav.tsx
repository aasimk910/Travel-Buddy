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
    const base = "nav-link tracking-wide text-sm";
    if (location.pathname === path) {
      return `${base} text-[#F5F3EE] font-medium active`;
    }
    return `${base} text-[#8E8A81] hover:text-[#F5F3EE]`;
  };

  return (
    <header className="site-nav sticky top-0 z-40">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 flex items-center justify-between h-16">
        <button
          type="button"
          className="flex items-center gap-2 cursor-pointer group"
          onClick={() => navigate(isAuthenticated ? "/homepage" : "/")}
        >
          <div className="p-2 rounded-lg bg-[#1E2820] border border-white/10 group-hover:border-[#C6A16E]/40 transition-colors">
            <Map className="w-5 h-5 text-[#C6A16E]" />
          </div>
          <span className="text-base sm:text-lg font-semibold text-[#F5F3EE] tracking-wide font-heading">
            Travel Buddy
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-7 text-sm font-body">
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
                className="hidden sm:flex items-center gap-2 text-sm text-[#B8B4AA] hover:text-[#F5F3EE] transition-colors"
              >
                <div className="w-7 h-7 rounded-full bg-[#1E2820] border border-[#C6A16E]/30 flex items-center justify-center text-xs font-semibold text-[#C6A16E]">
                  {user?.name?.[0]?.toUpperCase() ?? "U"}
                </div>
                <span className="max-w-[120px] truncate">{user?.name}</span>
              </button>
              <Link
                to="/dashboard"
                className="btn-primary inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-1.5 text-sm"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard
              </Link>
              {isAdmin && (
                <Link
                  to="/admin"
                  className="inline-flex items-center justify-center gap-1.5 rounded-md border border-amber-700/40 bg-amber-900/20 px-4 py-1.5 text-sm font-medium text-amber-300 hover:bg-amber-900/30 transition-colors"
                  title="Admin Panel"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin
                </Link>
              )}
              <button
                onClick={() => { logout?.(); navigate("/"); }}
                className="hidden sm:inline-flex items-center justify-center rounded-md btn-outline px-3 py-1.5 text-sm gap-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="btn-outline px-4 py-2 text-sm rounded-md inline-flex items-center"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="btn-primary px-4 py-2 text-sm rounded-md inline-flex items-center"
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
