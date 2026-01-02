import React from 'react';
import { useNavigate } from 'react-router-dom';

interface TripGroupsProps {
  selectedHikeId?: string;
}

const TripGroups: React.FC<TripGroupsProps> = ({ selectedHikeId }) => {
  const navigate = useNavigate();
  // This should be fetched from an API
  const tripGroups = [
    { id: 'japan-trip', name: 'Japan Trip Group', lastMessage: 'Emma: Has anyone booked their flight y' },
    { id: 'italy-trip', name: 'Italy Trip Group', lastMessage: 'Miguel: I found a great restaurant in Rom' },
    { id: 'thailand-trip', name: 'Thailand Trip Group', lastMessage: 'Sarah: Anyone interested in a cookin' },
  ];

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
        {tripGroups.map((group) => (
          <li 
            key={group.id} 
            className={`p-2 mb-2 rounded-lg cursor-pointer glass-button ${selectedHikeId === group.id ? 'bg-white/30' : ''}`}
            onClick={() => navigate(`/dashboard/${group.id}`)}
          >
            <div className="font-semibold text-glass-light">{group.name}</div>
            <div className="text-sm text-glass-dim">{group.lastMessage}</div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TripGroups;
