// src/components/TripGroups.tsx
// Shows the user's joined hike groups with leave functionality and navigation to hike details.
// #region Imports
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserTrips, leaveHike } from '../../services/trips';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { LogOut, Search } from 'lucide-react';

// #endregion Imports

// #region Types
interface Hike {
  _id: string;
  title: string;
  location: string;
  date: string;
}

interface TripGroupsProps {
  selectedHikeId?: string;
}
// #endregion Types

// #region Component
const TripGroups: React.FC<TripGroupsProps> = ({ selectedHikeId }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showError, showSuccess } = useToast();
  const [tripGroups, setTripGroups] = useState<Hike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [leavingHikeId, setLeavingHikeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Handles fetchTrips logic.
  const fetchTrips = async () => {
    setIsLoading(true);
    try {
      const trips = await getUserTrips();
      setTripGroups(trips);
    } catch (error) {
      console.error("Failed to fetch user trips:", error);
      if (error instanceof Error && error.message === 'AUTH_EXPIRED') {
        logout();
        navigate('/login');
        showError('Your session has expired. Please log in again.');
      } else {
        showError("Could not load your trip groups.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, []);

  // Handles handleLeaveHike logic.
  const handleLeaveHike = async (e: React.MouseEvent, hikeId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to leave this hike?')) return;
    
    setLeavingHikeId(hikeId);
    try {
      await leaveHike(hikeId);
      showSuccess('Successfully left the hike!');
      await fetchTrips();
      if (selectedHikeId === hikeId) {
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Failed to leave hike:', error);
      showError(error.message || 'Unable to leave hike.');
    } finally {
      setLeavingHikeId(null);
    }
  };

  const filteredGroups = tripGroups.filter(
    (g) =>
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#0D1210]">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-white/8">
        <p className="section-label mb-2">Trip Groups</p>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#8E8A81]" />
          <input
            type="text"
            placeholder="Search groups…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 site-input rounded-lg text-xs"
          />
        </div>
      </div>

      {/* List */}
      <ul className="flex-1 overflow-y-auto px-3 py-3 space-y-1.5">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-[#B8B4AA]">
            <div className="w-3.5 h-3.5 rounded-full border-2 border-[#C6A16E] border-t-transparent animate-spin" />
            <span className="text-xs">Loading…</span>
          </div>
        ) : filteredGroups.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-xs text-[#8E8A81]">{tripGroups.length === 0 ? 'No trip groups yet.' : 'No groups match.'}</p>
          </div>
        ) : (
          filteredGroups.map((group) => {
            const isSelected = selectedHikeId === group._id;
            return (
              <li
                key={group._id}
                className={`relative rounded-xl border transition-all group ${
                  isSelected
                    ? 'bg-[#C6A16E]/[0.08] border-[#C6A16E]/30'
                    : 'bg-[#161D19]/50 border-white/6 hover:border-[#C6A16E]/18'
                }`}
              >
                <div
                  className="cursor-pointer px-3 py-2.5 pr-10"
                  onClick={() => navigate(`/dashboard/${group._id}`)}
                >
                  <p className={`text-xs font-semibold truncate ${
                    isSelected ? 'text-[#F5F3EE]' : 'text-[#B8B4AA] group-hover:text-[#F5F3EE]'
                  }`}>{group.title}</p>
                  <p className="text-[10px] text-[#8E8A81] mt-0.5 truncate">{group.location}</p>
                </div>
                <button
                  onClick={(e) => handleLeaveHike(e, group._id)}
                  disabled={leavingHikeId === group._id}
                  className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-md text-[#8E8A81] hover:text-red-400 hover:bg-red-900/20 transition-all disabled:opacity-50 opacity-0 group-hover:opacity-100"
                  title="Leave hike"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};

// #endregion Component

// #region Exports
export default TripGroups;
// #endregion Exports
