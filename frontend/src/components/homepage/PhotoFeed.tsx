// src/components/homepage/PhotoFeed.tsx
// Displays a grid of user-uploaded travel photos with delete capability for own photos.
// #region Imports
import React, { useState } from "react";
import { useToast } from "../../context/ToastContext";
import type { PhotoItem } from "../../services/photos";
import { deletePhoto } from "../../services/photos";
import { getToken } from "../../services/auth";

// #endregion Imports

// #region Types
type PhotoFeedProps = {
  photos: PhotoItem[];
  isLoading: boolean;
  error?: string | null;
  currentUserName: string;
  onDeleted?: (id: string) => void;
};

// #endregion Types

// #region Component
const PhotoFeed: React.FC<PhotoFeedProps> = ({ photos, isLoading, error, currentUserName, onDeleted }) => {
  const { showSuccess, showError } = useToast();
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [photoIndices, setPhotoIndices] = useState<Record<string, number>>({});
  const [lightbox, setLightbox] = useState<{ src: string; alt: string; userName: string; caption?: string } | null>(null);

  // Handles handleDelete logic.
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    setDeletingPhotoId(id);
    try {
      const token = getToken() || undefined;
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

  // Handles changeIndex logic.
  const changeIndex = (photoId: string, delta: number, total: number) => {
    setPhotoIndices((prev) => {
      const current = prev[photoId] && prev[photoId] < total ? prev[photoId] : 0;
      const next = (current + delta + total) % Math.max(total, 1);
      return { ...prev, [photoId]: next };
    });
  };

  if (error) {
    return <div className="mb-4 rounded-lg px-4 py-3 text-sm bg-red-900/20 border border-red-700/30 text-red-400">{error}</div>;
  }

  if (isLoading && (!Array.isArray(photos) || photos.length === 0)) {
    return (
      <div className="flex items-center gap-3 py-6 text-[#B8B4AA]">
        <div className="w-4 h-4 rounded-full border-2 border-[#C6A16E] border-t-transparent animate-spin" />
        <span className="text-sm">Loading photos…</span>
      </div>
    );
  }

  if (!Array.isArray(photos) || photos.length === 0) {
    return (
      <div className="site-card rounded-xl p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-[#8FA68E]/10 border border-[#8FA68E]/25 flex items-center justify-center mx-auto mb-3">
          <span className="text-2xl">📷</span>
        </div>
        <p className="text-[#B8B4AA] text-sm">No photos shared yet. Be the first to upload!</p>
      </div>
    );
  }

  return (
    <>
      <section className="mb-8">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {photos.map((photo) => {
          const imageList = photo.images && photo.images.length ? photo.images : photo.imageData ? [photo.imageData] : [];
          const totalImages = imageList.length;
          const currentIndex = photoIndices[photo._id] && photoIndices[photo._id] < totalImages ? photoIndices[photo._id] : 0;

          return (
            <article key={photo._id} className="site-card rounded-xl overflow-hidden flex flex-col group relative">
              {/* Delete */}
              {photo.userName === currentUserName && (
                <button
                  type="button"
                  onClick={() => handleDelete(photo._id)}
                  disabled={deletingPhotoId === photo._id}
                  className="absolute top-2 right-2 z-10 px-2 py-1 rounded-md bg-[#0B0F0C]/70 border border-red-700/30 text-red-400 text-[10px] font-medium hover:bg-red-900/40 disabled:opacity-60 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {deletingPhotoId === photo._id ? "…" : "Delete"}
                </button>
              )}

              {/* Image */}
              <div className="relative w-full aspect-[4/5] bg-[#111714] overflow-hidden">
                {totalImages > 1 && (
                  <div className="absolute top-2 left-2 z-10 rounded-md bg-[#0B0F0C]/70 px-2 py-0.5 text-[10px] font-medium text-[#B8B4AA]">
                    {currentIndex + 1}/{totalImages}
                  </div>
                )}
                {totalImages > 1 && (
                  <>
                    <button type="button" onClick={() => changeIndex(photo._id, -1, totalImages)}
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-[#0B0F0C]/70 text-[#F5F3EE] hover:bg-[#0B0F0C]/90 transition-all">
                      ‹
                    </button>
                    <button type="button" onClick={() => changeIndex(photo._id, 1, totalImages)}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 z-10 w-7 h-7 flex items-center justify-center rounded-full bg-[#0B0F0C]/70 text-[#F5F3EE] hover:bg-[#0B0F0C]/90 transition-all">
                      ›
                    </button>
                  </>
                )}
                {imageList[currentIndex] && (
                  <img
                    src={imageList[currentIndex]}
                    alt={photo.caption || `Trail photo by ${photo.userName}`}
                    className="w-full h-full object-cover cursor-zoom-in group-hover:scale-[1.03] transition-transform duration-500"
                    onClick={() => setLightbox({ src: imageList[currentIndex], alt: photo.caption || `Trail photo by ${photo.userName}`, userName: photo.userName, caption: photo.caption })}
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F0C]/65 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Footer */}
              <div className="p-3 flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-[#1E2820] border border-[#C6A16E]/25 flex items-center justify-center text-[10px] font-bold text-[#C6A16E] shrink-0">
                    {photo.userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-medium text-[#F5F3EE] truncate">{photo.userName}</span>
                </div>
                {photo.createdAt && (
                  <span className="text-[10px] text-[#8E8A81] shrink-0 ml-2">
                    {new Date(photo.createdAt).toLocaleDateString()}
                  </span>
                )}
              </div>
              {photo.caption && (
                <p className="px-3 pb-3 text-xs text-[#8E8A81] line-clamp-2 -mt-1">{photo.caption}</p>
              )}
            </article>
          );
        })}
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F0C]/85 p-4"
          onClick={() => setLightbox(null)}
        >
          <div
            className="relative w-full max-w-lg site-card rounded-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/8">
              <div className="w-8 h-8 rounded-full bg-[#1E2820] border border-[#C6A16E]/30 flex items-center justify-center text-xs font-bold text-[#C6A16E] shrink-0">
                {lightbox.userName.charAt(0).toUpperCase()}
              </div>
              <span className="font-semibold text-sm text-[#F5F3EE] truncate">{lightbox.userName}</span>
              <button
                type="button"
                onClick={() => setLightbox(null)}
                className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg text-[#8E8A81] hover:text-[#F5F3EE] hover:bg-white/8 transition-all text-xl"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="w-full bg-[#111714] flex items-center justify-center max-h-[70vh]">
              <img src={lightbox.src} alt={lightbox.alt} className="w-full max-h-[70vh] object-contain" />
            </div>
            {lightbox.caption && (
              <div className="px-4 py-3 border-t border-white/8">
                <p className="text-sm text-[#B8B4AA]">
                  <span className="font-semibold text-[#F5F3EE] mr-1.5">{lightbox.userName}</span>
                  {lightbox.caption}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

// #endregion Component

// #region Exports
export default PhotoFeed;
// #endregion Exports
