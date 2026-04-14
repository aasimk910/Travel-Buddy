// src/components/dashboard/UpcomingTrips.tsx
// Dashboard widget showing the next upcoming hike the user has joined.
// #region Imports
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserTrips } from '../../services/trips';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { CalendarDays } from 'lucide-react';

// #endregion Imports

// #region Types
interface Trip {
  _id: string;
  title: string;
  location: string;
  date: string;
}
// #endregion Types

// #region Component
const UpcomingTrips: React.FC = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showError } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Handles fetchTrips logic.
    const fetchTrips = async () => {
      try {
        const userTrips = await getUserTrips();
        // Filter for upcoming trips only (date is in the future)
        const upcoming = userTrips.filter((trip: Trip) => {
          const tripDate = new Date(trip.date);
          return tripDate >= new Date();
        });
        // Sort by date (earliest first)
        upcoming.sort((a: Trip, b: Trip) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );
        // Take only the first 3 upcoming trips
        setTrips(upcoming.slice(0, 3));
      } catch (error) {
        console.error('Failed to fetch upcoming trips:', error);
        if (error instanceof Error && error.message === 'AUTH_EXPIRED') {
          logout();
          navigate('/login');
          showError('Your session has expired. Please log in again.');
        } else {
          showError('Could not load upcoming trips');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrips();
  }, [showError]);

  // Handles formatDate logic.
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="site-card rounded-xl overflow-hidden">
      {/* Header with subtle background */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&cs=tinysrgb&w=400')" }}
        />
        <div className="absolute inset-0 bg-[#161D19]/80" />
        <div className="relative flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#C6A16E]" />
            <p className="section-label">Upcoming Trips</p>
          </div>
          <a href="/hikes" className="text-[10px] font-medium text-[#C6A16E] hover:text-[#D4AE7A] transition-colors">
            Browse more
          </a>
        </div>
      </div>

      <div className="p-3">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-5 text-[#B8B4AA]">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-[#C6A16E] border-t-transparent animate-spin" />
            <span className="text-xs">Loading…</span>
          </div>
        ) : trips.length === 0 ? (
          <div className="text-center py-5">
            <CalendarDays className="w-7 h-7 text-[#8E8A81]/30 mx-auto mb-2" />
            <p className="text-xs text-[#8E8A81]">No upcoming trips yet.</p>
            <a href="/hikes" className="inline-block mt-2 text-[11px] text-[#C6A16E] hover:text-[#D4AE7A] underline">
              Join a hike
            </a>
          </div>
        ) : (
          <ul className="space-y-2">
            {trips.map((trip) => (
              <li
                key={trip._id}
                className="flex items-start gap-3 rounded-lg bg-[#111714] border border-white/6 px-3 py-2.5 hover:border-[#C6A16E]/20 transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#C6A16E]/10 border border-[#C6A16E]/20 flex items-center justify-center shrink-0 mt-0.5">
                  <CalendarDays className="w-4 h-4 text-[#C6A16E]" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-[#F5F3EE] group-hover:text-[#F5F3EE] line-clamp-1">{trip.title}</p>
                  <p className="text-[10px] text-[#8E8A81] mt-0.5 truncate">{trip.location}</p>
                  <p className="text-[10px] text-[#C6A16E] mt-0.5 font-medium">{formatDate(trip.date)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

// #endregion Component

// #region Exports
export default UpcomingTrips;
// #endregion Exports
