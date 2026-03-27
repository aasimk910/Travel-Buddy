// src/pages/Homepage.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Mountain } from "lucide-react";
import ProfileSummaryCard from "../components/homepage/ProfileSummaryCard";
import ReviewCard from "../components/homepage/ReviewCard";
import PhotoUploadCard from "../components/homepage/PhotoUploadCard";
import PhotoFeed from "../components/homepage/PhotoFeed";
import CreateHikeModal from "../components/homepage/CreateHikeModal";
import { getLatestPhotos } from "../services/photos";
import { getRecommendedHikes, type Hike } from "../services/hikes";

 

const Homepage: React.FC = () => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [recommendedHikes, setRecommendedHikes] = useState<Hike[]>([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);
  const [recommendationsError, setRecommendationsError] = useState<string | null>(null);
  const [isCreateHikeModalOpen, setIsCreateHikeModalOpen] = useState(false);

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

  const fetchRecommendations = async () => {
    const token = localStorage.getItem("travelBuddyToken");
    if (!token) return;

    setIsLoadingRecommendations(true);
    setRecommendationsError(null);
    try {
      const hikes = await getRecommendedHikes(token);
      console.log("[Homepage] Received recommendations:", hikes?.length, "hikes");
      console.log("[Homepage] Recommendation hike titles:", hikes?.map((h: any) => ({ title: h.title, difficulty: h.difficulty, location: h.location })));
      setRecommendedHikes(hikes);
    } catch (err: any) {
      console.error("[Homepage] Recommendations error:", err);
      setRecommendationsError(
        err?.message || "Unable to load recommendations right now."
      );
      setRecommendedHikes([]);
    } finally {
      setIsLoadingRecommendations(false);
    }
  };

  useEffect(() => {
    fetchLatestPhotos();
    fetchRecommendations();
  }, []);

  return (
    <>
      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user?.name || "Traveler"}!</h1>
          <p className="text-gray-200">Welcome to the mountain lovers community!</p>
        </div>
        <ProfileSummaryCard />

        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          <ReviewCard />
          <PhotoUploadCard onUploaded={fetchLatestPhotos} />
        </div>
        <section className="glass-card rounded-xl shadow-sm p-6 mb-8">
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

          {!isLoadingRecommendations && recommendationsError && (
            <p className="text-sm text-red-300">{recommendationsError}</p>
          )}

          {!isLoadingRecommendations && !recommendationsError && recommendedHikes.length === 0 && (
            <p className="text-sm text-gray-200">
              No recommendations yet. As new hikes are added, we will suggest the best ones here.
            </p>
          )}

          {!isLoadingRecommendations && !recommendationsError && recommendedHikes.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {recommendedHikes.map((hike) => (
                <article key={hike._id} className="glass-button rounded-xl p-4">
                  <h3 className="text-base font-semibold text-white line-clamp-2">{hike.title}</h3>
                  <p className="text-sm text-gray-200 mt-1">{hike.location}</p>
                  <div className="mt-3 flex items-center justify-between text-xs text-gray-300">
                    <span>Difficulty {hike.difficulty}/5</span>
                    <span>{new Date(hike.date).toLocaleDateString()}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <div className="glass-card rounded-xl shadow-sm p-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 flex-shrink-0 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <Mountain className="w-8 h-8 text-emerald-400" />
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
    </>
  );
};

export default Homepage;
