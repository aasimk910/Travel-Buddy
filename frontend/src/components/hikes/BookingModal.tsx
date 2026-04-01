// src/components/hikes/BookingModal.tsx
// Modal dialog for creating a hotel booking. Validates dates, calculates pricing,
// and submits the booking to the API.
// #region Imports
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, Users, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { Hotel, HotelPackage, createBooking } from "../../services/hikes";
import KhaltiPaymentButton from "./KhaltiPaymentButton";
import { getToken } from "../../services/auth";

// #endregion Imports

// #region Types
type BookingModalProps = {
  open: boolean;
  hotel: Hotel;
  package: HotelPackage;
  hikeId: string;
  hikeDate: string;
  onClose: () => void;
};
// #endregion Types

// #region Component
const BookingModal: React.FC<BookingModalProps> = ({
  open,
  hotel,
  package: pkg,
  hikeId,
  hikeDate,
  onClose,
}) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();

  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [numberOfRooms, setNumberOfRooms] = useState(1);
  const [specialRequests, setSpecialRequests] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState(0);
  const [bookingId, setBookingId] = useState<string | null>(null);
  const [bookingReference, setBookingReference] = useState<string | null>(null);

  // Auto-recalculate price whenever inputs change
  useEffect(() => {
    if (!checkInDate || !checkOutDate) {
      setCalculatedPrice(0);
      return;
    }
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    if (checkIn >= checkOut) {
      setCalculatedPrice(0);
      return;
    }
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    if (nights < pkg.minStayNights) {
      setCalculatedPrice(0);
      return;
    }
    if (pkg.maxStayNights && nights > pkg.maxStayNights) {
      setCalculatedPrice(0);
      return;
    }
    setCalculatedPrice(pkg.pricePerNight * numberOfRooms * nights);
  }, [checkInDate, checkOutDate, numberOfRooms, pkg]);

  if (!open) return null;

  // Calculate number of nights and total price
  const calculatePrice = () => {
    if (!checkInDate || !checkOutDate) return;

    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    if (hikeDate && checkIn > new Date(hikeDate)) {
      showError("Check-in date must be on or before the hike date");
      return;
    }

    if (checkIn >= checkOut) {
      showError("Check-out date must be after check-in date");
      return;
    }

    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    if (nights < pkg.minStayNights) {
      showError(`Minimum stay is ${pkg.minStayNights} night(s)`);
      return;
    }

    if (pkg.maxStayNights && nights > pkg.maxStayNights) {
      showError(`Maximum stay is ${pkg.maxStayNights} night(s)`);
      return;
    }

    const totalPrice = pkg.pricePerNight * numberOfRooms * nights;
    setCalculatedPrice(totalPrice);
  };

  // Handles handleDateChange logic.
  const handleDateChange = (field: string, value: string) => {
    if (field === "checkIn") {
      setCheckInDate(value);
    } else {
      setCheckOutDate(value);
    }
  };

  // Handles handleNumberOfRoomsChange logic.
  const handleNumberOfRoomsChange = (value: number) => {
    if (value >= 1 && value <= pkg.availableRooms) {
      setNumberOfRooms(value);
    }
  };

  // Handles handleBooking logic.
  const handleBooking = async () => {
    if (!user) {
      showError("Please log in to make a booking");
      return;
    }

    if (!checkInDate || !checkOutDate || !numberOfRooms) {
      showError("Please fill in all required fields");
      return;
    }

    if (hikeDate && new Date(checkInDate) > new Date(hikeDate)) {
      showError("Check-in date must be on or before the hike date");
      return;
    }

    if (!calculatedPrice) {
      showError("Please calculate the price first");
      return;
    }

    setIsLoading(true);
    try {
      const token = getToken();
      if (!token) {
        showError("Authentication token not found");
        setIsLoading(false);
        return;
      }

      const booking = await createBooking({
        hikeId,
        hotelId: hotel._id,
        packageId: pkg._id,
        checkInDate,
        checkOutDate,
        numberOfRooms,
        specialRequests,
      }, token);

      setBookingId(booking._id);
      setBookingReference(booking.bookingReference);
      showSuccess("Booking created! Now proceed with payment.");
    } catch (error) {
      console.error("Booking error:", error);
      showError(error instanceof Error ? error.message : "Failed to create booking");
    } finally {
      setIsLoading(false);
    }
  };

  const nights = checkInDate && checkOutDate
    ? Math.ceil((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  const modalContent = (
    <div
      className="fixed inset-0 z-[70] flex items-stretch justify-end bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="glass-card ml-auto h-full w-full max-w-xl overflow-hidden flex flex-col rounded-none border-l border-white/10 shadow-2xl sm:max-w-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="glass-nav px-6 py-5 flex items-center justify-between border-b border-white/10 flex-shrink-0">
          <h3 className="text-2xl font-bold text-white">Book Hotel</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-300" />
          </button>
        </div>

        <div className="p-8 space-y-5 overflow-y-auto flex-1 min-h-0">
          {/* Hotel Info */}
          <div className="glass-card-inner rounded-lg p-6 border border-white/10">
            <h4 className="text-xl font-bold text-white mb-2">{hotel.name}</h4>
            <p className="text-base text-gray-200 mb-1">Package: {pkg.name}</p>
            <p className="text-lg text-emerald-400 font-semibold">
              NPR {pkg.pricePerNight.toLocaleString()}/night
            </p>
          </div>

          {/* Check-in Date */}
          <div>
            <label className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              Check-in Date
            </label>
            <input
              type="date"
              value={checkInDate}
              max={hikeDate ? hikeDate.slice(0, 10) : undefined}
              onChange={(e) => handleDateChange("checkIn", e.target.value)}
              className="glass-input w-full px-4 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="text-sm text-gray-400 mt-1">Before or on: {new Date(hikeDate).toLocaleDateString()}</p>
          </div>

          {/* Check-out Date */}
          <div>
            <label className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-400" />
              Check-out Date
            </label>
            <input
              type="date"
              value={checkOutDate}
              onChange={(e) => handleDateChange("checkOut", e.target.value)}
              className="glass-input w-full px-4 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* Number of Rooms */}
          <div>
            <label className="text-base font-semibold text-white mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              Rooms
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleNumberOfRoomsChange(numberOfRooms - 1)}
                disabled={numberOfRooms <= 1}
                className="px-4 py-2 rounded-lg bg-white/10 text-white disabled:opacity-50 hover:bg-white/20 transition-colors"
              >
                -
              </button>
              <input
                type="number"
                value={numberOfRooms}
                onChange={(e) => handleNumberOfRoomsChange(parseInt(e.target.value))}
                min="1"
                max={pkg.availableRooms}
                className="glass-input flex-1 px-4 py-2 text-center rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={() => handleNumberOfRoomsChange(numberOfRooms + 1)}
                disabled={numberOfRooms >= pkg.availableRooms}
                className="px-4 py-2 rounded-lg bg-white/10 text-white disabled:opacity-50 hover:bg-white/20 transition-colors"
              >
                +
              </button>
            </div>
            <p className="text-sm text-gray-400 mt-1">
              Available: {pkg.availableRooms}
            </p>
          </div>

          {/* Special Requests */}
          <div>
            <label className="text-base font-semibold text-white mb-2">
              Special Requests (Optional)
            </label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Early check-in, high floor, city view..."
              className="glass-input w-full px-4 py-3 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
            />
          </div>

          {/* Price Calculation Info */}
          {checkInDate && checkOutDate && (
            <div className="glass-card-inner rounded-lg p-6 border border-white/10 space-y-3">
              <div className="flex justify-between text-base">
                <span className="text-gray-300">Number of Nights:</span>
                <span className="text-white font-semibold">{nights}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-300">Price per Night:</span>
                <span className="text-white font-semibold">NPR {pkg.pricePerNight.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-base">
                <span className="text-gray-300">Number of Rooms:</span>
                <span className="text-white font-semibold">{numberOfRooms}</span>
              </div>
              <div className="border-t border-white/10 pt-3 flex justify-between">
                <span className="text-white font-bold text-lg">Total Price:</span>
                <span className="text-emerald-400 font-bold text-xl">NPR {calculatedPrice.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Validation Message */}
          {checkInDate && checkOutDate && nights < pkg.minStayNights && (
            <div className="flex items-start gap-3 p-4 bg-yellow-500/20 border border-yellow-400/40 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-200">
                Minimum stay is {pkg.minStayNights} night(s). Please adjust dates.
              </p>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-4 space-y-3">
            {!bookingId ? (
            <>
              <div className="flex gap-3">
                <button
                  onClick={calculatePrice}
                  disabled={!checkInDate || !checkOutDate}
                  className="flex-1 px-4 py-3 rounded-lg bg-indigo-600/60 hover:bg-indigo-600 border border-indigo-400/40 text-white font-semibold transition-colors disabled:opacity-50"
                >
                  Calculate Price
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>

              <button
                onClick={handleBooking}
                disabled={isLoading || !calculatedPrice || !user}
                className="w-full px-4 py-3 rounded-lg bg-emerald-600/60 hover:bg-emerald-600 border border-emerald-400/40 text-white font-bold text-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? "Creating Booking..." : "Confirm Booking"}
              </button>

              {!user && (
                <p className="text-sm text-yellow-300 text-center">
                  Please log in to complete booking
                </p>
              )}
            </>
          ) : (
            <>
              <div className="glass-card-inner rounded-lg p-4 border border-emerald-400/40 bg-emerald-400/10">
                <p className="text-base text-white mb-2 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" /> Booking Created Successfully!
                </p>
                <p className="text-sm text-gray-200">
                  Reference: <span className="font-mono text-emerald-400">{bookingReference}</span>
                </p>
              </div>

              <KhaltiPaymentButton
                bookingId={bookingId}
                amount={calculatedPrice}
                onPaymentSuccess={() => {
                  showSuccess("Payment successful! Your booking is confirmed.");
                  onClose();
                }}
                onPaymentFailure={() => {
                  showError("Payment failed. Your booking is still pending.");
                }}
              />

              <button
                onClick={onClose}
                className="w-full px-4 py-3 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors"
              >
                Close
              </button>
            </>
          )}
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

// #endregion Component

// #region Exports
export default BookingModal;
// #endregion Exports
