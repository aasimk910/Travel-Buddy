// src/pages/Homepage.tsx
// #region Imports
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "../hooks/useScrollReveal";
import { useAuth } from "../context/AuthContext";
import { Mountain, Map, BarChart2, Camera, TrendingUp, Users } from "lucide-react";
import ProfileSummaryCard from "../components/homepage/ProfileSummaryCard";
import ReviewCard from "../components/homepage/ReviewCard";
import PhotoUploadCard from "../components/homepage/PhotoUploadCard";
import PhotoFeed from "../components/homepage/PhotoFeed";
import CreateHikeModal from "../components/homepage/CreateHikeModal";
import ConnectModal from "../components/hikes/ConnectModal";
import { getLatestPhotos } from "../services/photos";
import { getRecommendedHikes, getSiteStats, type Hike, type SiteStats } from "../services/hikes";
import { getToken } from "../services/auth";

 

// #endregion Imports

// #region Component
const Homepage: React.FC = () => {
  const { user } = useAuth();
  const revealRef = useScrollReveal();
  const [photos, setPhotos] = useState<any[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [recommendedHikes, setRecommendedHikes] = useState<Hike[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [isCreateHikeModalOpen, setIsCreateHikeModalOpen] = useState(false);
  const [selectedHike, setSelectedHike] = useState<Hike | null>(null);
  const [siteStats, setSiteStats] = useState<SiteStats | null>(null);

  // Handles fetchLatestPhotos logic.
  const fetchLatestPhotos = async () => {
    setIsLoadingPhotos(true);
    setPhotosError(null);
    try {
      const data = await getLatestPhotos();
      setPhotos(data);
    } catch (err: any) {
      setPhotosError(err?.message || "Unable to load photos. Please try again.");
      setPhotos([]);
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  // Handles fetchRecommendations logic.
  const fetchRecommendations = async () => {
    const token = getToken();
    if (!token) return;

    setIsLoadingRecommendations(true);
    setRecommendationsError(null);
    try {
      const hikes = await getRecommendedHikes(token);
      setRecommendedHikes(hikes);
    } catch (err: any) {
      // Onboarding not done — surface a friendly prompt, not a red error
      const msg: string = err?.message || "";
      if (msg.toLowerCase().includes("onboarding")) {
        setRecommendationsError("onboarding_required");
      } else {
        setRecommendationsError(msg || "Unable to load recommendations right now.");
      }
      setRecommendedHikes([]);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    fetchLatestPhotos();
    fetchRecommendations();
    getSiteStats().then(setSiteStats).catch(() => {});
  }, []);

  return (
    <>
      {/* ══ HERO ══════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center scale-105"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/1054218/pexels-photo-1054218.jpeg?auto=compress&cs=tinysrgb&w=1400')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F0C]/96 via-[#0B0F0C]/72 to-[#0B0F0C]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F0C] via-transparent to-[#0B0F0C]/30" />

        <div className="relative px-4 sm:px-6 lg:px-12 xl:px-16 pt-12 pb-16 lg:pt-16 lg:pb-20">
          {/* Greeting + headline */}
          <p className="section-label mb-3">Your Adventure Hub</p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#F5F3EE] mb-3 font-heading leading-[1.1]">
            Welcome back,{" "}
            <span className="bg-gradient-to-r from-[#C6A16E] via-[#E8D5B0] to-[#F5F3EE] bg-clip-text text-transparent">
              {user?.name?.split(" ")[0] || "Traveler"}
            </span>
          </h1>
          <p className="text-[#B8B4AA] text-sm sm:text-base max-w-lg leading-relaxed mb-8">
            Your mountain community is active. Discover new hikes, connect with trekkers, and plan your next expedition.
          </p>

          {/* Action row */}
          <div className="flex flex-wrap gap-3 mb-10">
            <Link to="/hikes" className="btn-primary inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm font-semibold">
              <Mountain className="w-4 h-4" /> Browse Hikes
            </Link>
            <Link to="/maps" className="btn-outline inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm">
              <Map className="w-4 h-4" /> View Map
            </Link>
            <button
              onClick={() => setIsCreateHikeModalOpen(true)}
              className="btn-outline inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-sm"
            >
              + Create Hike
            </button>
          </div>

          {/* Stat cards — sit inside the hero, bottom */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: <Mountain className="w-5 h-5" />, value: siteStats ? `${siteStats.hikeCount}+` : "—", label: "Hikes Listed", color: "text-[#C6A16E]", bg: "bg-[#C6A16E]/10 border-[#C6A16E]/20" },
              { icon: <Users className="w-5 h-5" />, value: siteStats ? `${siteStats.userCount}+` : "—", label: "Travelers", color: "text-[#8FA68E]", bg: "bg-[#8FA68E]/10 border-[#8FA68E]/20" },
              { icon: <TrendingUp className="w-5 h-5" />, value: siteStats ? `${siteStats.upcomingHikes}` : "—", label: "Upcoming Hikes", color: "text-[#C6A16E]", bg: "bg-[#C6A16E]/10 border-[#C6A16E]/20" },
              { icon: <Camera className="w-5 h-5" />, value: siteStats ? `${siteStats.photoCount}+` : "—", label: "Photos Shared", color: "text-[#8FA68E]", bg: "bg-[#8FA68E]/10 border-[#8FA68E]/20" },
            ].map((s, i) => (
              <div key={i} className={`${s.bg} border rounded-xl p-4 flex items-center gap-3 backdrop-blur-sm`}>
                <span className={s.color}>{s.icon}</span>
                <div>
                  <p className={`text-lg font-bold font-heading ${s.color} leading-none`}>{s.value}</p>
                  <p className="text-[#8E8A81] text-xs mt-0.5">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ PAGE BODY ═════════════════════════════════════════════════ */}
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-8" ref={revealRef}>

        {/* ── Three-column layout: sidebar | main | right ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_280px] xl:grid-cols-[300px_1fr_300px] gap-6 mb-10">

          {/* LEFT SIDEBAR */}
          <aside className="flex flex-col gap-5">
            {/* Profile card */}
            <div className="reveal reveal-left">
              <ProfileSummaryCard />
            </div>

            {/* Quick nav links */}
            <div className="site-card rounded-xl p-4 reveal reveal-left delay-100">
              <p className="section-label mb-3">Quick Access</p>
              <nav className="flex flex-col gap-1">
                {[
                  { to: "/hikes", icon: <Mountain className="w-4 h-4" />, label: "Browse Hikes" },
                  { to: "/maps", icon: <Map className="w-4 h-4" />, label: "Trail Maps" },
                  { to: "/shop", icon: <BarChart2 className="w-4 h-4" />, label: "Gear Shop" },
                  { to: "/dashboard", icon: <TrendingUp className="w-4 h-4" />, label: "My Dashboard" },
                ].map((n) => (
                  <Link
                    key={n.to}
                    to={n.to}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[#B8B4AA] hover:text-[#F5F3EE] hover:bg-white/5 transition-all group"
                  >
                    <span className="text-[#C6A16E] group-hover:scale-110 transition-transform">{n.icon}</span>
                    {n.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Create hike card */}
            <div className="relative overflow-hidden rounded-xl reveal reveal-left delay-200">
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: "url('https://images.pexels.com/photos/2559941/pexels-photo-2559941.jpeg?auto=compress&cs=tinysrgb&w=600')" }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F0C]/95 via-[#0B0F0C]/70 to-transparent" />
              <div className="relative p-5 flex flex-col gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#C6A16E]/15 border border-[#C6A16E]/30 flex items-center justify-center relative">
                  <Mountain className="w-5 h-5 text-[#C6A16E]" />
                  {siteStats && siteStats.upcomingHikes > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C6A16E] text-[#0B0F0C] text-[9px] flex items-center justify-center font-bold">
                      {siteStats.upcomingHikes}
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#F5F3EE] font-heading">Organize a Group Hike</h3>
                  <p className="text-xs text-[#B8B4AA] mt-1 leading-relaxed">Create an event and invite trekkers to hit the trail together.</p>
                </div>
                <button
                  onClick={() => setIsCreateHikeModalOpen(true)}
                  className="btn-primary w-full py-2 rounded-md text-sm font-semibold"
                >
                  Create Hike
                </button>
              </div>
            </div>
          </aside>

          {/* CENTER — Recommended hikes */}
          <main className="min-w-0">
            <div className="flex items-center justify-between gap-3 mb-5 reveal reveal-up">
              <div>
                <p className="section-label mb-1">Personalized For You</p>
                <h2 className="text-xl font-bold text-[#F5F3EE] font-heading">Recommended Hikes</h2>
              </div>
              <Link to="/hikes" className="btn-outline inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium">
                View all
              </Link>
            </div>

            {isLoadingRecommendations && (
              <div className="flex items-center gap-3 py-8 text-[#B8B4AA]">
                <div className="w-4 h-4 rounded-full border-2 border-[#C6A16E] border-t-transparent animate-spin" />
                <span className="text-sm">Finding hikes for you…</span>
              </div>
            )}

            {!isLoadingRecommendations && recommendationsError === "onboarding_required" && (
              <div className="site-card rounded-xl p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[#C6A16E]/10 border border-[#C6A16E]/25 flex items-center justify-center shrink-0">
                  <Mountain className="w-6 h-6 text-[#C6A16E]" />
                </div>
                <div>
                  <p className="text-[#F5F3EE] font-medium text-sm mb-1">Complete your travel profile</p>
                  <p className="text-[#8E8A81] text-xs">
                    <Link to="/onboarding" className="text-[#C6A16E] hover:text-[#D4AE7A] underline">Set up your preferences</Link>
                    {" "}to get personalized hike recommendations.
                  </p>
                </div>
              </div>
            )}

            {!isLoadingRecommendations && recommendationsError && recommendationsError !== "onboarding_required" && (
              <p className="text-sm text-red-400">{recommendationsError}</p>
            )}

            {!isLoadingRecommendations && !recommendationsError && recommendedHikes.length === 0 && (
              <div className="site-card rounded-xl p-8 text-center">
                <Mountain className="w-10 h-10 text-[#8E8A81]/40 mx-auto mb-3" />
                <p className="text-[#B8B4AA] text-sm">No upcoming hikes match your preferences yet.</p>
                <Link to="/hikes" className="inline-block mt-3 text-xs text-[#C6A16E] hover:text-[#D4AE7A] underline">Browse all hikes</Link>
              </div>
            )}

            {!isLoadingRecommendations && !recommendationsError && recommendedHikes.length > 0 && (() => {
              const delays = ["delay-100", "delay-200", "delay-300", "delay-400", "delay-500", "delay-600"];
              return (
                <div className="grid gap-4 sm:grid-cols-2">
                  {recommendedHikes.map((hike, idx) => (
                    <article
                      key={hike._id}
                      className={`site-card rounded-xl overflow-hidden cursor-pointer group reveal reveal-up ${delays[Math.min(idx, 5)]}`}
                      onClick={() => setSelectedHike(hike)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => e.key === "Enter" && setSelectedHike(hike)}
                    >
                      <div className="h-48 bg-[#111714] overflow-hidden relative">
                        {hike.imageUrl ? (
                          <img
                            src={hike.imageUrl}
                            alt={hike.title}
                            className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-600"
                          />
                        ) : (
                          <div
                            className="w-full h-full bg-cover bg-center group-hover:scale-[1.05] transition-transform duration-600"
                            style={{ backgroundImage: "url('https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?auto=compress&cs=tinysrgb&w=600')" }}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F0C]/85 via-[#0B0F0C]/20 to-transparent" />
                        {/* Title overlaid on image */}
                        <div className="absolute bottom-0 left-0 right-0 p-4">
                          <h3 className="text-base font-semibold text-[#F5F3EE] line-clamp-1 font-heading">{hike.title}</h3>
                          <p className="text-xs text-[#B8B4AA] mt-0.5">{hike.location}</p>
                        </div>
                        <span className="absolute top-3 right-3 surface-pill text-[10px] font-semibold px-2 py-0.5 rounded-md">
                          {hike.spotsLeft > 0 ? `${hike.spotsLeft} left` : "Full"}
                        </span>
                      </div>
                      <div className="px-4 py-3 flex items-center justify-between text-xs text-[#8E8A81]">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#C6A16E] inline-block" />
                          Difficulty {hike.difficulty}/5
                        </span>
                        <span>{new Date(hike.date).toLocaleDateString()}</span>
                      </div>
                    </article>
                  ))}
                </div>
              );
            })()}
          </main>

          {/* RIGHT SIDEBAR */}
          <aside className="flex flex-col gap-5">
            {/* Review card */}
            <div className="reveal reveal-right">
              <ReviewCard />
            </div>
            {/* Photo upload */}
            <div className="reveal reveal-right delay-200">
              <PhotoUploadCard onUploaded={fetchLatestPhotos} />
            </div>
          </aside>
        </div>

        {/* ── Stats ticker ───────────────────────────────────────────── */}
        <div className="overflow-hidden mb-10 rounded-xl border border-white/8 bg-[#111714] py-3 select-none">
          <div className="ticker-track">
            {(() => {
              const items = [
                { icon: <TrendingUp className="w-3.5 h-3.5" />, label: siteStats ? `${siteStats.hikeCount}+ hikes listed` : "hikes listed", color: "text-[#C6A16E]" },
                { icon: <Users className="w-3.5 h-3.5" />, label: siteStats ? `${siteStats.userCount}+ travelers` : "travelers", color: "text-[#8FA68E]" },
                { icon: <Mountain className="w-3.5 h-3.5" />, label: siteStats ? `${siteStats.upcomingHikes} upcoming hikes` : "upcoming hikes", color: "text-[#C6A16E]" },
                { icon: <Camera className="w-3.5 h-3.5" />, label: siteStats ? `${siteStats.photoCount}+ trip photos` : "trip photos", color: "text-[#8FA68E]" },
                { icon: <Map className="w-3.5 h-3.5" />, label: "Hike. Explore. Connect.", color: "text-[#C6A16E]" },
                { icon: <BarChart2 className="w-3.5 h-3.5" />, label: "Avg. 4.8 ★ rating", color: "text-[#8FA68E]" },
              ];
              return [...items, ...items].map((item, i) => (
                <span key={i} className="inline-flex items-center gap-2 px-6 text-sm text-[#8E8A81] whitespace-nowrap">
                  <span className={item.color}>{item.icon}</span>
                  {item.label}
                  <span className="ml-4 w-1 h-1 rounded-full bg-[#C6A16E]/25 inline-block" />
                </span>
              ));
            })()}
          </div>
        </div>

        {/* ── Community photo feed ───────────────────────────────────── */}
        {(isLoadingPhotos || (Array.isArray(photos) && photos.length > 0) || photosError) && (
          <div className="mb-4">
            <p className="section-label mb-3">Community Photos</p>
            <PhotoFeed
              photos={photos as any}
              isLoading={isLoadingPhotos}
              error={photosError}
              currentUserName={user?.name || "Traveler"}
              onDeleted={(id) => setPhotos((prev) => prev.filter((p: any) => p._id !== id))}
            />
          </div>
        )}
      </div>
      <CreateHikeModal open={isCreateHikeModalOpen} onClose={() => setIsCreateHikeModalOpen(false)} />
      {selectedHike && (
        <ConnectModal
          open={!!selectedHike}
          hike={selectedHike}
          onClose={() => setSelectedHike(null)}
        />
      )}
    </>
  );
};
// #endregion Component

// #region Exports
export default Homepage;
// #endregion Exports
