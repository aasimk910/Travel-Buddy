import React, { useState } from "react";
import { useToast } from "../../context/ToastContext";
import type { PhotoItem } from "../../services/photos";
import { deletePhoto } from "../../services/photos";

type PhotoFeedProps = {
  photos: PhotoItem[];
  isLoading: boolean;
  error?: string | null;
  currentUserName: string;
  onDeleted?: (id: string) => void;
};

const PhotoFeed: React.FC<PhotoFeedProps> = ({ photos, isLoading, error, currentUserName, onDeleted }) => {
  const { showSuccess, showError } = useToast();
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [photoIndices, setPhotoIndices] = useState<Record<string, number>>({});

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    setDeletingPhotoId(id);
    try {
      const token = localStorage.getItem("travelBuddyToken") || undefined;
      await deletePhoto(id, token);
      showSuccess("Photo deleted successfully!");
      onDeleted && onDeleted(id);
    } catch (err: any) {
      const errorMessage = err?.message || "Unable to delete photo. Please try again.";
      showError(errorMessage);
    } finally {
      setDeletingPhotoId(null);
    }
  };

  const changeIndex = (photoId: string, delta: number, total: number) => {
    setPhotoIndices((prev) => {
      const current = prev[photoId] && prev[photoId] < total ? prev[photoId] : 0;
      const next = (current + delta + total) % Math.max(total, 1);
      return { ...prev, [photoId]: next };
    });
  };

  if (error) {
    return <div className="mb-4 rounded-md glass-dark px-3 py-2 text-xs text-red-200">{error}</div>;
  }

  if (isLoading && (!Array.isArray(photos) || photos.length === 0)) {
    return <p className="text-sm text-gray-200">Loading photos…</p>;
  }

  if (!Array.isArray(photos) || photos.length === 0) {
    return <p className="text-sm text-gray-200">No photos have been shared yet. Be the first to upload one!</p>;
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Latest trail photos</h2>
        <p className="text-xs text-gray-200">Shared by the Travel Buddy community</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {photos.map((photo) => {
          const imageList = photo.images && photo.images.length ? photo.images : photo.imageData ? [photo.imageData] : [];
          const totalImages = imageList.length;
          const currentIndex = photoIndices[photo._id] && photoIndices[photo._id] < totalImages ? photoIndices[photo._id] : 0;

          return (
            <article key={photo._id} className="glass-card rounded-xl shadow-sm overflow-hidden flex flex-col relative">
              {photo.userName === currentUserName && (
                <button
                  type="button"
                  onClick={() => handleDelete(photo._id)}
                  disabled={deletingPhotoId === photo._id}
                  className="absolute top-2 right-2 z-10 inline-flex items-center justify-center rounded-full glass-strong px-2 py-1 text-[10px] font-medium text-black shadow-sm hover:bg-red-200/50 disabled:opacity-60"
                >
                  {deletingPhotoId === photo._id ? "Deleting…" : "Delete"}
                </button>
              )}

              <div className="relative aspect-[4/5] bg-gray-200">
                {totalImages > 1 && (
                  <div className="absolute top-2 left-2 z-10 rounded-full bg-black/60 px-2 py-1 text-[10px] font-medium text-white">
                    {currentIndex + 1}/{totalImages}
                  </div>
                )}
                {totalImages > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => changeIndex(photo._id, -1, totalImages)}
                      className="absolute left-1 top-1/2 -translate-y-1/2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white text-xs hover:bg-black/70"
                    >
                      ‹
                    </button>
                    <button
                      type="button"
                      onClick={() => changeIndex(photo._id, 1, totalImages)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white text-xs hover:bg-black/70"
                    >
                      ›
                    </button>
                  </>
                )}
                {imageList[currentIndex] && (
                  <img
                    src={imageList[currentIndex]}
                    alt={photo.caption || `Trail photo shared by ${photo.userName}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              <div className="p-3 flex-1 flex flex-col">
                <div className="flex items-center justify-between text-xs text-gray-200 mb-1">
                  <span className="font-medium text-white">{photo.userName}</span>
                  {photo.createdAt && <span>{new Date(photo.createdAt).toLocaleDateString()}</span>}
                </div>
                {photo.caption && <p className="text-sm text-gray-200 mt-1 line-clamp-3">{photo.caption}</p>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

export default PhotoFeed;
