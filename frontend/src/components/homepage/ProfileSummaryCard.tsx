// src/components/homepage/ProfileSummaryCard.tsx
// Compact profile summary card shown on the homepage with avatar, name, and travel style.
// #region Imports
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { MapPin, Pencil } from "lucide-react";

// #endregion Imports

// #region Component
const ProfileSummaryCard: React.FC = () => {
  const { user } = useAuth();

  const stats = [
    user?.travelStyle && { label: "Travel Style", value: user.travelStyle },
    user?.budgetRange && { label: "Budget",        value: user.budgetRange },
    user?.interests   && { label: "Interests",     value: user.interests },
  ].filter(Boolean) as { label: string; value: string }[];

  const initials = user?.name
    ?.split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

  return (
    <div className="site-card rounded-2xl overflow-hidden" style={{ marginBottom: 0 }}>
      {/* ── Nature banner with overlay ─────────────────────────────── */}
      <div className="relative h-24 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=600')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F0C]/30 to-[#161D19]" />
        {/* Edit button */}
        <Link
          to="/profile"
          className="absolute top-3 right-3 inline-flex items-center gap-1.5 bg-[#0B0F0C]/60 border border-white/15 text-[#F5F3EE] text-[11px] font-medium rounded-md px-2.5 py-1.5 hover:bg-[#0B0F0C]/80 hover:border-[#C6A16E]/40 hover:text-[#C6A16E] transition-all"
        >
          <Pencil className="w-3 h-3" /> Edit
        </Link>
      </div>

      {/* ── Avatar (overlaps banner) ───────────────────────────────── */}
      <div className="px-5 pb-5">
        <div className="relative -mt-8 mb-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#C6A16E]/50 bg-[#1E2820] flex items-center justify-center text-xl font-bold text-[#C6A16E] shadow-lg shadow-black/40">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name || "User"} className="w-full h-full object-cover" />
            ) : (
              <span className="font-heading">{initials}</span>
            )}
          </div>
          {/* Online dot */}
          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#161D19] shadow" />
        </div>

        {/* Name & location */}
        <h2 className="text-lg font-bold text-[#F5F3EE] font-heading leading-tight">
          {user?.name || "Traveler"}
        </h2>
        <p className="text-xs text-[#8E8A81] mt-0.5 truncate">{user?.email}</p>
        {user?.country && (
          <p className="inline-flex items-center gap-1 text-[11px] text-[#8E8A81] mt-2">
            <MapPin className="w-3 h-3 text-[#C6A16E] shrink-0" />
            {user.country}
          </p>
        )}

        {/* ── Profile attributes ────────────────────────────────── */}
        {stats.length > 0 && (
          <div className="mt-4 grid grid-cols-1 gap-2">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between rounded-lg bg-[#111714] border border-white/6 px-3 py-2"
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#8E8A81]">
                  {s.label}
                </span>
                <span className="text-xs font-medium text-[#F5F3EE] capitalize ml-2 text-right">
                  {s.value}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* ── View full profile link ─────────────────────────── */}
        <Link
          to="/profile"
          className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold text-[#C6A16E] border border-[#C6A16E]/25 hover:border-[#C6A16E]/50 hover:bg-[#C6A16E]/5 transition-all"
        >
          View Full Profile
        </Link>
      </div>
    </div>
  );
};

// #endregion Component

// #region Exports
export default ProfileSummaryCard;
// #endregion Exports
