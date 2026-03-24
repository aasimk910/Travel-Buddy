import { useState } from "react";
import { useToast } from "../../context/ToastContext";
import { API_BASE_URL } from "../../config/env";
import { CreditCard, Loader2 } from "lucide-react";

interface KhaltiPaymentButtonProps {
  bookingId: string;
  amount: number;
  onPaymentSuccess: () => void;
  onPaymentFailure?: () => void;
}

export default function KhaltiPaymentButton({
  bookingId,
  amount,
  onPaymentSuccess,
  onPaymentFailure,
}: KhaltiPaymentButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handlePaymentClick = async () => {
    try {
      setIsLoading(true);

      // Call backend to initiate payment
      const token = localStorage.getItem("travelBuddyToken");
      const paymentResponse = await fetch(`${API_BASE_URL}/api/payments/hotel-booking`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bookingId }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentData.pidx) {
        throw new Error(paymentData.message || "Failed to initiate payment");
      }

      if (paymentData.payment_url) {
        showToast("Redirecting to Khalti...", "success");
        window.location.href = paymentData.payment_url;
        return;
      }

      throw new Error(paymentData.message || "Payment URL not received");
    } catch (error) {
      console.error("Payment initiation error:", error);
      showToast(
        (error as any)?.message || "Failed to initiate payment",
        "error"
      );
      onPaymentFailure?.();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePaymentClick}
      disabled={isLoading}
      className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition duration-300 flex items-center justify-center gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <CreditCard className="w-5 h-5" /> Pay NPR {amount.toLocaleString()} with Khalti
        </>
      )}
    </button>
  );
}
