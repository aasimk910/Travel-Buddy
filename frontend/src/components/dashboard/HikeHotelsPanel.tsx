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
        <div className="space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#8FA68E]/10 border border-[#8FA68E]/20 flex items-center justify-center mx-auto">
            <BedDouble className="w-7 h-7 text-[#8FA68E]" />
          </div>
          <p className="font-semibold text-[#F5F3EE] font-heading">Select a hike</p>
          <p className="text-sm text-[#8E8A81]">Hotels for that trail will appear here with booking options.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center gap-2 text-[#B8B4AA]">
        <div className="w-4 h-4 rounded-full border-2 border-[#C6A16E] border-t-transparent animate-spin" />
        <span className="text-sm">Loading accommodation…</span>
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
        <div className="space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-[#8FA68E]/10 border border-[#8FA68E]/20 flex items-center justify-center mx-auto">
            <BedDouble className="w-7 h-7 text-[#8FA68E]" />
          </div>
          <p className="font-semibold text-[#F5F3EE] font-heading">No accommodation yet</p>
          <p className="text-sm text-[#8E8A81]">Try another hike or add hotels to this trail.</p>
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
