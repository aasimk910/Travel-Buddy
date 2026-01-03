import React, { useState, useEffect } from 'react';
import { getUserTrips } from '../../services/trips';
import { useToast } from '../../context/ToastContext';

interface Trip {
  _id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: 'Upcoming' | 'Ongoing' | 'Completed';
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

const MyTrips: React.FC = () => {
  const { showError } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserTrips = async () => {
      try {
        const userTrips = await getUserTrips();
        setTrips(userTrips);
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
        ) : trips.length === 0 ? (
          <p className="text-glass-dim text-center">You haven't joined any trips yet.</p>
        ) : (
          trips.map((trip) => (
            <li key={trip._id} className="p-4 mb-2 rounded-lg glass-button flex justify-between items-center">
              <div>
                <p className="font-semibold text-glass-light">{trip.name}</p>
                <p className="text-sm text-glass-dim">
                  {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                </p>
              </div>
              <span
                className={`text-xs font-bold px-2 py-1 rounded-full ${
                  trip.status === 'Completed'
                    ? 'bg-green-500/50 text-white'
                    : trip.status === 'Upcoming'
                    ? 'bg-yellow-500/50 text-white'
                    : 'bg-blue-500/50 text-white'
                }`}>
                {trip.status}
              </span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default MyTrips;
