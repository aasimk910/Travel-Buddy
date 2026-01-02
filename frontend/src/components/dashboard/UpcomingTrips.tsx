import React from 'react';

const UpcomingTrips: React.FC = () => {
  return (
    <div className="glass-card rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-glass">Upcoming Trips</h3>
        <a href="#" className="text-sm text-glass-light hover:text-white">View all</a>
      </div>
      <ul>
        <li className="mb-4 p-2 rounded-lg glass-button">
          <p className="font-semibold text-glass-light">Japan Adventure</p>
          <p className="text-sm text-glass-dim">May 15 - 28, 2023</p>
        </li>
        <li className="p-2 rounded-lg glass-button">
          <p className="font-semibold text-glass-light">South America Tour</p>
          <p className="text-sm text-glass-dim">Oct 5 - Nov 10, 2023</p>
        </li>
      </ul>
    </div>
  );
};

export default UpcomingTrips;
