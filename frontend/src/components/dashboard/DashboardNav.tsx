import React from 'react';

const DashboardNav: React.FC = () => {
  return (
    <div className="glass-card rounded-lg p-4">
      <h3 className="font-semibold mb-4 text-glass">Dashboard</h3>
      <nav>
        <ul>
          <li className="mb-2"><a href="#" className="block p-2 rounded-lg text-glass-light glass-button">My Trips</a></li>
          <li className="mb-2"><a href="#" className="block p-2 rounded-lg font-semibold text-glass bg-white/30">Chat</a></li>
          <li className="mb-2"><a href="#" className="block p-2 rounded-lg text-glass-light glass-button">Expenses</a></li>


        </ul>
      </nav>
    </div>
  );
};

export default DashboardNav;
