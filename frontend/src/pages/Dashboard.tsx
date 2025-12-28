import React from 'react';
import { useParams } from 'react-router-dom';
import TripGroups from '../components/TripGroups';
import ChatHeader from '../components/ChatHeader';
import Chat from '../components/Chat';

const Dashboard: React.FC = () => {
  const { hikeId } = useParams<{ hikeId: string }>();

  return (
    <div className="flex h-screen">
      {/* Trip Groups Sidebar */}
      <div className="w-1/4 border-r">
        <TripGroups selectedHikeId={hikeId} />
      </div>

      {/* Main Content */}
      <div className="w-3/4 flex flex-col">
        <ChatHeader hikeId={hikeId} />
        <Chat hikeId={hikeId} />
      </div>
    </div>
  );
};

export default Dashboard;
