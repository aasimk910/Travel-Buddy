// src/components/AuthHeader.tsx
// Shared header/logo component displayed on login, signup, and password reset pages.
// #region Imports
import React from "react";
import { Map } from "lucide-react";

// #endregion Imports

// #region Types
type AuthHeaderProps = {
  title: string;
  subtitle?: string;
};
// #endregion Types

// #region Component
const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="flex items-center justify-center gap-2.5">
        <div className="p-2 rounded-lg bg-[#1E2820] border border-white/10">
          <Map className="w-5 h-5 text-[#C6A16E]" />
        </div>
        <span className="text-2xl font-semibold tracking-wide text-[#F5F3EE] font-heading">
          Travel Buddy
        </span>
      </div>
      <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-[#F5F3EE] font-heading">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-center text-sm text-[#B8B4AA]">{subtitle}</p>
      )}
    </div>
  );
};

// #endregion Component

// #region Exports
export default AuthHeader;
// #endregion Exports
