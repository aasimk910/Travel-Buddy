import React from "react";
import { Map, User } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import LogoutButton from "../LogoutButton";

const TopNav: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

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
          {isAuthenticated && (
            <Link to="/dashboard" className={getLinkClass("/dashboard")}>
              Dashboard
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm text-white">
                <User className="w-4 h-4" />
                <span>{user?.name}</span>
              </div>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 text-sm text-white hover:text-gray-200 transition-colors"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="px-4 py-2 text-sm bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors backdrop-blur-sm"
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

export default TopNav;
