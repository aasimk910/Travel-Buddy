import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import TripGroups from '../components/TripGroups';
import ChatHeader from '../components/ChatHeader';
import Chat from '../components/Chat';
import UserProfile from '../components/dashboard/UserProfile';
import DashboardNav from '../components/dashboard/DashboardNav';
import UpcomingTrips from '../components/dashboard/UpcomingTrips';
import MyTrips from '../components/dashboard/MyTrips';
import ItineraryGenerator from '../components/dashboard/ItineraryGenerator';

const Dashboard: React.FC = () => {
  const { hikeId } = useParams<{ hikeId: string }>();
  const [activeView, setActiveView] = useState('chat');

  return (
    <div className="px-4 pt-4 pb-2">
      <div className="grid grid-cols-12 gap-4">
        {/* Left Sidebar */}
        <div className="col-span-3 flex flex-col gap-4">
          <UserProfile />
          <DashboardNav activeView={activeView} setActiveView={setActiveView} />
          <UpcomingTrips />
        </div>

        {/* Main Content */}
        <div className="col-span-9">
          {activeView === 'chat' && (
            <div className="grid grid-cols-10 gap-4">
              <div className="col-span-3" style={{ height: 'calc(100vh - 120px)' }}>
                <TripGroups selectedHikeId={hikeId} />
              </div>
              <div className="col-span-7 glass-card rounded-lg flex flex-col" style={{ height: 'calc(100vh - 120px)' }}>
                <ChatHeader hikeId={hikeId} />
                <div className="flex-1 flex flex-col min-h-0">
                  <Chat roomId={hikeId} />
                </div>
              </div>
            </div>
          )}
          {activeView === 'my-trips' && <MyTrips />}
          {activeView === 'itinerary-generator' && <ItineraryGenerator />}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
