// src/components/ChatHeader.tsx
// Displays hike title and participant count at the top of the chat panel.
// #region Imports
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/env';

// #endregion Imports

// #region Types
interface ChatHeaderProps {
  hikeId?: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

interface HikeDetails {
  title: string;
  location: string;
  date: string;
  participants?: string[];
}
// #endregion Types

// #region Component
// Handles formatDate logic.
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getHikeDetails = async (hikeId: string): Promise<HikeDetails | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/hikes/${hikeId}`);
    if (!res.ok) {
      if (res.status === 429) {
        console.warn("Rate limited. Skipping hike details fetch.");
      }
      return null;
    }
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch hike details:", error);
    return null;
  }
};

const ChatHeader: React.FC<ChatHeaderProps> = ({ hikeId, activeTab, onTabChange }) => {
  const [hikeDetails, setHikeDetails] = useState<{ name: string; members: number; date: string }>({ 
    name: 'Select a Trip', 
    members: 0, 
    date: '' 
  });

  useEffect(() => {
    if (hikeId) {
      getHikeDetails(hikeId).then((data) => {
        if (data) {
          setHikeDetails({
            name: data.title,
            members: (data.participants?.length || 0) + 1, // +1 for creator
            date: formatDate(data.date),
          });
        }
      });
    } else {
      setHikeDetails({ name: 'Select a Trip', members: 0, date: '' });
    }
  }, [hikeId]);

  return (
    <div className="border-b border-white/8">
      {/* Hike title row */}
      <div className="px-5 py-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-[#F5F3EE] font-heading truncate">{hikeDetails.name}</h2>
          {hikeId && (
            <p className="text-xs text-[#8E8A81] mt-0.5">
              <span className="text-[#8FA68E] font-medium">{hikeDetails.members} {hikeDetails.members === 1 ? 'member' : 'members'}</span>
              {hikeDetails.date && <span> · {hikeDetails.date}</span>}
            </p>
          )}
        </div>
      </div>

      {/* Tab row — underline style */}
      <div className="px-4 flex items-center gap-1">
        {(['chat', 'expenses', 'files', 'hotels'] as const).map((tab) => {
          const labels: Record<string, string> = {
            chat: 'Chat', expenses: 'Expenses', files: 'Files', hotels: 'Hotels'
          };
          const active = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className={`px-3 py-2.5 text-sm font-medium border-b-2 transition-all ${
                active
                  ? 'text-[#C6A16E] border-[#C6A16E]'
                  : 'text-[#8E8A81] border-transparent hover:text-[#F5F3EE] hover:border-white/20'
              }`}
            >
              {labels[tab]}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// #endregion Component

// #region Exports
export default ChatHeader;
// #endregion Exports
