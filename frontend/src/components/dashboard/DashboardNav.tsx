// src/components/dashboard/DashboardNav.tsx
// Side/top navigation for the dashboard page with tab switching (Profile, Trips, Bookings, etc.).
// #region Imports
import React from 'react';
import { MessageCircle, Map, CalendarCheck, Hotel, Compass } from 'lucide-react';

// #endregion Imports

// #region Types
interface DashboardNavProps {
  activeView: string;
  setActiveView: (view: string) => void;
}
// #endregion Types

// #region Component
const ITEMS = [
  { id: 'chat',                label: 'Chat',               icon: MessageCircle },
  { id: 'my-trips',           label: 'My Trips',           icon: Map },
  { id: 'my-bookings',        label: 'My Bookings',        icon: CalendarCheck },
  { id: 'itinerary-generator',label: 'Itinerary AI',       icon: Compass },
] as const;

const DashboardNav: React.FC<DashboardNavProps> = ({ activeView, setActiveView }) => {
  return (
    <div className="site-card rounded-xl p-3">
      <p className="section-label px-2 mb-3">Navigation</p>
      <nav>
        <ul className="space-y-1">
          {ITEMS.map(({ id, label, icon: Icon }) => {
            const active = activeView === id;
            return (
              <li key={id}>
                <button
                  onClick={() => setActiveView(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                    active
                      ? 'bg-[#C6A16E]/[0.12] border border-[#C6A16E]/30 text-[#C6A16E]'
                      : 'border border-transparent text-white hover:bg-white/5 hover:text-[#F5F3EE]'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${
                    active ? 'text-[#C6A16E]' : 'text-white group-hover:text-[#C6A16E]'
                  } transition-colors`} />
                  {label}
                  {active && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-[#C6A16E]" />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
};

// #endregion Component

// #region Exports
export default DashboardNav;
// #endregion Exports
