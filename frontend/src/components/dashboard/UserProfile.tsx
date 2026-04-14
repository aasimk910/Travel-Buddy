// src/components/dashboard/UserProfile.tsx
// Dashboard profile card showing user info with navigation to the full profile editor.
// #region Imports
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MapPin, Pencil } from 'lucide-react';

// #endregion Imports

// #region Component
const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const initials = user?.name
    ?.split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  return (
    <div className="site-card rounded-2xl overflow-hidden">
      {/* Nature banner */}
      <div className="relative h-20 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=600')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F0C]/30 to-[#161D19]" />
        <button
          onClick={() => navigate('/profile', { state: { editMode: true } })}
          className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 bg-[#0B0F0C]/60 border border-white/15 text-[#F5F3EE] text-[10px] font-medium rounded-md px-2 py-1 hover:border-[#C6A16E]/40 hover:text-[#C6A16E] transition-all"
        >
          <Pencil className="w-2.5 h-2.5" /> Edit
        </button>
      </div>

      <div className="px-4 pb-4">
        {/* Avatar overlapping banner */}
        <div className="relative -mt-7 mb-3">
          <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-[#C6A16E]/45 bg-[#1E2820] flex items-center justify-center text-lg font-bold text-[#C6A16E] shadow-lg">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name || 'User'} className="w-full h-full object-cover" />
            ) : (
              <span className="font-heading">{initials}</span>
            )}
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[#161D19]" />
        </div>

        <h2 className="text-base font-bold text-[#F5F3EE] font-heading leading-tight">{user?.name || 'User'}</h2>
        <p className="text-xs text-[#8E8A81] mt-0.5 capitalize">{user?.travelStyle || 'Traveler'}</p>
        {user?.country && (
          <p className="inline-flex items-center gap-1 text-[11px] text-[#8E8A81] mt-2">
            <MapPin className="w-3 h-3 text-[#C6A16E] shrink-0" />
            {user.country}
          </p>
        )}

        <button
          onClick={() => navigate('/profile')}
          className="mt-4 w-full py-1.5 rounded-lg text-xs font-semibold text-[#C6A16E] border border-[#C6A16E]/25 hover:border-[#C6A16E]/50 hover:bg-[#C6A16E]/5 transition-all"
        >
          View Full Profile
        </button>
      </div>
    </div>
  );
};

// #endregion Component

// #region Exports
export default UserProfile;
// #endregion Exports
