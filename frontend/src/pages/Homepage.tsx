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
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-8 relative" ref={revealRef}>
        {/* Floating decorative blobs */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10" aria-hidden>
          <div className="float-slow absolute top-24 left-[5%] w-56 h-56 rounded-full bg-indigo-500/8 blur-3xl" />
          <div className="float-medium absolute top-[40%] right-[6%] w-48 h-48 rounded-full bg-purple-400/8 blur-3xl" style={{ animationDelay: '1.5s' }} />
          <div className="drift absolute bottom-[20%] left-[45%] w-36 h-36 rounded-full bg-emerald-400/8 blur-2xl" style={{ animationDelay: '0.7s' }} />
        </div>

        <div className="mb-8 reveal reveal-up">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.name || "Traveler"}!</h1>
          <p className="text-gray-200">Welcome to the mountain lovers community!</p>
        </div>
        <div className="reveal reveal-fade delay-100">
          <ProfileSummaryCard />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mb-8 items-stretch">
          <div className="reveal reveal-left flex flex-col [&>*]:flex-1">
            <ReviewCard />
          </div>
          <div className="reveal reveal-right delay-200 flex flex-col [&>*]:flex-1">
            <PhotoUploadCard onUploaded={fetchLatestPhotos} />
          </div>
        </div>
        <section className="glass-card rounded-xl shadow-sm p-6 mb-8 reveal reveal-up">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-xl font-bold text-white">Recommended for you</h2>
              <p className="text-sm text-gray-200">
                Personalized hikes based on your trekking preferences.
              </p>
            </div>
            <Link
              to="/hikes"
              className="inline-flex items-center justify-center glass-button rounded-full px-4 py-2 text-sm font-medium text-white"
            >
              Explore all hikes
            </Link>
          </div>

          {isLoadingRecommendations && (
            <p className="text-sm text-gray-200">Loading your recommendations...</p>
          )}

          {!isLoadingRecommendations && recommendationsError === "onboarding_required" && (
            <p className="text-sm text-gray-200">
              Complete your{" "}
              <Link to="/onboarding" className="underline text-white hover:text-emerald-300">travel profile</Link>
              {" "}to get personalized hike recommendations.
            </p>
          )}

          {!isLoadingRecommendations && recommendationsError && recommendationsError !== "onboarding_required" && (
            <p className="text-sm text-red-300">{recommendationsError}</p>
          )}

          {!isLoadingRecommendations && !recommendationsError && recommendedHikes.length === 0 && (
            <p className="text-sm text-gray-200">
              No upcoming hikes match your preferences yet. Check back soon or{" "}
              <Link to="/hikes" className="underline text-white hover:text-emerald-300">browse all hikes</Link>.
            </p>
          )}

          {!isLoadingRecommendations && !recommendationsError && recommendedHikes.length > 0 && (() => {
            const delays = ["delay-100", "delay-200", "delay-300", "delay-400", "delay-500", "delay-600"];
            return (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {recommendedHikes.map((hike, idx) => (
                  <article
                    key={hike._id}
                    className={`glass-button rounded-xl p-4 cursor-pointer hover:ring-1 hover:ring-white/30 transition-all ${delays[Math.min(idx, 5)]}`}
                    onClick={() => setSelectedHike(hike)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedHike(hike)}
                  >
                    {hike.imageUrl && (
                      <div className="h-28 rounded-lg overflow-hidden mb-3 -mx-1">
                        <img src={hike.imageUrl} alt={hike.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <h3 className="text-base font-semibold text-white line-clamp-2">{hike.title}</h3>
                    <p className="text-sm text-gray-200 mt-1">{hike.location}</p>
                    <div className="mt-3 flex items-center justify-between text-xs text-gray-300">
                      <span>Difficulty {hike.difficulty}/5</span>
                      <span>{new Date(hike.date).toLocaleDateString()}</span>
                    </div>
                    <div className="mt-3">
                      <span className="inline-flex items-center gap-1 rounded-full glass-strong px-3 py-1 text-xs font-medium text-black">
                        {hike.spotsLeft > 0 ? `${hike.spotsLeft} spots left` : "Full"}
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            );
          })()}
        </section>
        {/* Animated stats ticker */}
        <div className="overflow-hidden mb-8 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm py-3 select-none">
          <div className="ticker-track">
            {(() => {
              const items = [
                { icon: <TrendingUp className="w-3.5 h-3.5" />, label: siteStats ? `${siteStats.hikeCount}+ hikes listed` : "hikes listed" },
                { icon: <Users className="w-3.5 h-3.5" />, label: siteStats ? `${siteStats.userCount}+ travelers` : "travelers" },
                { icon: <Mountain className="w-3.5 h-3.5" />, label: siteStats ? `${siteStats.upcomingHikes} upcoming hikes` : "upcoming hikes" },
                { icon: <Camera className="w-3.5 h-3.5" />, label: siteStats ? `${siteStats.photoCount}+ trip photos` : "trip photos" },
                { icon: <Map className="w-3.5 h-3.5" />, label: "Hike. Explore. Connect." },
                { icon: <BarChart2 className="w-3.5 h-3.5" />, label: "Avg. 4.8 ★ rating" },
              ];
              return [...items, ...items].map((item, i) => (
                <span key={i} className="inline-flex items-center gap-2 px-6 text-sm text-gray-200 whitespace-nowrap">
                  <span className="text-emerald-400">{item.icon}</span>
                  {item.label}
                  <span className="ml-4 w-1 h-1 rounded-full bg-white/30 inline-block" />
                </span>
              ));
            })()}
          </div>
        </div>

        <div className="glass-card rounded-xl shadow-sm p-6 mb-8 flex items-center justify-between reveal reveal-up">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 flex-shrink-0 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center relative">
              <Mountain className="w-8 h-8 text-emerald-400 bounce-soft" />
              {siteStats && siteStats.upcomingHikes > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full bg-emerald-500 text-white text-[10px] flex items-center justify-center font-bold px-1">
                  {siteStats.upcomingHikes}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Create Hike</h3>
              <p className="text-sm text-gray-200">Organize and join group hiking events</p>
            </div>
          </div>
          <button onClick={() => setIsCreateHikeModalOpen(true)} className="glass-button-dark font-semibold py-2.5 px-6 rounded-full transition-all shadow-md text-white">Create Hike</button>
        </div>
        {(isLoadingPhotos || (Array.isArray(photos) && photos.length > 0) || photosError) && (
          <PhotoFeed photos={photos as any} isLoading={isLoadingPhotos} error={photosError} currentUserName={user?.name || "Traveler"} onDeleted={(id) => setPhotos((prev) => prev.filter((p: any) => p._id !== id))} />
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

// #region Exports
export default Homepage;
// #endregion Exports
