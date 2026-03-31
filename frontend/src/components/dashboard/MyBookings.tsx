// src/components/dashboard/MyBookings.tsx
// Lists the user's hotel bookings with status badges, payment info, and refresh capability.
// #region Imports
import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle, Clock, XCircle, RefreshCw, Hotel, Calendar, CreditCard, Hash } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getUserBookings, HotelBooking } from '../../services/hikes';
import { getToken } from "../../services/auth";

// #endregion Imports
const STATUS_CONFIG = {
  confirmed: {
    label: 'Confirmed',
    icon: <CheckCircle className="w-4 h-4" />,
    cls: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30',
    dot: 'bg-emerald-400',
  },
  pending: {
    label: 'Pending',
    icon: <Clock className="w-4 h-4" />,
    cls: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
    dot: 'bg-amber-400 animate-pulse',
  },
  cancelled: {
    label: 'Cancelled',
    icon: <XCircle className="w-4 h-4" />,
    cls: 'bg-red-500/20 text-red-300 border-red-400/30',
    dot: 'bg-red-400',
  },
};

const PAYMENT_CONFIG: Record<string, { label: string; cls: string }> = {
  paid:    { label: 'Paid',    cls: 'text-emerald-400' },
  partial: { label: 'Partial', cls: 'text-amber-400'   },
  unpaid:  { label: 'Unpaid',  cls: 'text-red-400'     },
};

const MyBookings: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const token = getToken();
  const [bookings, setBookings]   = useState<HotelBooking[]>([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [expanded, setExpanded]   = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const data = await getUserBookings(token);
      setBookings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  if (!isAuthenticated) {
    return (
      <div className="glass-card rounded-xl p-6 text-center text-glass-dim text-sm">
        Please log in to view your bookings.
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-glass">My Hotel Bookings</h3>
        <button
          onClick={fetchBookings}
          disabled={loading}
          className="glass-button p-1.5 rounded-lg disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && (
        <div className="text-center py-8 text-glass-dim text-sm">Loading bookings...</div>
      )}

      {!loading && error && (
        <div className="text-center py-6 text-red-400 text-sm">{error}</div>
      )}

      {!loading && !error && bookings.length === 0 && (
        <div className="text-center py-8">
          <Hotel className="w-10 h-10 text-glass-dim mx-auto mb-3 opacity-40" />
          <p className="text-glass-dim text-sm">No hotel bookings yet.</p>
        </div>
      )}

      {!loading && !error && bookings.length > 0 && (
        <div className="flex flex-col gap-3">
          {bookings.map(b => {
            const st  = STATUS_CONFIG[b.status]  ?? STATUS_CONFIG.pending;
            const pay = PAYMENT_CONFIG[b.paymentStatus] ?? PAYMENT_CONFIG.unpaid;
            const isExpanded = expanded === b._id;

            return (
              <div key={b._id} className="glass-card rounded-xl overflow-hidden">
                {/* Header row */}
                <button
                  onClick={() => setExpanded(isExpanded ? null : b._id)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left"
                >
                  {/* Status dot */}
                  <span className={`w-2 h-2 rounded-full shrink-0 ${st.dot}`} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-glass font-semibold text-sm truncate">
                        {b.bookingReference}
                      </span>
                      {/* Confirmed badge — prominent */}
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${st.cls}`}>
                        {st.icon}
                        {st.label}
                      </span>
                    </div>
                    <p className="text-glass-dim text-xs mt-0.5 truncate">
                      {new Date(b.checkInDate).toLocaleDateString('en-NP', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' ? '}
                      {new Date(b.checkOutDate).toLocaleDateString('en-NP', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>

                  <span className="text-glass font-bold text-sm shrink-0">
                    NPR {b.totalPrice.toLocaleString()}
                  </span>
                </button>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-white/10 pt-3 space-y-2 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 text-glass-dim">
                        <Hash className="w-3.5 h-3.5 shrink-0" />
                        <span>Ref: <span className="text-glass font-mono">{b.bookingReference}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-glass-dim">
                        <CreditCard className="w-3.5 h-3.5 shrink-0" />
                        <span>Payment: <span className={`font-semibold ${pay.cls}`}>{pay.label}</span></span>
                      </div>
                      <div className="flex items-center gap-2 text-glass-dim">
                        <Calendar className="w-3.5 h-3.5 shrink-0" />
                        <span>{b.numberOfNights} night{b.numberOfNights !== 1 ? 's' : ''} — {b.numberOfRooms} room{b.numberOfRooms !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2 text-glass-dim">
                        <span>NPR {b.pricePerNight.toLocaleString()} / night</span>
                      </div>
                    </div>

                    {b.guestName && (
                      <p className="text-glass-dim">Guest: <span className="text-glass">{b.guestName}</span></p>
                    )}
                    {b.specialRequests && (
                      <p className="text-glass-dim">Requests: <span className="text-glass">{b.specialRequests}</span></p>
                    )}

                    {/* Confirmation banner when confirmed */}
                    {b.status === 'confirmed' && (
                      <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-emerald-500/15 border border-emerald-400/30">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <p className="text-emerald-300 text-xs font-medium">
                          Your booking has been confirmed by the hotel. See you on the trail!
                        </p>
                      </div>
                    )}

                    {b.status === 'cancelled' && (
                      <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-red-500/15 border border-red-400/30">
                        <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        <p className="text-red-300 text-xs font-medium">
                          This booking has been cancelled.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// #region Exports
export default MyBookings;
// #endregion Exports
