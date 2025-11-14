// src/pages/Landing.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Map, Users, Compass, MessageCircle, Shield } from "lucide-react";

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top navigation – full width */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="w-full px-6 lg:px-16 xl:px-24 flex items-center justify-between h-16">
          {/* Logo */}
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="bg-gray-900 text-white p-2 rounded-lg shadow-sm">
              <Map className="w-5 h-5" />
            </div>
            <span className="text-base sm:text-lg font-semibold text-gray-900">
              Travel Buddy
            </span>
          </button>

          {/* Nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a href="#hikes" className="text-gray-600 hover:text-gray-900">
              Hikes
            </a>
            <a href="#map" className="text-gray-600 hover:text-gray-900">
              Map
            </a>
            <a href="#features" className="text-gray-600 hover:text-gray-900">
              Features
            </a>
            <a href="#community" className="text-gray-600 hover:text-gray-900">
              Community
            </a>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="hidden sm:inline-flex text-sm text-gray-700 hover:text-black"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {/* Hero – full width */}
        <section className="border-b border-gray-100 bg-white">
          <div className="w-full px-6 lg:px-16 xl:px-24 py-12 lg:py-20 grid gap-10 lg:grid-cols-2 items-center">
            {/* Left: Text */}
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Find people who travel like you
              </p>

              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-bold tracking-tight text-gray-900 mb-4">
                Find your next{" "}
                <span className="inline-block bg-gradient-to-r from-gray-900 to-gray-500 bg-clip-text text-transparent">
                  Travel Buddy
                </span>
                , not just your next trip.
              </h1>

              <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-6">
                Travel Buddy connects you with travelers who share your style,
                budget, and destinations. Plan trips together, split costs, and
                turn solo ideas into shared adventures.
              </p>

              <div className="flex flex-wrap gap-3 mb-6">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black"
                >
                  Start for free
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  I already have an account
                </Link>
              </div>

              <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>Find buddies by destination & dates</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-gray-400" />
                  <span>Profile-based matching for safer trips</span>
                </div>
              </div>
            </div>

            {/* Right: Mock "app" preview */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-sm bg-gray-900 text-white rounded-2xl shadow-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="bg-white/10 rounded-lg p-2">
                      <Map className="w-4 h-4" />
                    </div>
                    <span className="text-sm font-semibold">
                      Upcoming trips
                    </span>
                  </div>
                  <span className="text-xs text-gray-300">Sample preview</span>
                </div>

                <div className="space-y-3">
                  <div className="bg-white/5 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-semibold">
                        Lisbon &amp; Porto
                      </p>
                      <span className="text-[11px] text-emerald-300 bg-emerald-900/40 px-2 py-0.5 rounded-full">
                        3 buddies matched
                      </span>
                    </div>
                    <p className="text-xs text-gray-300">
                      Street food, hostels, and viewpoints – shared by travelers
                      who like slow, budget-friendly trips.
                    </p>
                    <div className="mt-2 flex items-center justify-between text-[11px] text-gray-400">
                      <span>Apr 12–20 · Budget</span>
                      <span>Split stays &amp; rides</span>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 flex gap-3 items-start">
                    <div className="bg-gray-800 rounded-full p-2">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold">Match by vibe</p>
                      <p className="text-[11px] text-gray-300">
                        Filter by destination, budget, travel style, and
                        interests – not just random profiles.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-xl p-3 flex gap-3 items-start">
                    <div className="bg-gray-800 rounded-full p-2">
                      <MessageCircle className="w-4 h-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-semibold">Plan together</p>
                      <p className="text-[11px] text-gray-300">
                        Share itineraries, collect suggestions, and keep
                        everything in one place before you fly.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between text-[11px] text-gray-300">
                  <span>Log in to see your real trips</span>
                  <button
                    type="button"
                    className="text-xs font-medium text-white hover:underline"
                    onClick={() => navigate("/login")}
                  >
                    Go to dashboard →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How it works – full width */}
        <section
          id="how-it-works"
          className="bg-gray-50 border-b border-gray-100"
        >
          <div className="w-full px-6 lg:px-16 xl:px-24 py-10 sm:py-14">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 text-center mb-2">
              How Travel Buddy works
            </h2>
            <p className="text-sm text-gray-600 text-center max-w-2xl mx-auto mb-8">
              In a few steps, you go from “I want to travel” to “I have a plan –
              and people to go with.”
            </p>

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold mb-3">
                  1
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Create your travel profile
                </h3>
                <p className="text-xs text-gray-600">
                  Share where you&apos;re from, how you like to travel, your
                  budget, and what you enjoy – from night markets to mountain
                  hikes.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold mb-3">
                  2
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Match with compatible buddies
                </h3>
                <p className="text-xs text-gray-600">
                  Browse travelers going to the same destinations and dates. Use
                  filters to find people who share your pace and priorities.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold mb-3">
                  3
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Plan the trip together
                </h3>
                <p className="text-xs text-gray-600">
                  Share itineraries, collect ideas, and keep stays, activities,
                  and costs in one organized space – before you ever pack.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features – full width */}
        <section id="features" className="bg-white border-b border-gray-100">
          <div className="w-full px-6 lg:px-16 xl:px-24 py-10 sm:py-14">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div className="max-w-xl">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  Built for real travelers, not just “followers”
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Travel Buddy is about people who actually want to go –
                  coordinate dates, share routes, and make decisions together.
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
                <div className="w-9 h-9 rounded-lg bg-gray-900 text-white flex items-center justify-center mb-3">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Matches by travel style
                </h3>
                <p className="text-xs text-gray-600">
                  Introvert backpacker? Food-obsessed city explorer? You&apos;re
                  more than just &quot;looking for a trip&quot; – your profile
                  highlights what makes you a good match.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
                <div className="w-9 h-9 rounded-lg bg-gray-900 text-white flex items-center justify-center mb-3">
                  <Compass className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Shared planning tools
                </h3>
                <p className="text-xs text-gray-600">
                  Keep dates, locations, and ideas in one place instead of 10
                  different chats. You stay aligned from &quot;let&apos;s
                  go&quot; to landing at the airport.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
                <div className="w-9 h-9 rounded-lg bg-gray-900 text-white flex items-center justify-center mb-3">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Safer connections
                </h3>
                <p className="text-xs text-gray-600">
                  Profiles are built around travel – not swiping. You decide who
                  to message, who to add to your trip, and when to share
                  details.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Community CTA – full width */}
        <section id="community" className="bg-gray-50 border-b border-gray-100">
          <div className="w-full px-6 lg:px-16 xl:px-24 py-10 sm:py-14">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-8 sm:px-8 sm:py-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
              <div className="max-w-xl">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2">
                  Ready to find your next Travel Buddy?
                </h2>
                <p className="text-sm text-gray-600">
                  Whether you&apos;re planning a weekend escape or a long-term
                  adventure, Travel Buddy helps you find people who actually
                  want to go when you do.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black"
                >
                  Create my profile
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  Log in instead
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer – full width */}
      <footer className="bg-white border-t border-gray-100">
        <div className="w-full px-6 lg:px-16 xl:px-24 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Travel Buddy. Built for real travelers.
          </p>
          <div className="flex gap-4 text-xs text-gray-500">
            <button className="hover:text-gray-800">Privacy</button>
            <button className="hover:text-gray-800">Terms</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
