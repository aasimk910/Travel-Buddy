// src/components/SiteFooter.tsx
// Application footer with branding, quick links, and copyright notice.
// #region Imports
import React from "react";
import { Map } from "lucide-react";

// #endregion Imports
const SiteFooter: React.FC = () => {
  return (
    <footer className="glass-nav">
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 pt-4 pb-8 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div className="space-y-3 max-w-sm">
          <div className="flex items-center gap-2">
            <div className="glass-button-dark p-2 rounded-lg shadow-sm">
              <Map className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-semibold text-white">Travel Buddy</span>
          </div>
          <p className="text-xs text-gray-200">Find hiking friends, share routes, and turn solo weekend plans into small group adventures across Nepal.</p>
          <div className="flex gap-3">
            <button className="h-9 rounded-md glass-button px-3 text-[11px] font-medium text-white hover:opacity-80">App Store</button>
            <button className="h-9 rounded-md glass-button px-3 text-[11px] font-medium text-white hover:opacity-80">Google Play</button>
          </div>
        </div>

        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-gray-200">
          <div>
            <p className="mb-3 font-semibold text-white">Explore</p>
            <ul className="space-y-2">
              <li><button className="hover:text-white transition-colors">Hikes</button></li>
              <li><button className="hover:text-white transition-colors">Mountains</button></li>
              <li><button className="hover:text-white transition-colors">Map</button></li>
              <li><button className="hover:text-white transition-colors">Trails</button></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-semibold text-white">Company</p>
            <ul className="space-y-2">
              <li><button className="hover:text-white transition-colors">About</button></li>
              <li><button className="hover:text-white transition-colors">Partners</button></li>
            </ul>
          </div>
          <div>
            <p className="mb-3 font-semibold text-white">Legal</p>
            <ul className="space-y-2">
              <li><button className="hover:text-white transition-colors">Privacy Policy</button></li>
              <li><button className="hover:text-white transition-colors">Terms of Service</button></li>
              <li><button className="hover:text-white transition-colors">Cookie Policy</button></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/20">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] text-gray-200">© {new Date().getFullYear()} Travel Buddy. All rights reserved.</p>
          <div className="flex items-center gap-4 text-[11px] text-gray-200">
            <button className="hover:text-white transition-colors">Privacy</button>
            <button className="hover:text-white transition-colors">Terms</button>
            <div className="inline-flex items-center gap-1 rounded-full glass-button px-2 py-1">
              <span className="text-[11px] text-white">EN</span>
              <span className="text-[11px] text-gray-200">English</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

// #region Exports
export default SiteFooter;
// #endregion Exports
