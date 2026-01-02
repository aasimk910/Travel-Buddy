import React from 'react';
import { useParams } from 'react-router-dom';
import TripGroups from '../components/TripGroups';
import ChatHeader from '../components/ChatHeader';
import Chat from '../components/Chat';
import UserProfile from '../components/dashboard/UserProfile';
import DashboardNav from '../components/dashboard/DashboardNav';
import UpcomingTrips from '../components/dashboard/UpcomingTrips';

const Dashboard: React.FC = () => {
  const { hikeId } = useParams<{ hikeId: string }>();

  return (
    <div className="p-4">
      <div className="grid grid-cols-12 gap-4">
        {/* Left Sidebar */}
        <div className="col-span-3 flex flex-col gap-4">
          <UserProfile />
          <DashboardNav />
          <UpcomingTrips />
        </div>

        {/* Main Content */}
        <div className="col-span-9 grid grid-cols-10 gap-4">
          {/* Trip Groups */}
          <div className="col-span-3">
            <TripGroups selectedHikeId={hikeId} />
          </div>
          {/* Chat Area */}
          <div className="col-span-7 glass-card rounded-lg flex flex-col">
            <ChatHeader hikeId={hikeId} />
            <Chat hikeId={hikeId} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
