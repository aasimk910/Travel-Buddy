// src/pages/Homepage.tsx
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Map,
  LogOut,
  User,
  Compass,
  Users,
  Calendar,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const MAX_PHOTO_SIZE_BYTES = 6 * 1024 * 1024; // 6MB

const FEATURED_LOCATIONS = [
  "Chamlang Central",
  "Nagarkot View Tower",
  "Sarangkot Viewpoint",
  "Dhulikhel Sunrise Point",
  "Poon Hill",
  "Shivapuri Peak",
];

const getRandomLocation = (current?: string) => {
  const filtered = FEATURED_LOCATIONS.filter((loc) => loc !== current);
  const list = filtered.length ? filtered : FEATURED_LOCATIONS;
  return list[Math.floor(Math.random() * list.length)];
};

type PhotoItem = {
  _id: string;
  userName: string;
  caption?: string;
  images?: string[];
  imageData?: string;
  createdAt?: string;
};

const convertFileToBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const Homepage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [reviewLocation, setReviewLocation] = useState<string>(
    () => getRandomLocation()
  );
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [photoCaption, setPhotoCaption] = useState<string>("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoMessage, setPhotoMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [photos, setPhotos] = useState<PhotoItem[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [photosError, setPhotosError] = useState<string | null>(null);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [photoIndices, setPhotoIndices] = useState<Record<string, number>>({});

  const safeUserName = user?.name || "Traveler";

  const fetchLatestPhotos = async () => {
    setIsLoadingPhotos(true);
    setPhotosError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/photos/latest`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to load photos.");
      }
      setPhotos(data);
    } catch (err) {
      setPhotosError(
        err instanceof Error
          ? err.message
          : "Unable to load photos. Please try again."
      );
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    setDeletingPhotoId(id);
    try {
      const res = await fetch(`${API_BASE_URL}/api/photos/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to delete photo.");
      }
      setPhotos((prev) => prev.filter((photo) => photo._id !== id));
    } catch (err) {
      setPhotosError(
        err instanceof Error
          ? err.message
          : "Unable to delete photo. Please try again."
      );
    } finally {
      setDeletingPhotoId(null);
    }
  };

  useEffect(() => {
    fetchLatestPhotos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReviewSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    if (!reviewRating) {
      setReviewMessage({
        type: "error",
        text: "Please rate the location before submitting.",
      });
      return;
    }

    setIsSubmittingReview(true);
    setReviewMessage(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: safeUserName,
          locationName: reviewLocation,
          rating: reviewRating,
          comment: reviewComment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to submit review.");
      }

      setReviewMessage({
        type: "success",
        text: "Thanks for sharing your review!",
      });
      setReviewComment("");
      setReviewRating(0);
    } catch (err) {
      setReviewMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Unable to submit review. Please try again.",
      });
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleShowAnotherLocation = () => {
    setReviewLocation(getRandomLocation(reviewLocation));
    setReviewRating(0);
    setReviewComment("");
    setReviewMessage(null);
  };

  const handlePhotoChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = Array.from(event.target.files ?? []);
    setPhotoMessage(null);

    if (!files.length) {
      setSelectedPhotos([]);
      setPhotoPreviews([]);
      return;
    }

    setSelectedPhotos(files);

    try {
      const previews = await Promise.all(files.map(convertFileToBase64));
      setPhotoPreviews(previews);
    } catch (err) {
      console.error("Failed to create photo previews", err);
      setPhotoPreviews([]);
    }
  };

  const handlePhotoSubmit = async () => {
    if (!selectedPhotos.length) {
      setPhotoMessage({
        type: "error",
        text: "Please choose at least one photo to upload.",
      });
      return;
    }

    setIsUploadingPhoto(true);
    setPhotoMessage(null);

    try {
      for (const file of selectedPhotos) {
        if (file.size > MAX_PHOTO_SIZE_BYTES) {
          throw new Error(`Each photo must be smaller than 6MB.`);
        }
      }

      const imagesData = await Promise.all(
        selectedPhotos.map((file) => convertFileToBase64(file))
      );

      const res = await fetch(`${API_BASE_URL}/api/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userName: safeUserName,
          caption: photoCaption,
          images: imagesData,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to upload photo(s).");
      }

      setPhotoMessage({
        type: "success",
        text: "Photo(s) uploaded successfully!",
      });
      setSelectedPhotos([]);
      setPhotoPreviews([]);
      setPhotoCaption("");
      await fetchLatestPhotos();
    } catch (err) {
      setPhotoMessage({
        type: "error",
        text:
          err instanceof Error
            ? err.message
            : "Unable to upload photo. Please try again.",
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/homepage")}
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
              to="/homepage"
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
            <Link
              to="/dashboard"
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Dashboard
            </Link>
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-gray-700">
              <User className="w-4 h-4" />
              <span>{user?.name || "User"}</span>
            </div>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 justify-center rounded-full bg-gray-900 px-4 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-black"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || "Traveler"}! 👋
          </h1>
          <p className="text-gray-600">
            Welcome to the mountain lovers community!
          </p>
        </div>

        {/* Profile summary card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gray-900 text-white flex items-center justify-center text-xl font-semibold">
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  {user?.name || "User"}
                </h2>
                <p className="text-sm text-gray-600">{user?.email}</p>
                {user?.country && (
                  <p className="text-xs text-gray-500 mt-1">
                    📍 {user.country}
                  </p>
                )}
              </div>
            </div>
            <Link
              to="/dashboard"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Edit Profile
            </Link>
          </div>

          {/* Travel preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-100">
            {user?.travelStyle && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Travel Style</p>
                <p className="text-sm font-medium text-gray-900">
                  {user.travelStyle}
                </p>
              </div>
            )}
            {user?.budgetRange && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Budget Range</p>
                <p className="text-sm font-medium text-gray-900">
                  {user.budgetRange}
                </p>
              </div>
            )}
            {user?.interests && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Interests</p>
                <p className="text-sm font-medium text-gray-900">
                  {user.interests}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Location Review and Photo Upload Cards */}
        <div className="grid gap-6 lg:grid-cols-2 mb-8">
          {/* Location Review Card */}
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl shadow-sm border border-gray-100 p-8">
            <form onSubmit={handleReviewSubmit}>
              <div className="flex flex-col items-center text-center mb-6">
                <div className="w-20 h-20 mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full">
                    <defs>
                      <linearGradient id="mountainGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" style={{ stopColor: "#10b981", stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: "#059669", stopOpacity: 1 }} />
                      </linearGradient>
                    </defs>
                    <polygon points="50,20 70,60 30,60" fill="url(#mountainGrad)" />
                    <polygon points="35,60 55,30 75,60" fill="#047857" opacity="0.8" />
                    <rect x="0" y="60" width="100" height="40" fill="#86efac" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Have you been to{" "}
                  <span className="underline decoration-2 decoration-gray-900">
                    {reviewLocation}
                  </span>
                  ?
                </h3>
                <div className="flex gap-1 mb-4" aria-label="Select a rating out of five stars">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setReviewRating(star)}
                      className={`text-2xl transition-colors ${
                        reviewRating >= star ? "text-yellow-400" : "text-gray-300"
                      }`}
                      aria-pressed={reviewRating === star}
                    >
                      ★
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                placeholder="Write your review or a comment here..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none mb-4"
                rows={4}
              />
              {reviewMessage && (
                <div
                  className={`mb-3 rounded-lg px-3 py-2 text-sm ${
                    reviewMessage.type === "success"
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {reviewMessage.text}
                </div>
              )}
              <button
                type="submit"
                disabled={isSubmittingReview}
                className="w-full bg-gradient-to-r from-pink-100 to-purple-100 text-gray-900 font-semibold py-3 px-4 rounded-lg hover:from-pink-200 hover:to-purple-200 transition-all mb-3 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>✍️</span>
                {isSubmittingReview ? "Submitting..." : "Submit Review"}
              </button>
              <button
                type="button"
                onClick={handleShowAnotherLocation}
                disabled={isSubmittingReview}
                className="w-full bg-gradient-to-r from-yellow-100 to-orange-100 text-gray-900 font-medium py-3 px-4 rounded-lg hover:from-yellow-200 hover:to-orange-200 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <span>🔄</span>
                Show another
              </button>
            </form>
          </div>

          {/* Upload Trail Photos Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 mb-4 flex items-center justify-center">
                <span className="text-6xl">📸</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Share your{" "}
                <span className="underline decoration-2 decoration-gray-900">
                  Trail Photos
                </span>
              </h3>
              <p className="text-sm text-gray-600">
                Upload photos from your hikes, treks, and adventures
              </p>
            </div>
            
            {/* Upload Area */}
            <div className="mb-4">
              <label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 hover:bg-white/50 transition-all"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-10 h-10 mb-2 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <p className="text-sm text-gray-600 font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    PNG, JPG up to 10MB
                  </p>
                </div>
                <input
                  id="photo-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoChange}
                />
              </label>
              {selectedPhotos.length > 0 && (
                <>
                  <p className="mt-2 text-xs text-gray-600 text-center">
                    Selected {selectedPhotos.length}{" "}
                    {selectedPhotos.length === 1 ? "photo" : "photos"}
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {photoPreviews.map((preview, index) => (
                      <div
                        key={index}
                        className="rounded-lg overflow-hidden border border-gray-200 h-20"
                      >
                        <img
                          src={preview}
                          alt={`Selected trail preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <textarea
              value={photoCaption}
              onChange={(event) => setPhotoCaption(event.target.value)}
              placeholder="Add a caption or description..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none mb-4"
              rows={3}
            />

            {photoMessage && (
              <div
                className={`mb-3 rounded-lg px-3 py-2 text-sm ${
                  photoMessage.type === "success"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {photoMessage.text}
              </div>
            )}

            <button
              type="button"
              onClick={handlePhotoSubmit}
              disabled={isUploadingPhoto}
              className="w-full bg-gradient-to-r from-blue-100 to-indigo-100 text-gray-900 font-semibold py-3 px-4 rounded-lg hover:from-blue-200 hover:to-indigo-200 transition-all mb-3 flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>📤</span>
              {isUploadingPhoto ? "Uploading..." : "Upload Photos"}
            </button>
            <button className="w-full bg-gradient-to-r from-purple-100 to-pink-100 text-gray-900 font-medium py-3 px-4 rounded-lg hover:from-purple-200 hover:to-pink-200 transition-all flex items-center justify-center gap-2">
              <span>🖼️</span>
              View Gallery
            </button>
          </div>
        </div>

        {/* Create Hike Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 flex-shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <defs>
                  <linearGradient id="hikeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: "#10b981", stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: "#059669", stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <polygon points="30,50 50,20 70,50" fill="url(#hikeGrad)" />
                <polygon points="20,70 40,40 60,70" fill="#047857" />
                <rect x="0" y="70" width="100" height="30" fill="#86efac" />
                <circle cx="65" cy="35" r="8" fill="#fbbf24" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                Create Hike
              </h3>
              <p className="text-sm text-gray-600">
                Organize and join group hiking events
              </p>
            </div>
          </div>
          <button className="bg-gradient-to-r from-orange-400 to-red-400 text-white font-semibold py-2.5 px-6 rounded-full hover:from-orange-500 hover:to-red-500 transition-all shadow-md">
            Create Hike
          </button>
        </div>

        {/* Photo feed */}
        {(isLoadingPhotos || photos.length > 0 || photosError) && (
          <section className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Latest trail photos
              </h2>
              <p className="text-xs text-gray-500">
                Shared by the Travel Buddy community
              </p>
            </div>

            {photosError && (
              <div className="mb-4 rounded-md bg-red-50 border border-red-100 px-3 py-2 text-xs text-red-700">
                {photosError}
              </div>
            )}

            {isLoadingPhotos && photos.length === 0 ? (
              <p className="text-sm text-gray-500">Loading photos…</p>
            ) : photos.length === 0 ? (
              <p className="text-sm text-gray-500">
                No photos have been shared yet. Be the first to upload one!
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {photos.map((photo) => {
                  const imageList =
                    photo.images && photo.images.length
                      ? photo.images
                      : photo.imageData
                      ? [photo.imageData]
                      : [];

                  const totalImages = imageList.length;
                  const currentIndex =
                    photoIndices[photo._id] && photoIndices[photo._id] < totalImages
                      ? photoIndices[photo._id]
                      : 0;

                  const handleChangeIndex = (delta: number) => {
                    setPhotoIndices((prev) => {
                      const current =
                        prev[photo._id] && prev[photo._id] < totalImages
                          ? prev[photo._id]
                          : 0;
                      const next =
                        (current + delta + totalImages) % Math.max(totalImages, 1);
                      return { ...prev, [photo._id]: next };
                    });
                  };

                  return (
                    <article
                      key={photo._id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col relative"
                    >
                      {photo.userName === safeUserName && (
                        <button
                          type="button"
                          onClick={() => handleDeletePhoto(photo._id)}
                          disabled={deletingPhotoId === photo._id}
                          className="absolute top-2 right-2 z-10 inline-flex items-center justify-center rounded-full bg-white/90 px-2 py-1 text-[10px] font-medium text-gray-700 shadow-sm hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
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
                              onClick={() => handleChangeIndex(-1)}
                              className="absolute left-1 top-1/2 -translate-y-1/2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white text-xs hover:bg-black/70"
                            >
                              ‹
                            </button>
                            <button
                              type="button"
                              onClick={() => handleChangeIndex(1)}
                              className="absolute right-1 top-1/2 -translate-y-1/2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white text-xs hover:bg-black/70"
                            >
                              ›
                            </button>
                          </>
                        )}
                        {imageList[currentIndex] && (
                          <img
                            src={imageList[currentIndex]}
                            alt={
                              photo.caption ||
                              `Trail photo shared by ${photo.userName}`
                            }
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>

                      <div className="p-3 flex-1 flex flex-col">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span className="font-medium text-gray-800">
                            {photo.userName}
                          </span>
                          {photo.createdAt && (
                            <span>
                              {new Date(photo.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {photo.caption && (
                          <p className="text-sm text-gray-700 mt-1 line-clamp-3">
                            {photo.caption}
                          </p>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} Travel Buddy. Built for real travelers.
          </p>
          <div className="flex gap-4 text-xs text-gray-500">
            <button className="hover:text-gray-800">Privacy</button>
            <button className="hover:text-gray-800">Terms</button>
            <button className="hover:text-gray-800">Help</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;

