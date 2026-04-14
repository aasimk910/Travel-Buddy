// src/components/hikes/BookingModal.tsx
// Modal dialog for creating a hotel booking. Validates dates, calculates pricing,
// and submits the booking to the API.
// #region Imports
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Calendar, Users, AlertCircle, CheckCircle, BedDouble, MapPin, BadgeCheck } from "lucide-react";
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

    const todayDate = new Date();
    todayDate.setHours(0, 0, 0, 0);
    if (new Date(checkInDate) < todayDate) {
      showError("Check-in date cannot be in the past");
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

  const today = new Date().toISOString().split("T")[0];

  const modalContent = (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-[#0B0F0C]/85 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[92vh] overflow-y-auto rounded-2xl border border-white/10 flex flex-col"
        style={{ background: 'linear-gradient(145deg,#1B2420 0%,#161D19 55%,#121A16 100%)', boxShadow: '0 24px 64px rgba(0,0,0,0.8)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#C6A16E]/10 border border-[#C6A16E]/25 flex items-center justify-center">
              <BedDouble className="w-4.5 h-4.5 text-[#C6A16E]" />
            </div>
            <div>
              <p className="section-label leading-none mb-0.5">Reserve Your Stay</p>
              <h3 className="text-base font-bold text-[#F5F3EE] font-heading leading-tight">Book Hotel</h3>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/6 border border-white/10 text-[#8E8A81] hover:text-[#F5F3EE] transition-all">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5 flex-1 overflow-y-auto">

          {/* ── Hotel + Package info ── */}
          <div className="site-card rounded-xl p-4 flex flex-col gap-2">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="text-base font-bold text-[#F5F3EE] font-heading truncate">{hotel.name}</h4>
                {hotel.location && (
                  <p className="text-xs text-[#8E8A81] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3 text-[#C6A16E] shrink-0" />
                    {hotel.location}
                  </p>
                )}
              </div>
              <span className="surface-pill rounded-full px-2.5 py-0.5 text-[11px] font-semibold shrink-0">{pkg.roomType}</span>
            </div>
            <div className="h-px bg-white/8" />
            <div className="flex items-center justify-between">
              <p className="text-xs text-[#8E8A81]">Package: <span className="text-[#B8B4AA] font-medium">{pkg.name}</span></p>
              <p className="text-base font-bold text-[#C6A16E] font-heading">
                NPR {pkg.pricePerNight.toLocaleString()}<span className="text-xs font-normal text-[#8E8A81]">/night</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-3 text-[11px] text-[#8E8A81]">
              <span>Min {pkg.minStayNights} night{pkg.minStayNights !== 1 ? 's' : ''}</span>
              {pkg.maxStayNights && <span>Max {pkg.maxStayNights} nights</span>}
              <span className="text-[#8FA68E]">{pkg.availableRooms} rooms available</span>
            </div>
          </div>

          {/* ── Dates ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#8E8A81] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C6A16E]" /> Check-in
              </label>
              <input
                type="date" value={checkInDate}
                min={today} max={hikeDate ? hikeDate.slice(0, 10) : undefined}
                onChange={(e) => handleDateChange("checkIn", e.target.value)}
                className="site-input w-full px-3 py-2.5 rounded-lg text-sm [color-scheme:dark]"
              />
              <p className="text-[10px] text-[#8E8A81]">On or before hike date</p>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold uppercase tracking-widest text-[#8E8A81] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#C6A16E]" /> Check-out
              </label>
              <input
                type="date" value={checkOutDate}
                min={checkInDate || today}
                onChange={(e) => handleDateChange("checkOut", e.target.value)}
                className="site-input w-full px-3 py-2.5 rounded-lg text-sm [color-scheme:dark]"
              />
            </div>
          </div>

          {/* ── Rooms ── */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#8E8A81] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#C6A16E]" /> Number of Rooms
            </label>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleNumberOfRoomsChange(numberOfRooms - 1)}
                disabled={numberOfRooms <= 1}
                className="w-9 h-9 rounded-lg bg-[#111714] border border-white/10 text-[#F5F3EE] disabled:opacity-40 hover:border-[#C6A16E]/30 transition-all font-bold text-lg"
              >−</button>
              <input
                type="number" value={numberOfRooms}
                onChange={(e) => handleNumberOfRoomsChange(parseInt(e.target.value))}
                min="1" max={pkg.availableRooms}
                className="site-input flex-1 px-3 py-2.5 text-center rounded-lg text-sm"
              />
              <button
                onClick={() => handleNumberOfRoomsChange(numberOfRooms + 1)}
                disabled={numberOfRooms >= pkg.availableRooms}
                className="w-9 h-9 rounded-lg bg-[#111714] border border-white/10 text-[#F5F3EE] disabled:opacity-40 hover:border-[#C6A16E]/30 transition-all font-bold text-lg"
              >+</button>
            </div>
          </div>

          {/* ── Special Requests ── */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#8E8A81]">
              Special Requests <span className="normal-case text-[10px] font-normal">(optional)</span>
            </label>
            <textarea
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="Early check-in, high floor, city view…"
              className="site-input w-full px-3 py-2.5 rounded-lg text-sm resize-none"
              rows={2}
            />
          </div>

          {/* ── Price breakdown ── */}
          {checkInDate && checkOutDate && nights > 0 && (
            <div className="bg-[#111714] border border-white/8 rounded-xl p-4 space-y-2.5">
              <p className="section-label mb-1">Price Breakdown</p>
              {[
                { label: 'Nights', value: `${nights}` },
                { label: 'Rate per night', value: `NPR ${pkg.pricePerNight.toLocaleString()}` },
                { label: 'Rooms', value: `${numberOfRooms}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-xs">
                  <span className="text-[#8E8A81]">{label}</span>
                  <span className="text-[#B8B4AA] font-medium">{value}</span>
                </div>
              ))}
              <div className="h-px bg-white/8" />
              <div className="flex justify-between items-baseline">
                <span className="text-sm font-semibold text-[#F5F3EE]">Total</span>
                <span className="text-xl font-bold text-[#C6A16E] font-heading">
                  NPR {calculatedPrice.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          {/* ── Validation warning ── */}
          {checkInDate && checkOutDate && nights > 0 && nights < pkg.minStayNights && (
            <div className="flex items-start gap-2.5 px-4 py-3 bg-amber-900/20 border border-amber-700/30 rounded-xl">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-300">Minimum stay is {pkg.minStayNights} night(s). Please adjust your dates.</p>
            </div>
          )}

          {/* ── Buttons ── */}
          <div className="space-y-2.5 pt-1">
            {!bookingId ? (
              <>
                <button
                  onClick={handleBooking}
                  disabled={isLoading || !calculatedPrice || !user}
                  className="btn-primary w-full py-3 rounded-xl font-semibold text-sm disabled:opacity-50"
                >
                  {isLoading ? "Creating Booking…" : `Confirm Booking${calculatedPrice ? ` — NPR ${calculatedPrice.toLocaleString()}` : ''}`}
                </button>
                <button onClick={onClose} className="btn-outline w-full py-2.5 rounded-xl text-sm font-medium">
                  Cancel
                </button>
                {!user && (
                  <p className="text-xs text-amber-400 text-center flex items-center justify-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> Please log in to complete booking
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="flex items-start gap-3 px-4 py-3.5 bg-[#8FA68E]/10 border border-[#8FA68E]/25 rounded-xl">
                  <BadgeCheck className="w-5 h-5 text-[#8FA68E] shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-[#F5F3EE]">Booking Created!</p>
                    <p className="text-xs text-[#8E8A81] mt-0.5">
                      Reference: <span className="font-mono text-[#C6A16E]">{bookingReference}</span>
                    </p>
                  </div>
                </div>
                <KhaltiPaymentButton
                  bookingId={bookingId}
                  amount={calculatedPrice}
                  onPaymentSuccess={() => { showSuccess("Payment successful! Your booking is confirmed."); onClose(); }}
                  onPaymentFailure={() => { showError("Payment failed. Your booking is still pending."); }}
                />
                <button onClick={onClose} className="btn-outline w-full py-2.5 rounded-xl text-sm font-medium">
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
