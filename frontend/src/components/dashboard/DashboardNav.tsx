// src/components/dashboard/DashboardNav.tsx
// Side/top navigation for the dashboard page with tab switching (Profile, Trips, Bookings, etc.).
// #region Imports
import React from 'react';

// #endregion Imports

// #region Types
interface DashboardNavProps {
  activeView: string;
  setActiveView: (view: string) => void;
}
// #endregion Types

// #region Component
const DashboardNav: React.FC<DashboardNavProps> = ({ activeView, setActiveView }) => {
  return (
    <div className="glass-card rounded-lg p-4">
      <h3 className="font-semibold mb-4 text-glass">Dashboard</h3>
      <nav>
        <ul>
          <li className="mb-2"><a href="#" onClick={() => setActiveView('my-trips')} className={`block p-2 rounded-lg ${activeView === 'my-trips' ? 'font-semibold text-glass glass-strong' : 'text-glass-light glass-button'}`}>My Trips</a></li>
          <li className="mb-2"><a href="#" onClick={() => setActiveView('chat')} className={`block p-2 rounded-lg ${activeView === 'chat' ? 'font-semibold text-glass glass-strong' : 'text-glass-light glass-button'}`}>Chat</a></li>
          <li className="mb-2"><a href="#" onClick={() => setActiveView('itinerary-generator')} className={`block p-2 rounded-lg ${activeView === 'itinerary-generator' ? 'font-semibold text-glass glass-strong' : 'text-glass-light glass-button'}`}>Itinerary Generator</a></li>
          <li className="mb-2"><a href="#" onClick={() => setActiveView('my-bookings')} className={`block p-2 rounded-lg ${activeView === 'my-bookings' ? 'font-semibold text-glass glass-strong' : 'text-glass-light glass-button'}`}>My Bookings</a></li>
        </ul>
      </nav>
    </div>
  );
};

// #endregion Component

// #region Exports
export default DashboardNav;
// #endregion Exports
