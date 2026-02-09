import React, { useEffect, useState } from 'react';
import { getUserTrips } from '../../services/trips';
import { useToast } from '../../context/ToastContext';
import { CalendarDays } from 'lucide-react';

interface Trip {
  _id: string;
  title: string;
  location: string;
  date: string;
}

const UpcomingTrips: React.FC = () => {
  const { showError } = useToast();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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
        showError('Could not load upcoming trips');
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrips();
  }, [showError]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  return (
    <div className="glass-card rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-white">Upcoming Trips</h3>
        <a href="#" className="text-sm text-gray-300 hover:text-white">View all</a>
      </div>
      {isLoading ? (
        <p className="text-center text-gray-300 py-4">Loading...</p>
      ) : trips.length === 0 ? (
        <p className="text-center text-gray-400 py-4 text-sm">No upcoming trips yet. Join a hike to get started!</p>
      ) : (
        <ul className="space-y-3">
          {trips.map((trip) => (
            <li key={trip._id} className="p-3 rounded-lg glass-button hover:opacity-90 transition cursor-pointer">
              <p className="font-semibold text-white mb-1">{trip.title}</p>
              <p className="text-xs text-gray-300 mb-1">{trip.location}</p>
              <div className="flex items-center gap-1 text-xs text-gray-400">
                <CalendarDays className="w-3 h-3" />
                <span>{formatDate(trip.date)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default UpcomingTrips;
