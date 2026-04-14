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
    <footer className="bg-[#080C0A]">
      {/* Decorative gold rule */}
      <hr className="gold-rule" />
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 pt-10 pb-8 grid grid-cols-1 gap-10 sm:grid-cols-3 sm:gap-12">
        {/* Brand */}
        <div className="space-y-4">
          <Link to="/" className="flex items-center gap-2.5 w-fit group">
            <div className="p-2 rounded-lg bg-[#1E2820] border border-white/10 group-hover:border-[#C6A16E]/40 transition-colors">
              <Map className="w-4 h-4 text-[#C6A16E]" />
            </div>
            <span className="text-sm font-semibold text-[#F5F3EE] tracking-wide font-heading">Travel Buddy</span>
          </Link>
          <p className="text-xs text-[#8E8A81] leading-relaxed">Find hiking friends, share routes, and turn solo weekend plans into small group adventures across Nepal.</p>
        </div>

        {/* Explore */}
        <div className="text-xs text-[#8E8A81]">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#C6A16E]">Explore</p>
          <ul className="space-y-2.5">
            <li><Link to="/hikes" className="hover:text-[#F5F3EE] transition-colors">Hikes</Link></li>
            <li><Link to="/maps" className="hover:text-[#F5F3EE] transition-colors">Maps</Link></li>
            <li><Link to="/shop" className="hover:text-[#F5F3EE] transition-colors">Shop</Link></li>
          </ul>
        </div>

        {/* Company */}
        <div className="text-xs text-[#8E8A81]">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[#C6A16E]">Company</p>
          <ul className="space-y-2.5">
            <li><Link to="/about" className="hover:text-[#F5F3EE] transition-colors">About</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/8">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-4 flex justify-center">
          <p className="text-[11px] text-[#8E8A81]">© {new Date().getFullYear()} Travel Buddy. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

// #endregion Component

// #region Exports
export default SiteFooter;
// #endregion Exports
