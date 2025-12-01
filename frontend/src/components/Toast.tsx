// src/components/Toast.tsx
import React, { useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastProps {
  toast: Toast;
  onClose: (id: string) => void;
}

const ToastComponent: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const bgColor = {
    success: "glass-strong text-black",
    error: "glass-dark text-white",
    info: "glass-strong text-black",
    warning: "glass-strong text-black",
  }[toast.type];

  const icon = {
    success: "✓",
    error: "✕",
    info: "ℹ",
    warning: "⚠",
  }[toast.type];

  return (
    <div
      className={`${bgColor} rounded-lg px-4 py-3 shadow-lg flex items-center gap-3 min-w-[300px] max-w-md animate-slide-in`}
    >
      <span className="text-lg font-bold">{icon}</span>
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="text-gray-300 hover:text-white text-lg font-bold"
      >
        ×
      </button>
    </div>
  );
};

export default ToastComponent;


