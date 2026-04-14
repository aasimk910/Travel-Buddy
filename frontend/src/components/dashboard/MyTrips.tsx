// src/components/dashboard/MyTrips.tsx
// Shows hikes the user has joined with chat, expenses, and file-sharing panels.
// #region Imports
import React, { useState, useEffect } from 'react';
import { getUserTrips } from '../../services/trips';
import { useToast } from '../../context/ToastContext';

// #endregion Imports

// #region Types
interface Hike {
  _id: string;
  title: string;
  location: string;
  date: string;
  difficulty: number;
  spotsLeft: number;
  imageUrl?: string;
  description?: string;
}

// Handles formatDate logic.
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getStatus = (dateString: string): 'Upcoming' | 'Ongoing' | 'Completed' => {
  const hikeDate = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  hikeDate.setHours(0, 0, 0, 0);
  
  if (hikeDate > today) return 'Upcoming';
  if (hikeDate.getTime() === today.getTime()) return 'Ongoing';
  return 'Completed';
};
// #endregion Types

// #region Component
const MyTrips: React.FC = () => {
  const { showError } = useToast();
  const [hikes, setHikes] = useState<Hike[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Handles fetchUserTrips logic.
    const fetchUserTrips = async () => {
      try {
        const userHikes = await getUserTrips();
        setHikes(userHikes);
      } catch (error) {
        console.error("Failed to fetch user trips:", error);
        showError("Could not load your trips.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserTrips();
  }, [showError]);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="section-label mb-1">Your Journeys</p>
          <h2 className="text-xl font-bold text-[#F5F3EE] font-heading">My Trips</h2>
        </div>
        <a href="/hikes" className="btn-outline inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm">
          Find Hikes
        </a>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-3 py-16 text-[#B8B4AA]">
          <div className="w-4 h-4 rounded-full border-2 border-[#C6A16E] border-t-transparent animate-spin" />
          <span className="text-sm">Loading your trips…</span>
        </div>
      ) : hikes.length === 0 ? (
        <div className="site-card rounded-2xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[#C6A16E]/10 border border-[#C6A16E]/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🏔️</span>
          </div>
          <p className="text-[#B8B4AA] font-medium mb-1">No trips yet</p>
          <p className="text-[#8E8A81] text-sm">Join a hike to see your adventures here.</p>
          <a href="/hikes" className="inline-block mt-4 text-xs text-[#C6A16E] hover:text-[#D4AE7A] underline">Browse hikes</a>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {hikes.map((hike) => {
            const status = getStatus(hike.date);
            const statusStyle = {
              Upcoming:  { dot: 'bg-[#C6A16E]',  pill: 'bg-[#C6A16E]/10 border-[#C6A16E]/25 text-[#C6A16E]' },
              Ongoing:   { dot: 'bg-[#8FA68E] animate-pulse', pill: 'bg-[#8FA68E]/10 border-[#8FA68E]/25 text-[#8FA68E]' },
              Completed: { dot: 'bg-[#8E8A81]', pill: 'bg-white/5 border-white/10 text-[#8E8A81]' },
            }[status];
            return (
              <article key={hike._id} className="site-card rounded-xl overflow-hidden group">
                {/* Cinematic image or gradient banner */}
                {hike.imageUrl ? (
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={hike.imageUrl}
                      alt={hike.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#161D19]/80 to-transparent" />
                    <span className={`absolute top-3 right-3 inline-flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {status}
                    </span>
                  </div>
                ) : (
                  <div className="relative h-20 bg-gradient-to-r from-[#C6A16E]/15 via-[#8FA68E]/8 to-transparent overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&cs=tinysrgb&w=400')] bg-cover bg-center opacity-15" />
                    <span className={`absolute top-3 right-3 inline-flex items-center gap-1.5 border rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyle.pill}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {status}
                    </span>
                  </div>
                )}
                <div className="p-4">
                  <h3 className="text-sm font-bold text-[#F5F3EE] font-heading line-clamp-1 mb-1">{hike.title}</h3>
                  <p className="text-xs text-[#8E8A81] mb-3">{hike.location}</p>
                  <div className="flex items-center justify-between text-xs text-[#8E8A81]">
                    <span>{formatDate(hike.date)}</span>
                    <a
                      href={`/dashboard/${hike._id}`}
                      className="text-[#C6A16E] hover:text-[#D4AE7A] font-medium transition-colors"
                    >
                      Open chat →
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
// #endregion Component

// #region Exports
export default MyTrips;
// #endregion Exports
