// src/pages/Landing.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Map, Users, Compass, MessageCircle, Shield } from "lucide-react";

const Landing: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Top navigation */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
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
            <Link
              to="/"
              className="text-gray-900 font-medium border-b-2 border-gray-900 pb-1"
            >
              Home
            </Link>
            <Link
              to="/hikes"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Hikes
            </Link>
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
              className="inline-flex items-center justify-center rounded-full bg-gray-900 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black"
            >
              Get started
            </Link>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {/* Hero section */}
        <section className="bg-white border-b border-gray-100">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-20 grid gap-10 lg:grid-cols-2 items-center">
            {/* Left: text */}
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
                  className="inline-flex items-center justify-center rounded-full bg-gray-900 px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-black"
                >
                  Start for free
                </Link>
                <Link
                  to="/hikes"
                  className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  Explore hikes
                </Link>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>Trusted by small travel groups worldwide</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Profile checks & safety tips built in</span>
                </div>
              </div>
            </div>

            {/* Right: preview card */}
            <div className="lg:justify-self-end w-full max-w-md">
              <div className="rounded-2xl bg-gray-900 text-white p-5 sm:p-6 shadow-xl">
                <p className="text-xs font-medium text-gray-300 mb-2">
                  Upcoming group hikes
                </p>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-xl bg-gray-800/70 px-3 py-2">
                    <div>
                      <p className="font-semibold">Sunrise ridge walk</p>
                      <p className="text-[11px] text-gray-300">
                        Banff • Easy • 4 people going
                      </p>
                    </div>
                    <span className="text-[11px] rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5">
                      2 spots left
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-gray-800/70 px-3 py-2">
                    <div>
                      <p className="font-semibold">Alpine lake loop</p>
                      <p className="text-[11px] text-gray-300">
                        Switzerland • Moderate • 6 people going
                      </p>
                    </div>
                    <span className="text-[11px] rounded-full bg-gray-100 text-gray-900 px-2 py-0.5">
                      New
                    </span>
                  </div>
                  <div className="flex items-center justify-between rounded-xl bg-gray-800/70 px-3 py-2">
                    <div>
                      <p className="font-semibold">Weekend city foodie tour</p>
                      <p className="text-[11px] text-gray-300">
                        Lisbon • Budget • 3–5 travelers
                      </p>
                    </div>
                    <span className="text-[11px] rounded-full bg-gray-700 px-2 py-0.5">
                      City trip
                    </span>
                  </div>
                </div>
                <p className="mt-4 text-[11px] text-gray-300">
                  Log in to see trips that match your dates, budget, and travel
                  style.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Preview hikes section */}
        <section id="hikes" className="bg-gray-50 border-b border-gray-100">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900">
                  Join group hikes near you
                </h2>
                <p className="text-sm text-gray-600">
                  A quick preview of what you’ll find on the Hikes page.
                </p>
              </div>
              <Link
                to="/hikes"
                className="hidden sm:inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50"
              >
                View all hikes
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-28 bg-[url('https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800')] bg-cover bg-center" />
                <div className="p-4">
                  <p className="text-xs text-gray-400 mb-1">
                    Banff National Park • Canada
                  </p>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Hot Springs Sunrise Hike
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Easy pace, perfect for first-time group hikers.
                  </p>
                  <p className="mt-3 text-[11px] text-gray-500">
                    Difficulty: 1/5 • 3 spots left
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-28 bg-[url('https://images.pexels.com/photos/552785/pexels-photo-552785.jpeg?auto=compress&cs=tinysrgb&w=800')] bg-cover bg-center" />
                <div className="p-4">
                  <p className="text-xs text-gray-400 mb-1">
                    Dolomites • Italy
                  </p>
                  <h3 className="text-sm font-semibold text-gray-900">
                    Through the Heart of the Peaks
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Full-day route with big views and shared snacks.
                  </p>
                  <p className="mt-3 text-[11px] text-gray-500">
                    Difficulty: 4/5 • 6 spots left
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-28 bg-[url('https://images.pexels.com/photos/1028225/pexels-photo-1028225.jpeg?auto=compress&cs=tinysrgb&w=800')] bg-cover bg-center" />
                <div className="p-4">
                  <p className="text-xs text-gray-400 mb-1">
                    Lisbon • Portugal
                  </p>
                  <h3 className="text-sm font-semibold text-gray-900">
                    City View Sunset Walk
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Short evening walk ending at a lookout with snacks.
                  </p>
                  <p className="mt-3 text-[11px] text-gray-500">
                    Difficulty: 2/5 • 4 spots left
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 sm:hidden">
              <Link
                to="/hikes"
                className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-4 py-1.5 text-xs font-medium text-gray-800 hover:bg-gray-50"
              >
                View all hikes
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="bg-gray-50 border-b border-gray-100"
        >
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 text-center mb-2">
              How Travel Buddy works
            </h2>
            <p className="text-sm text-gray-600 text-center max-w-xl mx-auto mb-8">
              We keep things simple: share how you like to travel, match with
              compatible people, and build trips together that feel natural.
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
                  Filter by destination, dates, and travel style. Join existing
                  trips or start your own and invite others.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-semibold mb-3">
                  3
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  Plan safely & share costs
                </h3>
                <p className="text-xs text-gray-600">
                  Use group chat, shared itineraries, and safety tips to plan
                  everything – from hostels and rides to activities and food.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="bg-white border-b border-gray-100">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-6">
              Built for real travelers, not just influencers
            </h2>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
                <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center mb-3">
                  <Compass className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Match by travel style
                </h3>
                <p className="text-xs text-gray-600">
                  Backpacker, slow traveler, weekend hiker – match with people
                  who move through the world like you do.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
                <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center mb-3">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Small groups, big memories
                </h3>
                <p className="text-xs text-gray-600">
                  Keep trips small and flexible. Perfect for 2–6 people instead
                  of huge tour buses.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl border border-gray-100 p-5">
                <div className="w-8 h-8 rounded-lg bg-gray-900 text-white flex items-center justify-center mb-3">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Safety-first design
                </h3>
                <p className="text-xs text-gray-600">
                  Safety tips, profile transparency, and shared planning tools
                  help you feel confident before you say yes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Community / testimonials */}
        <section id="community" className="bg-gray-50 border-b border-gray-100">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
            <div className="grid gap-8 md:grid-cols-[1.3fr_minmax(0,1fr)] items-center">
              <div>
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-3">
                  A community of travelers who actually reply
                </h2>
                <p className="text-sm text-gray-600 mb-5">
                  No ghosting, no endless scrolling. Travel Buddy is designed
                  around real conversations, shared planning, and mutual
                  respect.
                </p>
                <ul className="space-y-2 text-xs text-gray-700">
                  <li>• Join or create focused groups around cities or hikes</li>
                  <li>• Share itineraries, maps, and packing lists</li>
                  <li>• Keep everything in one place instead of random chats</li>
                </ul>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-medium text-gray-800">
                    Real story from a small hiking group
                  </p>
                </div>
                <p className="text-xs text-gray-700 mb-2">
                  “We were three strangers who met on Travel Buddy for a weekend
                  trip. Now we plan at least one hike together every month.”
                </p>
                <p className="text-[11px] text-gray-500">— Lina, Prague</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-gray-900">
          <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                Ready to find your next travel buddy?
              </h2>
              <p className="text-sm text-gray-300 max-w-xl">
                Create a free profile in under two minutes. You can decide later
                which trips to actually say yes to.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center rounded-full bg-white px-5 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-100"
              >
                Get started
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center rounded-full border border-gray-400 bg-transparent px-5 py-2 text-sm font-medium text-gray-100 hover:bg-gray-800"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
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
