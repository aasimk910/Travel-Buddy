// src/components/ChatHeader.tsx
// Displays hike title and participant count at the top of the chat panel.
// #region Imports
import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/env';

// #endregion Imports
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
    <div className="border-b border-white/20">
      <div className="p-4 flex justify-between items-center">
      <div>
        <h2 className="text-xl font-bold text-glass-light">{hikeDetails.name}</h2>
        {hikeId && <p className="text-sm text-glass-dim">{hikeDetails.members} {hikeDetails.members === 1 ? 'member' : 'members'} — {hikeDetails.date}</p>}
      </div>

      </div>
      <div className="p-4 flex space-x-4">
        <button 
          onClick={() => onTabChange('chat')}
          className={`px-3 py-1 rounded-md font-semibold ${activeTab === 'chat' ? 'bg-white/10 text-glass' : 'text-glass-dim hover:bg-white/10 hover:text-glass'}`}
        >
          Chat
        </button>
        <button 
          onClick={() => onTabChange('expenses')}
          className={`px-3 py-1 rounded-md font-semibold ${activeTab === 'expenses' ? 'bg-white/10 text-glass' : 'text-glass-dim hover:bg-white/10 hover:text-glass'}`}
        >
          Expenses
        </button>
        <button 
          onClick={() => onTabChange('files')}
          className={`px-3 py-1 rounded-md font-semibold ${activeTab === 'files' ? 'bg-white/10 text-glass' : 'text-glass-dim hover:bg-white/10 hover:text-glass'}`}
        >
          Files
        </button>
        <button
          onClick={() => onTabChange('hotels')}
          className={`px-3 py-1 rounded-md font-semibold ${activeTab === 'hotels' ? 'bg-white/10 text-glass' : 'text-glass-dim hover:bg-white/10 hover:text-glass'}`}
        >
          Hotels
        </button>
      </div>
    </div>
  );
};

// #region Exports
export default ChatHeader;
// #endregion Exports
