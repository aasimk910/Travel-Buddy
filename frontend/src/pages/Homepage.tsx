// src/pages/Homepage.tsx
import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Map,
  User,
  Compass,
  Users,
  Calendar,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import DOMPurify from "dompurify";
import { compressImage } from "../utils/imageCompression";
import LogoutButton from "../components/LogoutButton";

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_BASE_URL || "http://localhost:5000";

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
  const { showSuccess, showError } = useToast();
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

  // Create Hike Modal State
  const [isCreateHikeModalOpen, setIsCreateHikeModalOpen] = useState(false);
  const [hikeTitle, setHikeTitle] = useState("");
  const [hikeLocation, setHikeLocation] = useState("");
  const [hikeDate, setHikeDate] = useState("");
  const [hikeDifficulty, setHikeDifficulty] = useState<number>(1);
  const [hikeSpotsLeft, setHikeSpotsLeft] = useState<number>(10);
  const [hikeImageFile, setHikeImageFile] = useState<File | null>(null);
  const [hikeImagePreview, setHikeImagePreview] = useState<string>("");
  const [hikeDescription, setHikeDescription] = useState("");
  const [isCreatingHike, setIsCreatingHike] = useState(false);
  const [hikeMessage, setHikeMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(true);
  const [isHikeDetailsExpanded, setIsHikeDetailsExpanded] = useState(false);

  const safeUserName = user?.name || "Traveler";

  const difficultyLabels = [
    "Very Easy",
    "Easy",
    "Moderate",
    "Hard",
    "Expert",
  ];

  const fetchLatestPhotos = async () => {
    setIsLoadingPhotos(true);
    setPhotosError(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/photos/latest`);
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to load photos.");
      }
      // Handle paginated response - ensure we always set an array
      const photosArray = Array.isArray(data) 
        ? data 
        : (Array.isArray(data.photos) ? data.photos : []);
      setPhotos(photosArray);
    } catch (err) {
      setPhotosError(
        err instanceof Error
          ? err.message
          : "Unable to load photos. Please try again."
      );
      // Set empty array on error to prevent map errors
      setPhotos([]);
    } finally {
      setIsLoadingPhotos(false);
    }
  };

  const handleDeletePhoto = async (id: string) => {
    // Confirmation dialog
    if (!window.confirm("Are you sure you want to delete this photo?")) {
      return;
    }

    setDeletingPhotoId(id);
    try {
      const token = localStorage.getItem("travelBuddyToken");
      const res = await fetch(`${API_BASE_URL}/api/photos/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to delete photo.");
      }
      setPhotos((prev) => prev.filter((photo) => photo._id !== id));
      showSuccess("Photo deleted successfully!");
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Unable to delete photo. Please try again.";
      setPhotosError(errorMessage);
      showError(errorMessage);
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

    // Validation
    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      setReviewMessage({
        type: "error",
        text: "Please select a rating between 1 and 5 stars.",
      });
      return;
    }

    if (!reviewLocation || !reviewLocation.trim()) {
      setReviewMessage({
        type: "error",
        text: "Location is required.",
      });
      return;
    }

    setIsSubmittingReview(true);
    setReviewMessage(null);

    try {
      const token = localStorage.getItem("travelBuddyToken");
      if (!token) {
        setReviewMessage({
          type: "error",
          text: "You must be logged in to submit a review.",
        });
        navigate("/login");
        return;
      }

      // Sanitize inputs
      const sanitizedComment = reviewComment
        ? DOMPurify.sanitize(reviewComment)
        : undefined;

      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          locationName: reviewLocation.trim(),
          rating: reviewRating,
          comment: sanitizedComment,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        // Show specific error message from backend
        const errorMsg = data.message || "Unable to submit review.";
        setReviewMessage({
          type: "error",
          text: errorMsg,
        });
        showError(errorMsg);
        return;
      }

      setReviewMessage({
        type: "success",
        text: "Thanks for sharing your review!",
      });
      showSuccess("Review submitted successfully!");
      
      // Reset form
      setReviewLocation(getRandomLocation(reviewLocation));
      setReviewComment("");
      setReviewRating(0);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setReviewMessage(null);
      }, 3000);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Unable to submit review. Please try again.";
      setReviewMessage({
        type: "error",
        text: errorMessage,
      });
      showError(errorMessage);
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

    // Validate file sizes
    const oversizedFiles = files.filter(
      (file) => file.size > MAX_PHOTO_SIZE_BYTES
    );
    if (oversizedFiles.length > 0) {
      showError(
        `Some files are too large. Maximum size is ${MAX_PHOTO_SIZE_BYTES / (1024 * 1024)}MB per file.`
      );
      return;
    }

    // Validate file types
    const invalidFiles = files.filter(
      (file) => !file.type.startsWith("image/")
    );
    if (invalidFiles.length > 0) {
      showError("Please select only image files.");
      return;
    }

    // Compress images before setting them
    try {
      const compressedFiles = await Promise.all(
        files.map((file) => compressImage(file))
      );
      setSelectedPhotos(compressedFiles);

      const previews = await Promise.all(
        compressedFiles.map(convertFileToBase64)
      );
      setPhotoPreviews(previews);
    } catch (err) {
      console.error("Failed to process images", err);
      showError("Failed to process images. Please try again.");
      setPhotoPreviews([]);
      setSelectedPhotos([]);
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

      // Images are already compressed, just convert to base64
      const imagesData = await Promise.all(
        selectedPhotos.map((file) => convertFileToBase64(file))
      );

      const token = localStorage.getItem("travelBuddyToken");
      const res = await fetch(`${API_BASE_URL}/api/photos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
        },
        body: JSON.stringify({
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
      showSuccess("Photo(s) uploaded successfully!");
      setSelectedPhotos([]);
      setPhotoPreviews([]);
      setPhotoCaption("");
      await fetchLatestPhotos();
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Unable to upload photo. Please try again.";
      setPhotoMessage({
        type: "error",
        text: errorMessage,
      });
      showError(errorMessage);
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleCreateHike = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hikeTitle || !hikeLocation || !hikeDate) {
      setHikeMessage({
        type: "error",
        text: "Please fill in all required fields (Title, Location, Date).",
      });
      return;
    }

    setIsCreatingHike(true);
    setHikeMessage(null);

    try {
      // Convert image file to base64 if present
      let imageBase64: string | undefined;
      if (hikeImageFile) {
        imageBase64 = await convertFileToBase64(hikeImageFile);
      }

      const token = localStorage.getItem("travelBuddyToken");
      if (!token) {
        setHikeMessage({
          type: "error",
          text: "You must be logged in to create a hike.",
        });
        navigate("/login");
        return;
      }

      // Sanitize inputs
      const sanitizedTitle = DOMPurify.sanitize(hikeTitle);
      const sanitizedLocation = DOMPurify.sanitize(hikeLocation);
      const sanitizedDescription = hikeDescription
        ? DOMPurify.sanitize(hikeDescription)
        : undefined;

      const res = await fetch(`${API_BASE_URL}/api/hikes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: sanitizedTitle,
          location: sanitizedLocation,
          date: hikeDate,
          difficulty: hikeDifficulty,
          spotsLeft: hikeSpotsLeft,
          imageUrl: imageBase64 || undefined,
          description: sanitizedDescription,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to create hike.");
      }

      setHikeMessage({
        type: "success",
        text: "Hike created successfully!",
      });
      showSuccess("Hike created successfully!");

      // Reset form
      setHikeTitle("");
      setHikeLocation("");
      setHikeDate("");
      setHikeDifficulty(1);
      setHikeSpotsLeft(10);
      setHikeImageFile(null);
      setHikeImagePreview("");
      setHikeDescription("");

      // Close modal after 1.5 seconds
      setTimeout(() => {
        setIsCreateHikeModalOpen(false);
        setHikeMessage(null);
      }, 1500);
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Unable to create hike. Please try again.";
      setHikeMessage({
        type: "error",
        text: errorMessage,
      });
      showError(errorMessage);
    } finally {
      setIsCreatingHike(false);
    }
  };

  const handleHikeImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setHikeImageFile(null);
      setHikeImagePreview("");
      return;
    }

    // Check file size
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setHikeMessage({
        type: "error",
        text: `Image size must be less than ${MAX_PHOTO_SIZE_BYTES / (1024 * 1024)}MB.`,
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      setHikeMessage({
        type: "error",
        text: "Please select an image file.",
      });
      return;
    }

    setHikeImageFile(file);
    try {
      const preview = await convertFileToBase64(file);
      setHikeImagePreview(preview);
    } catch (err) {
      console.error("Failed to create image preview", err);
      setHikeImagePreview("");
    }
  };


  return (
    <div className="min-h-screen">
      {/* Top navigation */}
      <header className="glass-nav sticky top-0 z-10">
        <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 flex items-center justify-between h-16">
          {/* Logo */}
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/homepage")}
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
              <Link
                to="/homepage"
                className="text-white font-medium border-b-2 border-white pb-1"
              >
                Home
              </Link>
              <Link
                to="/hikes"
                className="text-gray-200 hover:text-white transition-colors"
              >
                Hikes
              </Link>
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-white">
              <User className="w-4 h-4" />
              <span>{user?.name || "User"}</span>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.name || "Traveler"}! 👋
          </h1>
          <p className="text-gray-200">
            Welcome to the mountain lovers community!
          </p>
        </div>

        {/* Profile summary card */}
        <div className="glass-card rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full glass-button-dark text-white flex items-center justify-center text-xl font-semibold overflow-hidden border-2 border-white/30">
                {user?.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt={user.name || "User"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{user?.name?.[0]?.toUpperCase() || "U"}</span>
                )}
              </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">
                    {user?.name || "User"}
                  </h2>
                  <p className="text-sm text-gray-200">{user?.email}</p>
                  {user?.country && (
                    <p className="text-xs text-gray-300 mt-1">
                      📍 {user.country}
                    </p>
                  )}
              </div>
            </div>
              <Link
                to="/profile"
                className="text-sm text-gray-200 hover:text-white font-medium transition-colors"
              >
                Edit Profile
              </Link>
          </div>

          {/* Travel preferences */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-white/20">
            {user?.travelStyle && (
              <div>
                <p className="text-xs text-gray-300 mb-1">Travel Style</p>
                <p className="text-sm font-medium text-white">
                  {user.travelStyle}
                </p>
              </div>
            )}
            {user?.budgetRange && (
              <div>
                <p className="text-xs text-gray-300 mb-1">Budget Range</p>
                <p className="text-sm font-medium text-white">
                  {user.budgetRange}
                </p>
              </div>
            )}
            {user?.interests && (
              <div>
                <p className="text-xs text-gray-300 mb-1">Interests</p>
                <p className="text-sm font-medium text-white">
                  {user.interests}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Location Review and Photo Upload Cards */}
          <div className="grid gap-6 lg:grid-cols-2 mb-8">
            {/* Location Review Card */}
            <div className="glass-card rounded-xl shadow-sm p-8">
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
              <h3 className="text-xl font-bold text-white mb-2">
                Have you been to{" "}
                <span className="underline decoration-2 decoration-white">
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
                          reviewRating >= star ? "text-yellow-200" : "text-gray-300"
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
                  className="w-full px-4 py-3 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white resize-none mb-4 text-white placeholder-gray-300"
                  rows={4}
                />
              {reviewMessage && (
                <div
                    className={`mb-3 rounded-lg px-3 py-2 text-sm ${
                      reviewMessage.type === "success"
                        ? "glass-strong text-black"
                        : "glass-dark text-white"
                    }`}
                >
                  {reviewMessage.text}
                </div>
              )}
              <button
                  type="submit"
                  disabled={isSubmittingReview}
                  className="w-full glass-button-dark font-semibold py-3 px-4 rounded-lg transition-all mb-3 flex items-center justify-center gap-2 disabled:opacity-60 text-white"
                >
                <span>✍️</span>
                {isSubmittingReview ? "Submitting..." : "Submit Review"}
              </button>
              <button
                type="button"
                  onClick={handleShowAnotherLocation}
                  disabled={isSubmittingReview}
                  className="w-full glass-button text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                >
                <span>🔄</span>
                Show another
              </button>
            </form>
          </div>

            {/* Upload Trail Photos Card */}
            <div className="glass-card rounded-xl shadow-sm p-8">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-20 h-20 mb-4 flex items-center justify-center">
                <span className="text-6xl">📸</span>
              </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Share your{" "}
                  <span className="underline decoration-2 decoration-white">
                    Trail Photos
                  </span>
                </h3>
                <p className="text-sm text-gray-200">
                  Upload photos from your hikes, treks, and adventures
                </p>
            </div>
            
            {/* Upload Area */}
            <div className="mb-4">
              <label
                htmlFor="photo-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/30 rounded-lg cursor-pointer hover:border-white/50 hover:bg-white/5 transition-all glass"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg
                    className="w-10 h-10 mb-2 text-gray-300"
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
                  <p className="text-sm text-gray-200 font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-300 mt-1">
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
                  <p className="mt-2 text-xs text-gray-300 text-center">
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
                className="w-full px-4 py-3 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white resize-none mb-4 text-white placeholder-gray-300"
                rows={3}
              />

            {photoMessage && (
              <div
                className={`mb-3 rounded-lg px-3 py-2 text-sm ${
                  photoMessage.type === "success"
                    ? "glass-strong text-black"
                    : "glass-dark text-white"
                }`}
              >
                {photoMessage.text}
              </div>
            )}

            <button
              type="button"
              onClick={handlePhotoSubmit}
              disabled={isUploadingPhoto}
              className="w-full glass-button-dark font-semibold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60 text-white"
            >
              <span>📤</span>
              {isUploadingPhoto ? "Uploading..." : "Upload Photos"}
            </button>
          </div>
        </div>

        {/* Create Hike Card */}
        <div className="glass-card rounded-xl shadow-sm p-6 mb-8 flex items-center justify-between">
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
                <h3 className="text-lg font-bold text-white mb-1">
                  Create Hike
                </h3>
                <p className="text-sm text-gray-200">
                  Organize and join group hiking events
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateHikeModalOpen(true)}
              className="glass-button-dark font-semibold py-2.5 px-6 rounded-full transition-all shadow-md text-white"
            >
            Create Hike
          </button>
        </div>

        {/* Photo feed */}
        {(isLoadingPhotos || (Array.isArray(photos) && photos.length > 0) || photosError) && (
          <section className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white">
                  Latest trail photos
                </h2>
                <p className="text-xs text-gray-200">
                  Shared by the Travel Buddy community
                </p>
              </div>

            {photosError && (
              <div className="mb-4 rounded-md glass-dark px-3 py-2 text-xs text-red-200">
                {photosError}
              </div>
            )}

            {isLoadingPhotos && (!Array.isArray(photos) || photos.length === 0) ? (
              <p className="text-sm text-gray-200">Loading photos…</p>
            ) : !Array.isArray(photos) || photos.length === 0 ? (
              <p className="text-sm text-gray-200">
                No photos have been shared yet. Be the first to upload one!
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {Array.isArray(photos) && photos.map((photo) => {
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
                        className="glass-card rounded-xl shadow-sm overflow-hidden flex flex-col relative"
                      >
                      {photo.userName === safeUserName && (
                        <button
                          type="button"
                            onClick={() => handleDeletePhoto(photo._id)}
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
                        <div className="flex items-center justify-between text-xs text-gray-200 mb-1">
                          <span className="font-medium text-white">
                            {photo.userName}
                          </span>
                          {photo.createdAt && (
                            <span>
                              {new Date(photo.createdAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {photo.caption && (
                          <p className="text-sm text-gray-200 mt-1 line-clamp-3">
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
        <footer className="glass-nav mt-12">
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

        {/* Create Hike Modal */}
        {isCreateHikeModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="glass-card rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 glass-nav px-8 py-6 flex items-center justify-between rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg glass-button-dark flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Create Hike</h2>
                    <p className="text-sm text-gray-200">
                      Organize and join group hiking events
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateHikeModalOpen(false);
                    setHikeMessage(null);
                    setIsDescriptionExpanded(true);
                    setIsHikeDetailsExpanded(false);
                  }}
                  className="px-4 py-2 text-gray-200 hover:text-white glass-button rounded-lg font-medium transition-colors"
                >
                  Hide
                </button>
              </div>

            <form onSubmit={handleCreateHike} className="p-8">
              {hikeMessage && (
                <div
                  className={`mb-6 rounded-lg px-4 py-3 text-sm ${
                    hikeMessage.type === "success"
                      ? "glass-strong text-black"
                      : "glass-dark text-white"
                  }`}
                >
                  {hikeMessage.text}
                </div>
              )}

              {/* Description Section */}
              <div className="mb-6 glass-card rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() =>
                    setIsDescriptionExpanded(!isDescriptionExpanded)
                  }
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-white" />
                    <span className="font-semibold text-white">Description</span>
                  </div>
                  <span className="text-gray-300">
                    {isDescriptionExpanded ? "▲" : "▼"}
                  </span>
                </button>

                {isDescriptionExpanded && (
                  <div className="px-6 pb-6 space-y-4 border-t border-white/20">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Hike Title <span className="text-white">*</span>
                      </label>
                      <input
                        type="text"
                        value={hikeTitle}
                        onChange={(e) => setHikeTitle(e.target.value)}
                        placeholder="Give your hike a catchy title."
                        className="w-full px-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-300"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Description
                      </label>
                      <textarea
                        value={hikeDescription}
                        onChange={(e) => setHikeDescription(e.target.value)}
                        placeholder="Describe the hike, its route, start time and location, what to bring."
                        rows={5}
                        className="w-full px-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white resize-y text-white placeholder-gray-300"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-3">
                        Difficulty <span className="text-white">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={hikeDifficulty}
                          onChange={(e) =>
                            setHikeDifficulty(Number(e.target.value))
                          }
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                          style={{
                            background: `linear-gradient(to right, #000 0%, #000 ${
                              ((hikeDifficulty - 1) / 4) * 100
                            }%, #e5e7eb ${
                              ((hikeDifficulty - 1) / 4) * 100
                            }%, #e5e7eb 100%)`,
                          }}
                        />
                        <div className="flex justify-between mt-2">
                          {[1, 2, 3, 4, 5].map((num) => (
                            <button
                              key={num}
                              type="button"
                              onClick={() => setHikeDifficulty(num)}
                              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-medium transition-all ${
                                hikeDifficulty === num
                                  ? "glass-button-dark border-white text-white scale-110"
                                  : "glass border-white/30 text-white hover:border-white/50"
                              }`}
                            >
                              {num}
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 text-right">
                          <span className="inline-block px-3 py-1 glass-strong text-black text-sm font-medium rounded-full">
                            {difficultyLabels[hikeDifficulty - 1]}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Hike Details Section */}
              <div className="mb-6 glass-card rounded-xl overflow-hidden">
                <button
                  type="button"
                  onClick={() => setIsHikeDetailsExpanded(!isHikeDetailsExpanded)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-white" />
                    <span className="font-semibold text-white">Hike Details</span>
                  </div>
                  <span className="text-gray-300">
                    {isHikeDetailsExpanded ? "▲" : "▼"}
                  </span>
                </button>

                {isHikeDetailsExpanded && (
                  <div className="px-6 pb-6 space-y-4 border-t border-white/20">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Location <span className="text-white">*</span>
                      </label>
                      <input
                        type="text"
                        value={hikeLocation}
                        onChange={(e) => setHikeLocation(e.target.value)}
                        placeholder="e.g., Nagarkot View Tower, Kathmandu Valley"
                        className="w-full px-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-300"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Date <span className="text-white">*</span>
                        </label>
                        <input
                          type="date"
                          value={hikeDate}
                          onChange={(e) => setHikeDate(e.target.value)}
                          min={new Date().toISOString().split("T")[0]}
                          className="w-full px-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Spots Available
                        </label>
                        <input
                          type="number"
                          value={hikeSpotsLeft}
                          onChange={(e) =>
                            setHikeSpotsLeft(Number(e.target.value))
                          }
                          min="0"
                          className="w-full px-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Upload Photo (optional)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleHikeImageChange}
                        className="w-full px-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:glass-button-dark file:text-white hover:file:opacity-80 file:cursor-pointer"
                      />


                      {hikeImagePreview && (
                        <div className="mt-3">
                          <p className="text-xs text-gray-300 mb-2">Preview:</p>
                          <div className="relative w-full h-48 rounded-lg overflow-hidden glass border border-white/20">
                            <img
                              src={hikeImagePreview}
                              alt="Hike preview"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isCreatingHike}
                  className="px-8 py-3 glass-button-dark rounded-full font-semibold disabled:opacity-60 transition-colors shadow-lg text-white"
                >
                  {isCreatingHike ? "Creating..." : "Create Hike"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepage;

