// src/pages/BookingConfirmation.tsx
// Post-payment landing page that verifies Khalti payment and shows booking confirmation.
// #region Imports
import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, AlertCircle, Loader } from "lucide-react";
import { useToast } from "../context/ToastContext";
import { API_BASE_URL } from "../config/env";
import PaymentSuccessModal from "../components/common/PaymentSuccessModal";
import { getToken } from "../services/auth";

// #endregion Imports
// #region Exports
export default function BookingConfirmation() {
// #endregion Exports
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [bookingData, setBookingData] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const bookingId = searchParams.get("bookingId");
  const khaltiStatus = searchParams.get("status");
  const pidx = searchParams.get("pidx");

  useEffect(() => {
    // Handles verifyBooking logic.
    const verifyBooking = async () => {
      if (!bookingId) {
        setStatus("error");
        setMessage("No booking ID provided");
        return;
      }

      try {
        const token = getToken();
        if (!token) {
          setStatus("error");
          setMessage("You must be logged in to view booking details.");
          return;
        }

        // Verify Khalti payment server-side after redirect.
        if (khaltiStatus === "Completed" && pidx) {
          const verifyRes = await fetch(`${API_BASE_URL}/api/payments/khalti-verify`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              pidx,
              booking_id: bookingId,
            }),
          });
          if (!verifyRes.ok) {
            setStatus("error");
            setMessage("Payment verification failed. Please contact support.");
            return;
          }
        }

        const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          setStatus("error");
          setMessage("Booking not found or you do not have access to it.");
          return;
        }
        const data = await response.json();
        setBookingData(data);

        if (data.paymentStatus === "paid") {
          setStatus("success");
          setMessage("Your booking has been confirmed and paid!");
          setShowPaymentModal(true);
        } else {
          setStatus("error");
          setMessage(
            "Booking found but payment is still pending. Please complete the payment to confirm your booking."
          );
        }
      } catch (error) {
        console.error("Booking verification error:", error);
        setStatus("error");
        setMessage("Could not verify booking. Please contact support.");
      }
    };

    verifyBooking();
  }, [bookingId, khaltiStatus, pidx, showToast]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      {/* Payment Success Popup Modal */}
      <PaymentSuccessModal
        open={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={bookingData?.totalPrice}
        reference={bookingData?.bookingReference || bookingData?.bookingId}
        actionLabel="View Booking Details"
        onAction={() => setShowPaymentModal(false)}
      />
      <div className="glass-card rounded-2xl shadow-2xl max-w-md w-full p-8">
        {status === "loading" && (
          <div className="text-center space-y-4">
            <Loader className="w-12 h-12 text-indigo-400 animate-spin mx-auto" />
            <h2 className="text-2xl font-bold text-white">Verifying Booking...</h2>
            <p className="text-gray-300">Please wait while we confirm your booking.</p>
          </div>
        )}

        {status === "success" && (
          <div className="text-center space-y-4">
            <CheckCircle className="w-16 h-16 text-emerald-400 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Booking Confirmed!</h2>
            <p className="text-gray-300">{message}</p>

            {bookingData && (
              <div className="glass-card-inner rounded-lg p-4 border border-white/10 space-y-2 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Booking Reference:</span>
                  <span className="font-mono text-emerald-400">{bookingData.bookingId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Total Amount:</span>
                  <span className="text-white font-semibold">
                    NPR {bookingData.totalPrice?.toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-300">Payment Status:</span>
                  <span className="text-emerald-400 capitalize font-semibold">
                    {bookingData.paymentStatus}
                  </span>
                </div>
              </div>
            )}

            <button
              onClick={() => navigate("/dashboard")}
              className="w-full px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="text-center space-y-4">
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Booking Status</h2>
            <p className="text-gray-300">{message}</p>

            <div className="space-y-2">
              <button
                onClick={() => navigate("/hikes")}
                className="w-full px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors"
              >
                Return to Hikes
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="w-full px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
