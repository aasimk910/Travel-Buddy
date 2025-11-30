// src/pages/Dashboard.tsx
import React from "react";

const Dashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="bg-white rounded-xl shadow-sm border border-black px-6 py-8 max-w-xl w-full">
        <h1 className="text-2xl font-semibold text-black mb-2">
          Travel Buddy Dashboard
        </h1>
        <p className="text-gray-600">
          You signed up with Google successfully. This is your starting dashboard –
          you can now add upcoming trips, match with buddies, and plan itineraries.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
