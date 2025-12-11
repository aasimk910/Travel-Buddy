import React from "react";

type StatusAlertProps = {
  message?: string | null;
};

const StatusAlert: React.FC<StatusAlertProps> = ({ message }) => {
  if (!message) return null;
  return (
    <div className="rounded-md glass-dark px-4 py-2 text-sm text-white">
      {message}
    </div>
  );
};

export default StatusAlert;
