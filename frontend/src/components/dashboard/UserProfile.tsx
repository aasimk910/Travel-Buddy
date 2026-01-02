import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <div className="glass-card rounded-lg p-4 text-center text-glass">
      <img src={user?.avatarUrl || '/path-to-avatar.png'} alt={user?.name || 'User'} className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" />
      <h2 className="text-xl font-semibold">{user?.name || 'User'}</h2>
      <p className="text-glass-dim">{user?.travelStyle || 'Traveler'}</p>
      <div className="text-left mt-4">
        <p><strong>Location:</strong> {user?.country || 'Not specified'}</p>
                      </div>
      <div className="mt-4">
                      </div>
      <div className="flex justify-around mt-4">
        <button onClick={() => navigate('/profile')} className="glass-button-dark px-4 py-2 rounded-lg">View Profile</button>
        <button onClick={() => navigate('/profile')} className="glass-button px-4 py-2 rounded-lg">Edit Profile</button>
      </div>
    </div>
  );
};

export default UserProfile;
