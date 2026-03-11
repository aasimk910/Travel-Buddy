import React from 'react';

interface DashboardNavProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

const DashboardNav: React.FC<DashboardNavProps> = ({ activeView, setActiveView }) => {
  return (
    <div className="glass-card rounded-lg p-4">
      <h3 className="font-semibold mb-4 text-glass">Dashboard</h3>
      <nav>
        <ul>
          <li className="mb-2"><a href="#" onClick={() => setActiveView('my-trips')} className={`block p-2 rounded-lg ${activeView === 'my-trips' ? 'font-semibold text-glass glass-strong' : 'text-glass-light glass-button'}`}>My Trips</a></li>
          <li className="mb-2"><a href="#" onClick={() => setActiveView('chat')} className={`block p-2 rounded-lg ${activeView === 'chat' ? 'font-semibold text-glass glass-strong' : 'text-glass-light glass-button'}`}>Chat</a></li>
          <li className="mb-2"><a href="#" onClick={() => setActiveView('itinerary-generator')} className={`block p-2 rounded-lg ${activeView === 'itinerary-generator' ? 'font-semibold text-glass glass-strong' : 'text-glass-light glass-button'}`}>Itinerary Generator</a></li>


        </ul>
      </nav>
    </div>
  );
};

export default DashboardNav;
