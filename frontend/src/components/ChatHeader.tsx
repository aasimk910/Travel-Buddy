import React, { useState, useEffect } from 'react';

interface ChatHeaderProps {
  hikeId?: string;
}

// Mock function to get hike details, replace with actual API call
const getHikeDetails = async (hikeId: string) => {
  const hikes = {
    'japan-trip': { name: 'Japan Trip Group', members: 3, online: 2, date: 'May 15 - 28, 2023' },
    'italy-trip': { name: 'Italy Trip Group', members: 5, online: 3, date: 'June 1 - 10, 2023' },
    'thailand-trip': { name: 'Thailand Trip Group', members: 8, online: 5, date: 'July 20 - 30, 2023' },
  };
  // @ts-ignore
  return hikes[hikeId] || { name: 'Select a Trip', members: 0, online: 0, date: '' };
};

const ChatHeader: React.FC<ChatHeaderProps> = ({ hikeId }) => {
  const [hikeDetails, setHikeDetails] = useState({ name: 'Select a Trip', members: 0, online: 0, date: '' });

  useEffect(() => {
    if (hikeId) {
      getHikeDetails(hikeId).then(setHikeDetails);
    }
  }, [hikeId]);

  return (
    <div className="border-b border-white/20">
      <div className="p-4 flex justify-between items-center">
      <div>
        <h2 className="text-xl font-bold text-glass-light">{hikeDetails.name}</h2>
        {hikeId && <p className="text-sm text-glass-dim">{hikeDetails.members} members • {hikeDetails.online} online • {hikeDetails.date}</p>}
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
