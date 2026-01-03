import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUserTrips } from '../services/trips';
import { useToast } from '../context/ToastContext';

interface Trip {
  _id: string;
  name: string;
  // lastMessage can be added later if the API supports it
}

interface TripGroupsProps {
  selectedHikeId?: string;
}

const TripGroups: React.FC<TripGroupsProps> = ({ selectedHikeId }) => {
  const navigate = useNavigate();
  const { showError } = useToast();
  const [tripGroups, setTripGroups] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const trips = await getUserTrips();
        setTripGroups(trips);
      } catch (error) {
        console.error("Failed to fetch user trips:", error);
        showError("Could not load your trip groups.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrips();
  }, [showError]);

  return (
    <div className="glass-card rounded-lg p-4 h-full">
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
      <ul>
        {isLoading ? (
          <p className="text-glass-dim text-center">Loading trips...</p>
        ) : tripGroups.length === 0 ? (
          <p className="text-glass-dim text-center">No trip groups found.</p>
        ) : (
          tripGroups.map((group) => (
            <li 
              key={group._id} 
              className={`p-2 mb-2 rounded-lg cursor-pointer glass-button ${selectedHikeId === group._id ? 'bg-white/30' : ''}`}
              onClick={() => navigate(`/dashboard/${group._id}`)}
            >
              <div className="font-semibold text-glass-light">{group.name}</div>
              {/* Placeholder for last message */}
              <div className="text-sm text-glass-dim italic">No recent messages</div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default TripGroups;
