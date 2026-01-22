import React, { useState, useEffect } from 'react';
import { getUserTrips } from '../../services/trips';
import { useToast } from '../../context/ToastContext';

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

const MyTrips: React.FC = () => {
  const { showError } = useToast();
  const [hikes, setHikes] = useState<Hike[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
    <div className="glass-card rounded-lg p-4 h-full">
      <h3 className="font-semibold mb-4 text-glass">My Trips</h3>
      <ul>
        {isLoading ? (
          <p className="text-glass-dim text-center">Loading your trips...</p>
        ) : hikes.length === 0 ? (
          <p className="text-glass-dim text-center">You haven't joined any trips yet.</p>
        ) : (
          hikes.map((hike) => {
            const status = getStatus(hike.date);
            return (
              <li key={hike._id} className="p-4 mb-2 rounded-lg glass-button flex justify-between items-center">
                <div>
                  <p className="font-semibold text-glass-light">{hike.title}</p>
                  <p className="text-sm text-glass-dim">
                    {hike.location} • {formatDate(hike.date)}
                  </p>
                </div>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    status === 'Completed'
                      ? 'bg-green-500/50 text-white'
                      : status === 'Upcoming'
                      ? 'bg-yellow-500/50 text-white'
                      : 'bg-blue-500/50 text-white'
                  }`}>
                  {status}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
};

export default MyTrips;
