// src/components/dashboard/HikeHotelsPanel.tsx
// Panel that displays linked hotels for a specific hike, with expandable hotel details.
// #region Imports
import React, { useEffect, useState } from "react";
import { BedDouble } from "lucide-react";
import { getHike, Hotel } from "../../services/hikes";
import HotelDetails from "../hikes/HotelDetails";

// #endregion Imports

// #region Types
type HikeHotelsPanelProps = {
  hikeId?: string;
};
// #endregion Types

// #region Component
const HikeHotelsPanel: React.FC<HikeHotelsPanelProps> = ({ hikeId }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [hikeDate, setHikeDate] = useState<string>(new Date().toISOString());

  useEffect(() => {
    if (!hikeId) {
      setHotels([]);
      setError(null);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setError(null);

    getHike(hikeId)
      .then((hike) => {
        if (!isMounted) return;
        setHotels(hike.hotels || []);
        setHikeDate(hike.date || new Date().toISOString());
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error("Failed to load hike hotels:", err);
        setError("Could not load accommodation for this hike.");
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [hikeId]);

  if (!hikeId) {
    return (
      <div className="h-full flex items-center justify-center text-center p-6">
        <div className="space-y-2 text-glass-dim">
          <BedDouble className="w-8 h-8 mx-auto text-glass-light" />
          <p className="font-semibold">Select a hike to view accommodation</p>
          <p className="text-sm">Hotels for that trail will appear here with booking options.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center text-glass-light">
        Loading accommodation...
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-red-300 text-sm p-6">
        {error}
      </div>
    );
  }

  if (!hotels.length) {
    return (
      <div className="h-full flex items-center justify-center text-center p-6">
        <div className="space-y-2 text-glass-dim">
          <BedDouble className="w-8 h-8 mx-auto text-glass-light" />
          <p className="font-semibold">No hotels linked to this hike yet</p>
          <p className="text-sm">Try another hike or add hotels to this trail.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <HotelDetails hotels={hotels} hikeId={hikeId} hikeDate={hikeDate} />
    </div>
  );
};

// #endregion Component

// #region Exports
export default HikeHotelsPanel;
// #endregion Exports
