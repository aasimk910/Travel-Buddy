// src/pages/Landing.tsx
// #region Imports
import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Map, Users, Compass, MessageCircle, Shield, LayoutDashboard, LogOut, ChevronRight, TrendingUp, Mountain, Camera } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getSiteStats, getUpcomingHikes, type SiteStats, type Hike } from "../services/hikes";
import { useScrollReveal } from "../hooks/useScrollReveal";
import SiteFooter from "../components/layout/SiteFooter";

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
      <header className="site-nav sticky top-0 z-40">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 flex items-center justify-between h-16">
          {/* Logo */}
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate("/")}
          >
            <div className="p-2 rounded-lg bg-[#1E2820] border border-white/10 group-hover:border-[#C6A16E]/40 transition-colors">
              <Map className="w-5 h-5 text-[#C6A16E]" />
            </div>
            <span className="text-base sm:text-lg font-semibold text-[#F5F3EE] font-heading tracking-wide">
              Travel Buddy
            </span>
          </button>

          {/* Nav links (desktop) */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-body">
            <Link to="/" className="text-[#F5F3EE] font-medium border-b border-[#C6A16E] pb-0.5 tracking-wide">Home</Link>
            <Link to="/hikes" className="text-[#8E8A81] hover:text-[#F5F3EE] transition-colors tracking-wide">Hikes</Link>
            <Link to="/maps" className="text-[#8E8A81] hover:text-[#F5F3EE] transition-colors tracking-wide">Maps</Link>
            <Link to="/shop" className="text-[#8E8A81] hover:text-[#F5F3EE] transition-colors tracking-wide">Shop</Link>
            <Link to="/about" className="text-[#8E8A81] hover:text-[#F5F3EE] transition-colors tracking-wide">About</Link>
          </nav>

          {/* Auth buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Avatar / name */}
                <button
                  onClick={() => navigate("/dashboard")}
                  className="hidden sm:flex items-center gap-2 text-sm text-[#B8B4AA] hover:text-[#F5F3EE] transition-colors"
                >
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 rounded-full object-cover border border-[#C6A16E]/30" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#1E2820] border border-[#C6A16E]/30 flex items-center justify-center text-xs font-semibold text-[#C6A16E]">
                      {user?.name?.[0]?.toUpperCase() ?? "U"}
                    </div>
                  )}
                  <span className="max-w-[120px] truncate">{user?.name}</span>
                </button>
                <Link
                  to="/dashboard"
                  className="btn-primary inline-flex items-center justify-center gap-1.5 rounded-md px-4 py-1.5 text-sm"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center justify-center rounded-md btn-outline px-3 py-1.5 text-sm gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-flex text-sm text-[#B8B4AA] hover:text-[#F5F3EE] transition-colors tracking-wide"
                >
                  Log in
                </Link>
                <Link
                  to="/signup"
                  className="btn-primary inline-flex items-center justify-center rounded-md px-4 py-1.5 text-sm"
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
        {/* ── Hero section ─────────────────────────────────────────────── */}
        <section className="relative min-h-[88vh] flex items-center overflow-hidden">
          {/* Cinematic background image — Nepalese Himalayan landscape */}
          <div
            className="absolute inset-0 bg-cover bg-center scale-[1.03]"
            style={{ backgroundImage: "url('https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?auto=compress&cs=tinysrgb&w=1600')" }}
          />
          {/* Layered dark overlays for readability */}
          <div className="absolute inset-0 hero-overlay-l" />
          <div className="absolute inset-0 hero-overlay-b" />
          {/* Subtle gold atmosphere top-left */}
          <div className="pointer-events-none absolute -top-24 -left-16 w-[480px] h-[480px] rounded-full bg-[#C6A16E] opacity-[0.07] blur-[120px]" />

          <div className="relative w-full px-4 sm:px-6 lg:px-12 xl:px-16 grid gap-10 lg:grid-cols-2 items-center py-20 lg:py-28">
            {/* Left: text — parallax layer */}
            <div ref={heroTextRef} className="max-w-xl will-change-transform">
              <p className="reveal reveal-fade inline-flex items-center gap-2 rounded-full surface-pill px-3 py-1 text-xs font-medium mb-4">
                {isAuthenticated ? (
                  <><span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />Welcome back, {user?.name?.split(' ')[0] ?? 'traveler'}!</>
                ) : (
                  <><span className="w-2 h-2 rounded-full bg-emerald-500" />Find people who travel like you</>
                )}
              </p>

              <h1 className="reveal reveal-up delay-100 text-4xl sm:text-5xl xl:text-6xl font-bold leading-[1.1] text-[#F5F3EE] mb-5 font-heading">
                {isAuthenticated ? (
                  <>Your next adventure<br />
                    <span className="bg-gradient-to-r from-[#C6A16E] via-[#E8D5B0] to-[#F5F3EE] bg-clip-text text-transparent">
                      is waiting for you.
                    </span>
                  </>
                ) : (
                  <>Find your next{" "}
                    <span className="bg-gradient-to-r from-[#C6A16E] via-[#E8D5B0] to-[#F5F3EE] bg-clip-text text-transparent">
                      Travel Buddy
                    </span>
                    , not just your next trip.
                  </>
                )}
              </h1>

              <p className="reveal reveal-up delay-200 text-[#B8B4AA] text-sm sm:text-base leading-relaxed mb-6">
                {isAuthenticated
                  ? "Head to your dashboard to manage trips, connect with buddies, track expenses, and plan your next hike."
                  : "Travel Buddy connects you with travelers who share your style, budget, and destinations. Plan trips together, split costs, and turn solo ideas into shared adventures."}
              </p>

              <div className="reveal reveal-up delay-300 flex flex-wrap gap-3 mb-6">
                {isAuthenticated ? (
                  <>
                    <Link
                      to="/dashboard"
                      className="btn-primary inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm"
                    >
                      <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                    </Link>
                    <Link
                      to="/hikes"
                      className="btn-outline inline-flex items-center justify-center gap-1.5 rounded-md px-5 py-2.5 text-sm"
                    >
                      Explore hikes <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/signup"
                      className="btn-primary inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm"
                    >
                      Start for free
                    </Link>
                    <Link
                      to="/hikes"
                      className="btn-outline inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm"
                    >
                      Explore hikes
                    </Link>
                  </>
                )}
              </div>

              <div className="reveal reveal-fade delay-400 flex flex-wrap items-center gap-4 text-xs text-[#8E8A81]">
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>Trusted by small travel groups worldwide</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-4 h-4" />
                  <span>Profile checks & safety tips built in</span>
                </div>
              </div>

              {/* Stat pills */}
              <div className="reveal reveal-fade delay-500 mt-6 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-md bg-[#161D19] border border-white/8 px-3 py-1.5 text-xs font-medium text-[#B8B4AA]">
                  <TrendingUp className="w-3.5 h-3.5 text-[#C6A16E]" />
                  {siteStats ? `${siteStats.hikeCount}+ hikes listed` : "hikes listed"}
                </div>
                <div className="inline-flex items-center gap-2 rounded-md bg-[#161D19] border border-white/8 px-3 py-1.5 text-xs font-medium text-[#B8B4AA]">
                  <Users className="w-3.5 h-3.5 text-[#8FA68E]" />
                  {siteStats ? `${siteStats.userCount}+ travelers` : "travelers"}
                </div>
                <div className="inline-flex items-center gap-2 rounded-md bg-[#161D19] border border-white/8 px-3 py-1.5 text-xs font-medium text-[#B8B4AA]">
                  <Mountain className="w-3.5 h-3.5 text-[#C6A16E]" />
                  {siteStats ? `${siteStats.upcomingHikes} upcoming hikes` : "upcoming hikes"}
                </div>
                <div className="inline-flex items-center gap-2 rounded-md bg-[#161D19] border border-white/8 px-3 py-1.5 text-xs font-medium text-[#B8B4AA]">
                  <Camera className="w-3.5 h-3.5 text-[#8FA68E]" />
                  {siteStats ? `${siteStats.photoCount}+ photos shared` : "photos shared"}
                </div>
              </div>
            </div>

            {/* Right: preview card */}
            <div ref={heroCardRef} className="reveal reveal-right delay-200 lg:justify-self-end w-full max-w-md will-change-transform">
              <div className="rounded-xl site-card text-[#F5F3EE] p-5 sm:p-6">
                <p className="text-xs font-medium text-[#8E8A81] uppercase tracking-widest mb-3">
                  Upcoming group hikes
                </p>
                <div className="space-y-2 text-sm">
                  {upcomingHikes.length === 0 ? (
                    <p className="text-[11px] text-[#8E8A81]">No upcoming hikes at the moment. Check back soon!</p>
                  ) : (
                    upcomingHikes.map((hike) => {
                      const difficultyLabel = hike.difficulty <= 1 ? "Easy" : hike.difficulty <= 2 ? "Moderate" : hike.difficulty <= 3 ? "Challenging" : hike.difficulty <= 4 ? "Hard" : "Expert";
                      const going = hike.participants?.length ?? 0;
                      const isNew = (Date.now() - new Date(hike.createdAt || hike.date).getTime()) < 3 * 24 * 60 * 60 * 1000;
                      return (
                        <div key={hike._id} className="surface-dark flex items-center justify-between rounded-lg px-3 py-2.5 hover:border-[#C6A16E]/20 transition-colors">
                          <div>
                            <p className="font-semibold text-[#F5F3EE] line-clamp-1">{hike.title}</p>
                            <p className="text-[11px] text-[#8E8A81] mt-0.5">
                              {hike.location} • {difficultyLabel} {going > 0 ? `• ${going} going` : ""}
                            </p>
                          </div>
                          {isNew ? (
                            <span className="text-[11px] rounded-md surface-pill px-2 py-0.5">New</span>
                          ) : hike.spotsLeft > 0 ? (
                            <span className="text-[11px] rounded-md bg-[#8FA68E]/15 border border-[#8FA68E]/25 text-[#8FA68E] px-2 py-0.5">{hike.spotsLeft} left</span>
                          ) : (
                            <span className="text-[11px] rounded-md bg-red-900/20 border border-red-700/25 text-red-400 px-2 py-0.5">Full</span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
                <p className="mt-4 text-[11px] text-[#8E8A81]">
                  {isAuthenticated
                    ? "Visit your dashboard to see trips matched to your travel style."
                    : "Log in to see trips that match your dates, budget, and travel style."}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Moving ticker strip */}
        <div className="overflow-hidden border-y border-white/8 bg-[#111714] py-3 select-none">
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
                className="inline-flex items-center gap-2 px-6 text-sm text-[#8E8A81] whitespace-nowrap"
              >
                <span className="text-base">{item.flag}</span>
                {item.label}
                <span className="ml-4 w-1 h-1 rounded-full bg-[#C6A16E]/30 inline-block" />
              </span>
            ))}
          </div>
        </div>

        {/* Preview hikes section */}
        <section id="hikes" className="py-12 sm:py-16">
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
            <div className="flex items-center justify-between gap-3 mb-8">
              <div className="reveal reveal-up">
                <p className="section-label mb-2">Featured Trails</p>
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#F5F3EE] font-heading">
                  Join group hikes near you
                </h2>
                <p className="text-sm text-[#B8B4AA] mt-1">
                  A quick preview of what you'll find on the Hikes page.
                </p>
              </div>
              <Link
                to="/hikes"
                className="btn-outline hidden sm:inline-flex items-center justify-center rounded-md px-4 py-1.5 text-xs font-medium"
              >
                View all hikes
              </Link>
            </div>

            <div className="grid gap-5 md:grid-cols-3">
              <div className="site-card rounded-xl overflow-hidden reveal reveal-up delay-100 group">
                <div className="h-52 bg-[url('https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800')] bg-cover bg-center group-hover:scale-[1.03] transition-transform duration-700" />
                <div className="p-4">
                  <p className="text-xs text-[#8E8A81] mb-1 uppercase tracking-wide">
                    Banff National Park • Canada
                  </p>
                  <h3 className="text-sm font-semibold text-[#F5F3EE] font-heading">
                    Hot Springs Sunrise Hike
                  </h3>
                  <p className="text-xs text-[#B8B4AA] mt-1">
                    Easy pace, perfect for first-time group hikers.
                  </p>
                  <p className="mt-3 text-[11px] text-[#8E8A81]">
                    Difficulty: 1/5 • 3 spots left
                  </p>
                </div>
              </div>

              <div className="site-card rounded-xl overflow-hidden reveal reveal-up delay-200 group">
                <div className="h-52 bg-[url('https://images.pexels.com/photos/552785/pexels-photo-552785.jpeg?auto=compress&cs=tinysrgb&w=800')] bg-cover bg-center group-hover:scale-[1.03] transition-transform duration-700" />
                <div className="p-4">
                  <p className="text-xs text-[#8E8A81] mb-1 uppercase tracking-wide">
                    Dolomites • Italy
                  </p>
                  <h3 className="text-sm font-semibold text-[#F5F3EE] font-heading">
                    Through the Heart of the Peaks
                  </h3>
                  <p className="text-xs text-[#B8B4AA] mt-1">
                    Full-day route with big views and shared snacks.
                  </p>
                  <p className="mt-3 text-[11px] text-[#8E8A81]">
                    Difficulty: 4/5 • 6 spots left
                  </p>
                </div>
              </div>

              <div className="site-card rounded-xl overflow-hidden reveal reveal-up delay-300 group">
                <div className="h-52 bg-[url('https://images.pexels.com/photos/1028225/pexels-photo-1028225.jpeg?auto=compress&cs=tinysrgb&w=800')] bg-cover bg-center group-hover:scale-[1.03] transition-transform duration-700" />
                <div className="p-4">
                  <p className="text-xs text-[#8E8A81] mb-1 uppercase tracking-wide">
                    Lisbon • Portugal
                  </p>
                  <h3 className="text-sm font-semibold text-[#F5F3EE] font-heading">
                    City View Sunset Walk
                  </h3>
                  <p className="text-xs text-[#B8B4AA] mt-1">
                    Short evening walk ending at a lookout with snacks.
                  </p>
                  <p className="mt-3 text-[11px] text-[#8E8A81]">
                    Difficulty: 2/5 • 4 spots left
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 sm:hidden">
              <Link
                to="/hikes"
                className="btn-outline inline-flex items-center justify-center rounded-md px-4 py-1.5 text-xs font-medium"
              >
                View all hikes
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-12 sm:py-16">
          <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16">
            <p className="reveal reveal-fade section-label mb-2">Why Travel Buddy</p>
            <h2 className="reveal reveal-up text-2xl sm:text-3xl font-semibold text-[#F5F3EE] mb-8 font-heading">
              Built for real travelers, not just influencers
            </h2>

            <div className="grid gap-5 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              <div className="site-card rounded-xl p-6 reveal reveal-up delay-100 hover:border-[#C6A16E]/20 transition-colors">
                <div className="w-8 h-8 rounded-md bg-[#8FA68E]/10 border border-[#8FA68E]/25 flex items-center justify-center mb-4">
                  <Compass className="w-4 h-4 text-[#8FA68E]" />
                </div>
                <h3 className="text-sm font-semibold text-[#F5F3EE] mb-2 font-heading">
                  Match by travel style
                </h3>
                <p className="text-xs text-[#B8B4AA] leading-relaxed">
                  Backpacker, slow traveler, weekend hiker – match with people
                  who move through the world like you do.
                </p>
              </div>

              <div className="site-card rounded-xl p-6 reveal reveal-up delay-200 hover:border-[#C6A16E]/20 transition-colors">
                <div className="w-8 h-8 rounded-md bg-[#8FA68E]/10 border border-[#8FA68E]/25 flex items-center justify-center mb-4">
                  <Users className="w-4 h-4 text-[#8FA68E]" />
                </div>
                <h3 className="text-sm font-semibold text-[#F5F3EE] mb-2 font-heading">
                  Small groups, big memories
                </h3>
                <p className="text-xs text-[#B8B4AA] leading-relaxed">
                  Keep trips small and flexible. Perfect for 2–6 people instead
                  of huge tour buses.
                </p>
              </div>

              <div className="site-card rounded-xl p-6 reveal reveal-up delay-300 hover:border-[#C6A16E]/20 transition-colors">
                <div className="w-8 h-8 rounded-md bg-[#8FA68E]/10 border border-[#8FA68E]/25 flex items-center justify-center mb-4">
                  <Shield className="w-4 h-4 text-[#8FA68E]" />
                </div>
                <h3 className="text-sm font-semibold text-[#F5F3EE] mb-2 font-heading">
                  Safety-first design
                </h3>
                <p className="text-xs text-[#B8B4AA] leading-relaxed">
                  Safety tips, profile transparency, and shared planning tools
                  help you feel confident before you say yes.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Community / testimonials */}
        <section id="about" className="py-14 sm:py-20 relative overflow-hidden">
          {/* Misty forest background */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-15"
            style={{ backgroundImage: "url('https://images.pexels.com/photos/1578750/pexels-photo-1578750.jpeg?auto=compress&cs=tinysrgb&w=1400')" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F0C]/90 via-[#0B0F0C]/60 to-[#0B0F0C]/90" />
          <div className="relative w-full px-4 sm:px-6 lg:px-12 xl:px-16">
            <div className="grid gap-10 md:grid-cols-[1.3fr_minmax(0,1fr)] items-center">
              <div className="reveal reveal-left">
                <p className="section-label mb-2">Community</p>
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#F5F3EE] mb-4 font-heading">
                  A community of travelers who actually reply
                </h2>
                <p className="text-sm text-[#B8B4AA] mb-5 leading-relaxed">
                  No ghosting, no endless scrolling. Travel Buddy is designed
                  around real conversations, shared planning, and mutual
                  respect.
                </p>
                <ul className="space-y-2.5 text-xs text-[#8E8A81]">
                  <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[#C6A16E] inline-block" />Join or create focused groups around cities or hikes</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[#C6A16E] inline-block" />Share itineraries, maps, and packing lists</li>
                  <li className="flex items-center gap-2"><span className="w-1 h-1 rounded-full bg-[#C6A16E] inline-block" />Keep everything in one place instead of random chats</li>
                </ul>
              </div>

              <div className="site-card rounded-xl p-6 reveal reveal-right delay-200">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-md bg-[#C6A16E]/10 border border-[#C6A16E]/25 text-[#C6A16E] flex items-center justify-center">
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-medium text-[#B8B4AA] uppercase tracking-widest">
                    Real story
                  </p>
                </div>
                <p className="text-sm text-[#F5F3EE] mb-3 leading-relaxed font-heading italic">
                  "We were three strangers who met on Travel Buddy for a weekend
                  trip. Now we plan at least one hike together every month."
                </p>
                <p className="text-[11px] text-[#8E8A81]">— Lina, Prague</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA — cinematic nature background */}
        <section className="relative py-20 sm:py-28 overflow-hidden">
          {/* Background: misty lake / mountain lake */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('https://images.pexels.com/photos/2662116/pexels-photo-2662116.jpeg?auto=compress&cs=tinysrgb&w=1400')" }}
          />
          <div className="absolute inset-0 bg-[#0B0F0C]/75" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F0C]/60 via-transparent to-[#0B0F0C]/60" />

          <div className="relative w-full px-4 sm:px-6 lg:px-12 xl:px-16 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="reveal reveal-left">
              {isAuthenticated ? (
                <>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-[#F5F3EE] mb-2 font-heading">
                    You're all set, {user?.name?.split(' ')[0] ?? 'traveler'}.
                  </h2>
                  <p className="text-sm text-[#B8B4AA] max-w-xl leading-relaxed">
                    Your profile is live. Explore hikes, manage your trips, and connect with travel buddies right from your dashboard.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl sm:text-3xl font-semibold text-[#F5F3EE] mb-2 font-heading">
                    Ready to find your next travel buddy?
                  </h2>
                  <p className="text-sm text-[#B8B4AA] max-w-xl leading-relaxed">
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
                    className="btn-primary inline-flex items-center justify-center gap-2 rounded-md px-5 py-2.5 text-sm"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Go to Dashboard
                  </Link>
                  <Link
                    to="/hikes"
                    className="btn-outline inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm"
                  >
                    Browse Hikes
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    to="/signup"
                    className="btn-primary inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm"
                  >
                    Get started
                  </Link>
                  <Link
                    to="/login"
                    className="btn-outline inline-flex items-center justify-center rounded-md px-5 py-2.5 text-sm"
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
      <SiteFooter />
    </div>
  );
};

// #endregion Component

// #region Exports
export default Landing;
// #endregion Exports
