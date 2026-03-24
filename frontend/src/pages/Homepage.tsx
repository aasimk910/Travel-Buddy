// src/pages/Homepage.tsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Mountain } from "lucide-react";
import ProfileSummaryCard from "../components/homepage/ProfileSummaryCard";
import ReviewCard from "../components/homepage/ReviewCard";
import PhotoUploadCard from "../components/homepage/PhotoUploadCard";
import PhotoFeed from "../components/homepage/PhotoFeed";
import CreateHikeModal from "../components/homepage/CreateHikeModal";
import { getLatestPhotos } from "../services/photos";

 

const Homepage: React.FC = () => {
  const { user } = useAuth();
  const [photos, setPhotos] = useState<any[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [photosError, setPhotosError] = useState<string | null>(null);
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

  useEffect(() => {
    fetchLatestPhotos();
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
