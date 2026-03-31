// src/components/AuthHeader.tsx
// Shared header/logo component displayed on login, signup, and password reset pages.
// #region Imports
import React from "react";
import { Map } from "lucide-react";

// #endregion Imports
type AuthHeaderProps = {
  title: string;
  subtitle?: string;
};

const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle }) => {
  return (
    <div className="sm:mx-auto sm:w-full sm:max-w-md">
      <div className="flex items-center justify-center gap-2">
        <div className="glass-button-dark p-2 rounded-lg shadow-sm">
          <Map className="w-5 h-5 text-white" />
        </div>
        <span className="text-2xl font-semibold tracking-tight text-white">
          Travel Buddy
        </span>
      </div>
      <h2 className="mt-6 text-center text-2xl font-bold tracking-tight text-white">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-2 text-center text-sm text-gray-200">{subtitle}</p>
      )}
    </div>
  );
};

// #region Exports
export default AuthHeader;
// #endregion Exports
