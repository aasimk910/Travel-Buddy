// src/components/StatusAlert.tsx
// Reusable inline alert banner for displaying success, error, warning, or info messages.
// #region Imports
import React from "react";

// #endregion Imports

// #region Types
type StatusAlertProps = {
  message?: string | null;
};
// #endregion Types

// #region Component
const StatusAlert: React.FC<StatusAlertProps> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="rounded-md glass-dark px-4 py-2 text-sm text-white">
      {message}
    </div>
  );
};

// #endregion Component

// #region Exports
export default StatusAlert;
// #endregion Exports
