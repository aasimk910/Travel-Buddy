// src/components/SiteFooter.tsx
// Application footer with branding, quick links, and copyright notice.
// #region Imports
import React from "react";
import { Link } from "react-router-dom";
import { Map } from "lucide-react";

// #endregion Imports

// #region Component
const SiteFooter: React.FC = () => {
  return (
    <footer className="glass-nav">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 pt-6 pb-8 grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-12">
        {/* Brand */}
        <div className="space-y-3">
          <Link to="/" className="flex items-center gap-2 w-fit">
            <div className="glass-button-dark p-2 rounded-lg shadow-sm">
              <Map className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Travel Buddy</span>
          </Link>
          <p className="text-xs text-gray-200">Find hiking friends, share routes, and turn solo weekend plans into small group adventures across Nepal.</p>
        </div>

        {/* Explore */}
        <div className="text-xs text-gray-200">
          <p className="mb-3 font-semibold text-white">Explore</p>
          <ul className="space-y-2">
            <li><Link to="/hikes" className="hover:text-white transition-colors">Hikes</Link></li>
            <li><Link to="/maps" className="hover:text-white transition-colors">Maps</Link></li>
            <li><Link to="/shop" className="hover:text-white transition-colors">Shop</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div className="text-xs text-gray-200">
          <p className="mb-3 font-semibold text-white">Company</p>
          <ul className="space-y-2">
            <li><Link to="/about" className="hover:text-white transition-colors">About</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-4 flex justify-center">
          <p className="text-[11px] text-gray-200">© {new Date().getFullYear()} Travel Buddy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

// #endregion Component

// #region Exports
export default SiteFooter;
// #endregion Exports
