// src/pages/Landing.tsx
// #region Imports
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Map, Users, Compass, MessageCircle, Shield, LayoutDashboard, LogOut, ChevronRight, TrendingUp, Mountain, Camera } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getSiteStats, getUpcomingHikes, type SiteStats, type Hike } from "../services/hikes";
import { useScrollReveal } from "../hooks/useScrollReveal";

// #endregion Imports

// #region Component
const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  const revealRef = useScrollReveal();
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);
  const [upcomingHikes, setUpcomingHikes] = useState<Hike[]>([]);
  const heroTextRef = useRef<HTMLDivElement>(null);
  const heroCardRef = useRef<HTMLDivElement>(null);
  const heroBlobsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getSiteStats().then(setSiteStats).catch(() => {});
    getUpcomingHikes(3).then(setUpcomingHikes).catch(() => {});
  }, []);

  // Parallax on scroll
  useEffect(() => {
    // Handles handleScroll logic.
    const handleScroll = () => {
      const y = window.scrollY;
      if (heroTextRef.current) {
        heroTextRef.current.style.transform = `translateY(${y * 0.18}px)`;
      }
      if (heroCardRef.current) {
        heroCardRef.current.style.transform = `translateY(${y * 0.1}px)`;
      }
      if (heroBlobsRef.current) {
        heroBlobsRef.current.style.transform = `translateY(${y * 0.28}px)`;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Handles handleLogout logic.
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col" ref={revealRef}>
      {/* Top navigation */}
      <header className="glass-nav">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 flex items-center justify-between h-16">
          {/* Logo */}
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="glass-button-dark p-2 rounded-lg shadow-sm">
              <Map className="w-5 h-5 text-white" />
            </div>
            <span className="text-base sm:text-lg font-semibold text-white">
              Travel Buddy
            </span>
          </button>

          {/* Nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link to="/" className="text-white font-medium border-b-2 border-white pb-1">Home</Link>
            <Link to="/hikes" className="text-gray-200 hover:text-white transition-colors">Hikes</Link>
            <Link to="/maps" className="text-gray-200 hover:text-white transition-colors">Maps</Link>
            <Link to="/shop" className="text-gray-200 hover:text-white transition-colors">Shop</Link>
            <Link to="/about" className="text-gray-200 hover:text-white transition-colors">About</Link>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Avatar / name */}
                <button
                  onClick={() => navigate("/dashboard")}
                  className="hidden sm:flex items-center gap-2 text-sm text-gray-200 hover:text-white transition-colors"
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover border border-white/30" />
                  ) : (
                    <div className="w-7 h-7 rounded-full glass-button-dark flex items-center justify-center text-xs font-semibold text-white">
                      {user?.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                  )}
                  <span className="max-w-[120px] truncate">{user?.name}</span>
                </button>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-1.5 rounded-full glass-button-dark px-4 py-1.5 text-sm font-medium text-white shadow-sm"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center justify-center rounded-full glass-button px-3 py-1.5 text-sm text-gray-200 hover:text-white transition-colors gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex text-sm text-gray-200 hover:text-white transition-colors"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center rounded-full glass-button-dark px-4 py-1.5 text-sm font-medium text-white shadow-sm"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1">
        {/* Hero section */}
        <section className="py-12 lg:py-20 relative overflow-hidden">
          {/* Floating decorative blobs — parallax layer */}
          <div ref={heroBlobsRef} className="pointer-events-none absolute inset-0 overflow-hidden will-change-transform" aria-hidden>
            <div className="float-slow absolute -top-10 left-[8%] w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="float-medium absolute top-20 right-[10%] w-40 h-40 rounded-full bg-purple-400/10 blur-3xl" style={{ animationDelay: '1.2s' }} />
            <div className="drift absolute bottom-10 left-[40%] w-32 h-32 rounded-full bg-emerald-400/10 blur-2xl" />
            <div className="float-fast absolute top-1/2 left-[60%] w-20 h-20 rounded-full bg-sky-400/15 blur-xl" style={{ animationDelay: '0.8s' }} />
          </div>

          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 grid gap-10 lg:grid-cols-2 items-center">
            {/* Left: text — parallax layer */}
            <div ref={heroTextRef} className="max-w-xl will-change-transform">
              <p className="reveal reveal-fade inline-flex items-center gap-2 rounded-full glass-strong px-3 py-1 text-xs font-medium text-black mb-4">
                {isAuthenticated ? (
                  <><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Welcome back, {user?.name?.split(' ')[0] ?? 'traveler'}!</>
                ) : (
                  <><span className="w-2 h-2 rounded-full bg-emerald-500" />Find people who travel like you</>
                )}
              </p>

              <h1 className="reveal reveal-up delay-100 text-3xl sm:text-4xl xl:text-5xl font-bold tracking-tight text-white mb-4">
                {isAuthenticated ? (
                  <>Your next adventure<br />
                    <span className="inline-block bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                      is waiting for you.
                    </span>
                  </>
                ) : (
                  <>Find your next{" "}
                    <span className="inline-block bg-gradient-to-r from-white to-gray-200 bg-clip-text text-transparent">
                      Travel Buddy
                    </span>
                    , not just your next trip.
                  </>
                )}
              </h1>

              <p className="reveal reveal-up delay-200 text-gray-200 text-sm sm:text-base leading-relaxed mb-6">
                {isAuthenticated
                  ? "Head to your dashboard to manage trips, connect with buddies, track expenses, and plan your next hike."
                  : "Travel Buddy connects you with travelers who share your style, budget, and destinations. Plan trips together, split costs, and turn solo ideas into shared adventures."}
              </p>

              <div className="reveal reveal-up delay-300 flex flex-wrap gap-3 mb-6">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="inline-flex items-center justify-center gap-2 rounded-full glass-button-dark px-5 py-2 text-sm font-semibold text-white shadow-sm"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                    </Link>
                    <Link
                      to="/hikes"
                      className="inline-flex items-center justify-center gap-1.5 rounded-full glass-button px-5 py-2 text-sm font-medium text-white"
                    >
                      Explore hikes <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      className="inline-flex items-center justify-center rounded-full glass-button-dark px-5 py-2 text-sm font-semibold text-white shadow-sm"
                    >
                      Start for free
                    </Link>
                    <Link
                      to="/hikes"
                      className="inline-flex items-center justify-center rounded-full glass-button px-5 py-2 text-sm font-medium text-white"
                    >
                      Explore hikes
                    </Link>
                  </>
                )}
              </div>

              <div className="reveal reveal-fade delay-400 flex flex-wrap items-center gap-4 text-xs text-gray-300">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>Trusted by small travel groups worldwide</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Profile checks & safety tips built in</span>
                </div>
              </div>

              {/* Animated floating stat pills */}
              <div className="reveal reveal-fade delay-500 mt-6 flex flex-wrap gap-3">
                <div className="float-slow inline-flex items-center gap-2 rounded-full glass-strong px-3 py-1.5 text-xs font-medium text-black shadow-sm">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                  {siteStats ? `${siteStats.hikeCount}+ hikes listed` : "hikes listed"}
                </div>
                <div className="float-medium inline-flex items-center gap-2 rounded-full glass-strong px-3 py-1.5 text-xs font-medium text-black shadow-sm" style={{ animationDelay: '1s' }}>
                  <Users className="w-3.5 h-3.5 text-indigo-600" />
                  {siteStats ? `${siteStats.userCount}+ travelers` : "travelers"}
                </div>
                <div className="float-fast inline-flex items-center gap-2 rounded-full glass-strong px-3 py-1.5 text-xs font-medium text-black shadow-sm" style={{ animationDelay: '0.5s' }}>
                  <Mountain className="w-3.5 h-3.5 text-purple-600" />
                  {siteStats ? `${siteStats.upcomingHikes} upcoming hikes` : "upcoming hikes"}
                </div>
                <div className="drift inline-flex items-center gap-2 rounded-full glass-strong px-3 py-1.5 text-xs font-medium text-black shadow-sm" style={{ animationDelay: '1.8s' }}>
                  <Camera className="w-3.5 h-3.5 text-rose-600" />
                  {siteStats ? `${siteStats.photoCount}+ photos shared` : "photos shared"}
                </div>
              </div>
            </div>

            {/* Right: preview card — parallax layer */}
            <div ref={heroCardRef} className="reveal reveal-right delay-200 lg:justify-self-end w-full max-w-md will-change-transform">
              <div className="rounded-2xl glass-dark text-white p-5 sm:p-6 shadow-xl float-slow">
                <p className="text-xs font-medium text-gray-300 mb-2">
                  Upcoming group hikes
                </p>
                <div className="space-y-3 text-sm">
                  {upcomingHikes.length === 0 ? (
                    <p className="text-[11px] text-gray-400">No upcoming hikes at the moment. Check back soon!</p>
                  ) : (
                    upcomingHikes.map((hike) => {
                      const difficultyLabel = hike.difficulty <= 1 ? "Easy" : hike.difficulty <= 2 ? "Moderate" : hike.difficulty <= 3 ? "Challenging" : hike.difficulty <= 4 ? "Hard" : "Expert";
                      const going = hike.participants?.length ?? 0;
                      const isNew = (Date.now() - new Date(hike.createdAt || hike.date).getTime()) < 3 * 24 * 60 * 60 * 1000;
                      return (
                        <div key={hike._id} className="glass-dark flex items-center justify-between rounded-xl px-3 py-2">
                          <div>
                            <p className="font-semibold line-clamp-1">{hike.title}</p>
                            <p className="text-[11px] text-gray-300">
                              {hike.location} • {difficultyLabel} {going > 0 ? `• ${going} going` : ""}
                            </p>
                          </div>
                          {isNew ? (
                            <span className="text-[11px] rounded-full glass-strong text-white px-2 py-0.5">New</span>
                          ) : hike.spotsLeft > 0 ? (
                            <span className="text-[11px] rounded-full bg-emerald-500/20 text-emerald-300 px-2 py-0.5">{hike.spotsLeft} left</span>
                          ) : (
                            <span className="text-[11px] rounded-full bg-red-500/20 text-red-300 px-2 py-0.5">Full</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="mt-4 text-[11px] text-gray-300">
                  {isAuthenticated
                    ? "Visit your dashboard to see trips matched to your travel style."
                    : "Log in to see trips that match your dates, budget, and travel style."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Moving ticker strip */}
        <div className="overflow-hidden border-y border-white/10 bg-white/5 backdrop-blur-sm py-3 select-none">
          <div className="ticker-track">
            {[
              { flag: "🏔️", label: "Everest Base Camp" },
              { flag: "🗻", label: "Annapurna Circuit" },
              { flag: "🌿", label: "Langtang Valley" },
              { flag: "⛰️", label: "Manaslu Trek" },
              { flag: "🏕️", label: "Gokyo Lakes" },
              { flag: "🌄", label: "Poon Hill, Ghorepani" },
              { flag: "🦅", label: "Upper Mustang" },
              { flag: "💧", label: "Rara Lake" },
              { flag: "🏞️", label: "Chitwan National Park" },
              { flag: "🌸", label: "Pokhara, Lakeside" },
              { flag: "🏔️", label: "Everest Base Camp" },
              { flag: "🗻", label: "Annapurna Circuit" },
              { flag: "🌿", label: "Langtang Valley" },
              { flag: "⛰️", label: "Manaslu Trek" },
              { flag: "🏕️", label: "Gokyo Lakes" },
              { flag: "🌄", label: "Poon Hill, Ghorepani" },
              { flag: "🦅", label: "Upper Mustang" },
              { flag: "💧", label: "Rara Lake" },
              { flag: "🏞️", label: "Chitwan National Park" },
              { flag: "🌸", label: "Pokhara, Lakeside" },
            ].map((item, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-2 px-6 text-sm text-gray-200 whitespace-nowrap"
              >
                <span className="text-base">{item.flag}</span>
                {item.label}
                <span className="ml-4 w-1 h-1 rounded-full bg-white/30 inline-block" />
              </span>
            ))}
          </div>
        </div>

        {/* Preview hikes section */}
        <section id="hikes" className="py-10 sm:py-14">
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div className="reveal reveal-up">
                <h2 className="text-xl sm:text-2xl font-semibold text-white">
                  Join group hikes near you
                </h2>
                <p className="text-sm text-gray-200">
                  A quick preview of what you'll find on the Hikes page.
                </p>
              </div>
              <Link
                to="/hikes"
                className="hidden sm:inline-flex items-center justify-center rounded-full glass-button px-4 py-1.5 text-xs font-medium text-white"
              >
                View all hikes
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="glass-card rounded-xl shadow-sm overflow-hidden reveal reveal-up delay-100">
                <div className="h-28 bg-[url('https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800')] bg-cover bg-center" />
                <div className="p-4">
                  <p className="text-xs text-gray-300 mb-1">
                    Banff National Park • Canada
                  </p>
                  <h3 className="text-sm font-semibold text-white">
                    Hot Springs Sunrise Hike
                  </h3>
                  <p className="text-xs text-gray-200 mt-1">
                    Easy pace, perfect for first-time group hikers.
                  </p>
                  <p className="mt-3 text-[11px] text-gray-300">
                    Difficulty: 1/5 • 3 spots left
                  </p>
                </div>
              </div>

              <div className="glass-card rounded-xl shadow-sm overflow-hidden reveal reveal-up delay-200">
                <div className="h-28 bg-[url('https://images.pexels.com/photos/552785/pexels-photo-552785.jpeg?auto=compress&cs=tinysrgb&w=800')] bg-cover bg-center" />
                <div className="p-4">
                  <p className="text-xs text-gray-300 mb-1">
                    Dolomites • Italy
                  </p>
                  <h3 className="text-sm font-semibold text-white">
                    Through the Heart of the Peaks
                  </h3>
                  <p className="text-xs text-gray-200 mt-1">
                    Full-day route with big views and shared snacks.
                  </p>
                  <p className="mt-3 text-[11px] text-gray-300">
                    Difficulty: 4/5 • 6 spots left
                  </p>
                </div>
              </div>

              <div className="glass-card rounded-xl shadow-sm overflow-hidden reveal reveal-up delay-300">
                <div className="h-28 bg-[url('https://images.pexels.com/photos/1028225/pexels-photo-1028225.jpeg?auto=compress&cs=tinysrgb&w=800')] bg-cover bg-center" />
                <div className="p-4">
                  <p className="text-xs text-gray-300 mb-1">
                    Lisbon • Portugal
                  </p>
                  <h3 className="text-sm font-semibold text-white">
                    City View Sunset Walk
                  </h3>
                  <p className="text-xs text-gray-200 mt-1">
                    Short evening walk ending at a lookout with snacks.
                  </p>
                  <p className="mt-3 text-[11px] text-gray-300">
                    Difficulty: 2/5 • 4 spots left
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 sm:hidden">
              <Link
                to="/hikes"
                className="inline-flex items-center justify-center rounded-full glass-button px-4 py-1.5 text-xs font-medium text-white"
              >
                View all hikes
              </Link>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section
          id="how-it-works"
          className="py-10 sm:py-14"
        >
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
            <h2 className="reveal reveal-up text-xl sm:text-2xl font-semibold text-white text-center mb-2">
              How Travel Buddy works
            </h2>
            <p className="reveal reveal-fade delay-100 text-sm text-gray-200 text-center max-w-xl mx-auto mb-8">
              We keep things simple: share how you like to travel, match with
              compatible people, and build trips together that feel natural.
            </p>

            <div className="grid gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <div className="glass-card rounded-xl shadow-sm p-5 reveal reveal-up delay-200">
                <div className="w-9 h-9 rounded-full glass-button-dark text-white flex items-center justify-center text-xs font-semibold mb-3">
                  1
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Create your travel profile
                </h3>
                <p className="text-xs text-gray-200">
                  Share where you&apos;re from, how you like to travel, your
                  budget, and what you enjoy – from night markets to mountain
                  hikes.
                </p>
              </div>

              <div className="glass-card rounded-xl shadow-sm p-5 reveal reveal-up delay-300">
                <div className="w-9 h-9 rounded-full glass-button-dark text-white flex items-center justify-center text-xs font-semibold mb-3">
                  2
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Match with compatible buddies
                </h3>
                <p className="text-xs text-gray-200">
                  Filter by destination, dates, and travel style. Join existing
                  trips or start your own and invite others.
                </p>
              </div>

              <div className="glass-card rounded-xl shadow-sm p-5 reveal reveal-up delay-400">
                <div className="w-9 h-9 rounded-full glass-button-dark text-white flex items-center justify-center text-xs font-semibold mb-3">
                  3
                </div>
                <h3 className="text-sm font-semibold text-white mb-2">
                  Plan safely & share costs
                </h3>
                <p className="text-xs text-gray-200">
                  Use group chat, shared itineraries, and safety tips to plan
                  everything – from hostels and rides to activities and food.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-10 sm:py-14">
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
            <h2 className="reveal reveal-up text-xl sm:text-2xl font-semibold text-white mb-6">
              Built for real travelers, not just influencers
            </h2>

            <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <div className="glass-card rounded-xl p-5 reveal reveal-up delay-100">
                <div className="w-8 h-8 rounded-lg glass-button-dark text-white flex items-center justify-center mb-3">
                  <Compass className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Match by travel style
                </h3>
                <p className="text-xs text-gray-200">
                  Backpacker, slow traveler, weekend hiker – match with people
                  who move through the world like you do.
                </p>
              </div>

              <div className="glass-card rounded-xl p-5 reveal reveal-up delay-200">
                <div className="w-8 h-8 rounded-lg glass-button-dark text-white flex items-center justify-center mb-3">
                  <Users className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Small groups, big memories
                </h3>
                <p className="text-xs text-gray-200">
                  Keep trips small and flexible. Perfect for 2–6 people instead
                  of huge tour buses.
                </p>
              </div>

              <div className="glass-card rounded-xl p-5 reveal reveal-up delay-300">
                <div className="w-8 h-8 rounded-lg glass-button-dark text-white flex items-center justify-center mb-3">
                  <Shield className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  Safety-first design
                </h3>
                <p className="text-xs text-gray-200">
                  Safety tips, profile transparency, and shared planning tools
                  help you feel confident before you say yes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Community / testimonials */}
        <section id="about" className="py-10 sm:py-14">
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
            <div className="grid gap-8 md:grid-cols-[1.3fr_minmax(0,1fr)] items-center">
              <div className="reveal reveal-left">
                <h2 className="text-xl sm:text-2xl font-semibold text-white mb-3">
                  A community of travelers who actually reply
                </h2>
                <p className="text-sm text-gray-200 mb-5">
                  No ghosting, no endless scrolling. Travel Buddy is designed
                  around real conversations, shared planning, and mutual
                  respect.
                </p>
                <ul className="space-y-2 text-xs text-gray-300">
                  <li>• Join or create focused groups around cities or hikes</li>
                  <li>• Share itineraries, maps, and packing lists</li>
                  <li>• Keep everything in one place instead of random chats</li>
                </ul>
              </div>

              <div className="glass-card rounded-xl shadow-sm p-5 reveal reveal-right delay-200">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-full glass-button-dark text-white flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-medium text-white">
                    Real story from a small hiking group
                  </p>
                </div>
                <p className="text-xs text-gray-200 mb-2">
                  "We were three strangers who met on Travel Buddy for a weekend
                  trip. Now we plan at least one hike together every month."
                </p>
                <p className="text-[11px] text-gray-300">— Lina, Prague</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-10 sm:py-14">
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="reveal reveal-left">
              {isAuthenticated ? (
                <>
                  <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                    You're all set, {user?.name?.split(' ')[0] ?? 'traveler'}.
                  </h2>
                  <p className="text-sm text-gray-200 max-w-xl">
                    Your profile is live. Explore hikes, manage your trips, and connect with travel buddies right from your dashboard.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-xl sm:text-2xl font-semibold text-white mb-2">
                    Ready to find your next travel buddy?
                  </h2>
                  <p className="text-sm text-gray-200 max-w-xl">
                    Create a free profile in under two minutes. You can decide later
                    which trips to actually say yes to.
                  </p>
                </>
              )}
            </div>
            <div className="flex flex-wrap gap-3 reveal reveal-right delay-200">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center justify-center gap-2 rounded-full glass-strong px-5 py-2 text-sm font-semibold text-black shadow-sm"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                  </Link>
                  <Link
                    to="/hikes"
                    className="inline-flex items-center justify-center rounded-full glass-button px-5 py-2 text-sm font-medium text-white"
                  >
                    Browse Hikes
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="inline-flex items-center justify-center rounded-full glass-strong px-5 py-2 text-sm font-semibold text-black shadow-sm"
                  >
                    Get started
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center justify-center rounded-full glass-button px-5 py-2 text-sm font-medium text-white"
                  >
                    Log in
                  </Link>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="glass-nav">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-8 flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          {/* Brand + stores */}
          <div className="space-y-3 max-w-sm">
            <div className="flex items-center gap-2">
              <div className="glass-button-dark p-2 rounded-lg shadow-sm">
                <Map className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-white">
                Travel Buddy
              </span>
            </div>
            <p className="text-xs text-gray-200">
              Find hiking friends, share routes, and turn solo weekend plans
              into small group adventures across Nepal.
            </p>
            <div className="flex gap-3">
              <button className="h-9 rounded-md glass-button px-3 text-[11px] font-medium text-white hover:opacity-80">
                App Store
              </button>
              <button className="h-9 rounded-md glass-button px-3 text-[11px] font-medium text-white hover:opacity-80">
                Google Play
              </button>
            </div>
          </div>

          {/* Link columns */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs text-gray-200">
            <div>
              <p className="mb-3 font-semibold text-white">Explore</p>
              <ul className="space-y-2">
                <li>
                  <button className="hover:text-white transition-colors">Hikes</button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors">Mountains</button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors">Map</button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors">Trails</button>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-3 font-semibold text-white">Company</p>
              <ul className="space-y-2">
                <li>
                  <button className="hover:text-white transition-colors">About</button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors">Partners</button>
                </li>
              </ul>
            </div>

            <div>
              <p className="mb-3 font-semibold text-white">Legal</p>
              <ul className="space-y-2">
                <li>
                  <button className="hover:text-white transition-colors">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors">
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button className="hover:text-white transition-colors">
                    Cookie Policy
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom row */}
        <div className="border-t border-white/20">
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[11px] text-gray-200">
              © {new Date().getFullYear()} Travel Buddy. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-gray-200">
              <button className="hover:text-white transition-colors">Privacy</button>
              <button className="hover:text-white transition-colors">Terms</button>
              <div className="inline-flex items-center gap-1 rounded-full glass-button px-2 py-1">
                <span className="text-[11px] text-white">EN</span>
                <span className="text-[11px] text-gray-200">English</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// #endregion Component

// #region Exports
export default Landing;
// #endregion Exports
