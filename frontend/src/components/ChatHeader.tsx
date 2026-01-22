import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config/env';

interface ChatHeaderProps {
  hikeId?: string;
}

interface HikeDetails {
  title: string;
  location: string;
  date: string;
  participants?: string[];
}

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
    if (!res.ok) return null;
    return await res.json();
  } catch (error) {
    console.error("Failed to fetch hike details:", error);
    return null;
  }
};

const ChatHeader: React.FC<ChatHeaderProps> = ({ hikeId }) => {
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
        {hikeId && <p className="text-sm text-glass-dim">{hikeDetails.members} {hikeDetails.members === 1 ? 'member' : 'members'} • {hikeDetails.date}</p>}
      </div>
      <div className="flex items-center space-x-4">
        <button className="text-glass-dim hover:text-glass-light">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        </button>
      </div>
      </div>
      <div className="p-4 flex space-x-4">
        <a href="#" className="px-3 py-1 rounded-md bg-white/10 text-glass font-semibold">Chat</a>
        <a href="#" className="px-3 py-1 rounded-md text-glass-dim hover:bg-white/10 hover:text-glass">Expenses</a>
        <a href="#" className="px-3 py-1 rounded-md text-glass-dim hover:bg-white/10 hover:text-glass">Itinerary</a>
        <a href="#" className="px-3 py-1 rounded-md text-glass-dim hover:bg-white/10 hover:text-glass">Files</a>
      </div>
    </div>
  );
};

export default ChatHeader;
