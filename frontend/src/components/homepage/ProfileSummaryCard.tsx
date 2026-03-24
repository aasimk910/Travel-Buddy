import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { MapPin } from "lucide-react";

const ProfileSummaryCard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="glass-card rounded-xl shadow-sm p-6 mb-8">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full glass-button-dark text-white flex items-center justify-center text-xl font-semibold overflow-hidden border-2 border-white/30">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name || "User"} className="w-full h-full object-cover" />
            ) : (
              <span>{user?.name?.[0]?.toUpperCase() || "U"}</span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">{user?.name || "User"}</h2>
            <p className="text-sm text-gray-200">{user?.email}</p>
            {user?.country && (
              <p className="text-xs text-gray-300 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {user.country}</p>
            )}
          </div>
        </div>
        <Link to="/profile" className="text-sm text-gray-200 hover:text-white font-medium transition-colors">
          Edit Profile
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/20">
        {user?.travelStyle && (
          <div>
            <p className="text-xs text-gray-300 mb-1">Travel Style</p>
            <p className="text-sm font-medium text-white">{user.travelStyle}</p>
          </div>
        )}
        {user?.budgetRange && (
          <div>
            <p className="text-xs text-gray-300 mb-1">Budget Range</p>
            <p className="text-sm font-medium text-white">{user.budgetRange}</p>
          </div>
        )}
        {user?.interests && (
          <div>
            <p className="text-xs text-gray-300 mb-1">Interests</p>
            <p className="text-sm font-medium text-white">{user.interests}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfileSummaryCard;
