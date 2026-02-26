import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserTrips, leaveHike } from '../services/trips';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { LogOut } from 'lucide-react';

interface Hike {
  _id: string;
  title: string;
  location: string;
  date: string;
}

interface TripGroupsProps {
  selectedHikeId?: string;
}

const TripGroups: React.FC<TripGroupsProps> = ({ selectedHikeId }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { showError, showSuccess } = useToast();
  const [tripGroups, setTripGroups] = useState<Hike[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [leavingHikeId, setLeavingHikeId] = useState<string | null>(null);

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

  return (
    <div className="glass-card rounded-lg p-4 h-full flex flex-col">
      <h3 className="font-semibold mb-4 text-glass">Trip Groups</h3>
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search groups..."
          className="w-full p-2 pl-10 rounded-lg glass-input"
        />
        <svg
          className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-glass-dim"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          ></path>
        </svg>
      </div>
      <ul className="flex-1 overflow-y-auto">
        {isLoading ? (
          <p className="text-glass-dim text-center">Loading trips...</p>
        ) : tripGroups.length === 0 ? (
          <p className="text-glass-dim text-center">No trip groups found.</p>
        ) : (
          tripGroups.map((group) => (
            <li 
              key={group._id} 
              className={`relative p-2 mb-2 rounded-lg glass-button ${selectedHikeId === group._id ? 'bg-white/30' : ''} group`}
            >
              <button
                onClick={(e) => handleLeaveHike(e, group._id)}
                disabled={leavingHikeId === group._id}
                className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50/20 rounded-full transition-all disabled:opacity-50"
                title="Leave this hike"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <div 
                className="cursor-pointer pr-10"
                onClick={() => navigate(`/dashboard/${group._id}`)}
              >
                <div className="font-semibold text-glass-light">{group.title}</div>
                <div className="text-sm text-glass-dim">{group.location}</div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default TripGroups;
