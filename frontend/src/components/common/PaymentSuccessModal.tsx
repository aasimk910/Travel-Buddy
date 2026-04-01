// src/components/PaymentSuccessModal.tsx
// Celebratory popup modal shown after a successful Khalti payment.
// Uses the project's glassmorphism design system (glass-card, glass-dark, glass-button-dark, text-glass-*).

// #region Imports
import { useEffect } from "react";
import { CheckCircle, X, PartyPopper } from "lucide-react";
// #endregion Imports

// #region Types
interface PaymentSuccessModalProps {
  /** Whether the modal is visible */
  open: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Amount paid (in NPR) */
  amount?: number;
  /** Optional booking or order reference ID */
  reference?: string;
  /** Optional label for the action button (defaults to "Continue") */
  actionLabel?: string;
  /** Optional callback for the action button (defaults to onClose) */
  onAction?: () => void;
}
// #endregion Types

// #region Component
export default function PaymentSuccessModal({
  open,
  onClose,
  amount,
  reference,
  actionLabel = "Continue",
  onAction,
}: PaymentSuccessModalProps) {
  // Close on Escape key press
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Prevent background scroll while modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    /* Backdrop – matches project modal pattern (Expenses, Admin, CreateHikeModal) */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn"
      onClick={onClose}
    >
      {/* Modal card – uses glass-card from index.css */}
      <div
        className="relative glass-card rounded-xl w-full max-w-sm shadow-2xl border border-white/20 p-8 text-center animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button – matches project pattern (hover:bg-white/10 text-glass-light) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 rounded-lg hover:bg-white/10 transition-colors text-glass-light"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Animated success icon */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full glass flex items-center justify-center bounce-soft">
              <CheckCircle className="w-12 h-12 text-accent-green" />
            </div>
            <PartyPopper className="absolute -top-2 -right-2 w-7 h-7 text-yellow-400 animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-glass mb-2">Payment Successful!</h2>
        <p className="text-accent-green text-sm mb-5">
          Your Khalti payment has been verified and confirmed.
        </p>

        {/* Payment details card – uses glass-dark from index.css */}
        {(amount || reference) && (
          <div className="glass-dark rounded-xl p-4 mb-6 space-y-2 border border-white/10">
            {amount != null && (
              <div className="flex justify-between text-sm">
                <span className="text-glass-dim">Amount Paid</span>
                <span className="text-glass font-semibold">
                  NPR {amount.toLocaleString()}
                </span>
              </div>
            )}
            {reference && (
              <div className="flex justify-between text-sm">
                <span className="text-glass-dim">Reference</span>
                <span className="font-mono text-accent-green text-xs break-all">
                  {reference}
                </span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-glass-dim">Payment Method</span>
              <span className="text-purple-400 font-medium">Khalti</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-glass-dim">Status</span>
              <span className="text-accent-green font-semibold">Paid ✓</span>
            </div>
          </div>
        )}

        {/* Action button – uses glass-button-dark from index.css */}
        <button
          onClick={onAction ?? onClose}
          className="w-full py-3 rounded-xl glass-button-dark text-white font-semibold transition-all duration-200"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
// #endregion Component
