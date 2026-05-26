// src/pages/Dashboard.tsx
// User dashboard with tabbed panels: Chat, My Trips, Bookings, Itinerary.
// #region Imports
import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MessageCircle, Map, CalendarCheck, Compass, Mountain, ChevronRight } from 'lucide-react';
import TripGroups from '../components/trips/TripGroups';
import ChatHeader from '../components/chat/ChatHeader';
import Chat from '../components/chat/Chat';
import Files from '../components/trips/Files';
import Expenses from '../components/trips/Expenses';
import UserProfile from '../components/dashboard/UserProfile';
import UpcomingTrips from '../components/dashboard/UpcomingTrips';
import MyTrips from '../components/dashboard/MyTrips';
import ItineraryGenerator from '../components/dashboard/ItineraryGenerator';
import HikeHotelsPanel from '../components/dashboard/HikeHotelsPanel';
import MyBookings from '../components/dashboard/MyBookings';

// #endregion Imports

// #region Helpers
const NAV_ITEMS = [
  { id: 'chat',                label: 'Chat',         icon: MessageCircle },
  { id: 'my-trips',           label: 'My Trips',     icon: Map },
  { id: 'my-bookings',        label: 'Bookings',     icon: CalendarCheck },
  { id: 'itinerary-generator',label: 'Itinerary AI', icon: Compass },
] as const;
// #endregion Helpers

// #region Component
const Dashboard: React.FC = () => {
  const { hikeId } = useParams<{ hikeId: string }>();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<string>('chat');
  const [activeChatTab, setActiveChatTab] = useState('chat');
  const FULL_H = 'calc(100vh - 130px)';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0B0F0C]">

      {/* ══ HERO HEADER ══════════════════════════════════════════════ */}
      <div className="relative shrink-0 overflow-hidden border-b border-white/8">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1400')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F0C]/96 via-[#0B0F0C]/80 to-[#0B0F0C]/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#0B0F0C]/60" />

        <div className="relative flex items-center justify-between px-6 lg:px-10 py-3 gap-6">
          {/* Brand + title */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#C6A16E]/15 border border-[#C6A16E]/30 flex items-center justify-center shrink-0">
              <Mountain className="w-4.5 h-4.5 text-[#C6A16E]" />
            </div>
            <div className="min-w-0">
              <p className="section-label leading-none mb-0.5">My Dashboard</p>
              <h1 className="text-base font-bold text-[#F5F3EE] font-heading leading-tight">Adventure Hub</h1>
            </div>
          </div>

          {/* ── Horizontal nav tabs ────────────────────────────────── */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
              const active = activeView === id;
              return (
                <button
                  key={id}
                  onClick={() => setActiveView(id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    active
                      ? 'bg-[#C6A16E]/15 border border-[#C6A16E]/35 text-[#C6A16E]'
                      : 'text-white hover:text-[#F5F3EE] hover:bg-white/6 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${active ? 'text-[#C6A16E]' : 'text-white'}`} />
                  {label}
                </button>
              );
            })}
          </nav>

          {/* Quick links */}
          <div className="flex items-center gap-2 shrink-0">
            <Link to="/hikes" className="btn-outline inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium">
              Browse Hikes <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ══ BODY ══════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── LEFT SIDEBAR ───────────────────────────────────────────── */}
        <aside className="w-64 xl:w-72 shrink-0 flex flex-col gap-3 overflow-y-auto p-3 border-r border-white/8 bg-[#0D1210]">
          <UserProfile />
          <UpcomingTrips />
        </aside>

        {/* ── MAIN CONTENT ───────────────────────────────────────────── */}
        <main className="flex-1 overflow-hidden flex flex-col">
          {activeView === 'chat' && (
            <div className="flex h-full">
              {/* Trip groups panel */}
              <div className="w-64 xl:w-72 shrink-0 border-r border-white/8 overflow-hidden" style={{ height: FULL_H }}>
                <TripGroups selectedHikeId={hikeId} />
              </div>

              {/* Chat / tabs panel */}
              <div className="flex-1 site-card rounded-none flex flex-col overflow-hidden" style={{ height: FULL_H }}>
                <ChatHeader hikeId={hikeId} activeTab={activeChatTab} onTabChange={setActiveChatTab} />
                <div className="flex-1 flex flex-col min-h-0">
                  {activeChatTab === 'chat'     && <Chat roomId={hikeId} />}
                  {activeChatTab === 'files'    && <Files roomId={hikeId} />}
                  {activeChatTab === 'expenses' && <Expenses roomId={hikeId} />}
                  {activeChatTab === 'hotels'   && <HikeHotelsPanel hikeId={hikeId} />}
                </div>
              </div>
            </div>
          )}

          {activeView === 'my-trips' && (
            <div className="flex-1 overflow-y-auto p-5">
              <MyTrips />
            </div>
          )}

          {activeView === 'itinerary-generator' && (
            <div className="flex-1 overflow-y-auto p-5">
              <ItineraryGenerator />
            </div>
          )}

          {activeView === 'my-bookings' && (
            <div className="flex-1 overflow-y-auto p-5">
              <MyBookings />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

// #endregion Component

// #region Exports
export default Dashboard;
// #endregion Exports
