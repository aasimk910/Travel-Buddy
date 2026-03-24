// src/pages/Profile.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Camera, MapPin, Globe, DollarSign, CalendarDays, Tag } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import DOMPurify from "dompurify";
import { compressImage } from "../utils/imageCompression";
import { API_BASE_URL } from "../config/env";
import { getUserPhotos } from "../services/photos";
import { getUserTrips } from "../services/trips";

const MAX_PHOTO_SIZE_BYTES = 6 * 1024 * 1024;

type PhotoItem = {
  _id: string;
  userName: string;
  caption?: string;
  images?: string[];
  imageData?: string;
  createdAt?: string;
};

type Trip = {
  _id: string;
  title: string;
  location: string;
  date: string;
};

type Tab = "edit" | "trips" | "photos";

const convertFileToBase64 = (file: File): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

const getTripStatus = (dateString: string): "Upcoming" | "Ongoing" | "Completed" => {
  const d = new Date(dateString);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  if (d > today) return "Upcoming";
  if (d.getTime() === today.getTime()) return "Ongoing";
  return "Completed";
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, loginWithProfile } = useAuth();
  const { showSuccess, showError } = useToast();

  const [activeTab, setActiveTab] = useState<Tab>("edit");
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    country: user?.country || "",
    travelStyle: user?.travelStyle || "",
    budgetRange: user?.budgetRange || "",
    interests: user?.interests || "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string>(
    user?.avatarUrl || ""
  );
  const [userPhotos, setUserPhotos] = useState<PhotoItem[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoadingTrips, setIsLoadingTrips] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        country: user.country || "",
        travelStyle: user.travelStyle || "",
        budgetRange: user.budgetRange || "",
        interests: user.interests || "",
      });
      setProfilePicturePreview(user.avatarUrl || "");
    }
  }, [user]);

  const fetchUserPhotos = useCallback(async () => {
    if (!user?.name) return;
    setIsLoadingPhotos(true);
    try {
      const data = await getUserPhotos(user.name);
      setUserPhotos(data);
    } catch {
      showError("Unable to load your photos.");
    } finally {
      setIsLoadingPhotos(false);
    }
  }, [user?.name, showError]);

  const fetchUserTrips = useCallback(async () => {
    setIsLoadingTrips(true);
    try {
      const data = await getUserTrips();
      setTrips(data);
    } catch {
      showError("Unable to load your trips.");
    } finally {
      setIsLoadingTrips(false);
    }
  }, [showError]);

  useEffect(() => {
    fetchUserPhotos();
    fetchUserTrips();
  }, [fetchUserPhotos, fetchUserTrips]);

  const handleProfilePictureChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) { setProfilePicture(null); return; }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      showError(`Image size must be less than ${MAX_PHOTO_SIZE_BYTES / (1024 * 1024)}MB.`);
      return;
    }
    if (!file.type.startsWith("image/")) {
      showError("Please select an image file.");
      return;
    }
    try {
      const compressedFile = await compressImage(file);
      setProfilePicture(compressedFile);
      setProfilePicturePreview(await convertFileToBase64(compressedFile));
    } catch {
      showError("Failed to process image. Please try again.");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = "Please enter a valid email address";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) { showError("Please fix the errors in the form"); return; }
    if (!window.confirm("Are you sure you want to update your profile?")) return;
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("travelBuddyToken");
      if (!token) { showError("You must be logged in to update your profile"); navigate("/login"); return; }
      let avatarUrl = user?.avatarUrl || undefined;
      if (profilePicture) avatarUrl = await convertFileToBase64(profilePicture);

      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: DOMPurify.sanitize(formData.name.trim()),
          email: formData.email.trim(),
          country: formData.country.trim() || undefined,
          travelStyle: formData.travelStyle.trim() || undefined,
          budgetRange: formData.budgetRange.trim() || undefined,
          interests: formData.interests.trim()
            ? DOMPurify.sanitize(formData.interests.trim())
            : undefined,
          avatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to update profile");

      if (data.user) {
        loginWithProfile({
          name: data.user.name,
          email: data.user.email,
          country: data.user.country,
          travelStyle: data.user.travelStyle,
          budgetRange: data.user.budgetRange,
          interests: data.user.interests,
          avatarUrl: data.user.avatarUrl,
          provider: data.user.provider || user?.provider || "password",
          role: data.user.role || user?.role || "user",
        });
      }
      showSuccess("Profile updated successfully!");
      setProfilePicture(null);
    } catch (err) {
      showError(err instanceof Error ? err.message : "Unable to update profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const upcomingCount = trips.filter((t) => getTripStatus(t.date) === "Upcoming").length;
  const completedCount = trips.filter((t) => getTripStatus(t.date) === "Completed").length;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-8">
      <div className="max-w-4xl mx-auto">

        {/* ── Hero Card ── */}
        <div className="glass-card rounded-xl shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">

            {/* Avatar with upload */}
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 rounded-full glass-button-dark text-white flex items-center justify-center text-3xl font-semibold overflow-hidden border-4 border-white/30">
                {profilePicturePreview ? (
                  <img src={profilePicturePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.name?.[0]?.toUpperCase() || "U"}</span>
                )}
              </div>
              <label
                htmlFor="profile-picture"
                className="absolute bottom-0 right-0 glass-button-dark text-white p-2 rounded-full cursor-pointer"
              >
                <Camera className="w-4 h-4" />
              </label>
              <input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="hidden"
              />
            </div>

            {/* Name / email / tags */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mb-1">
                <h1 className="text-2xl font-bold text-white">{user?.name || "User"}</h1>
                {user?.role === "admin" && (
                  <span className="text-xs font-bold px-2 py-0.5 bg-yellow-500/40 text-yellow-200 rounded-full border border-yellow-400/30">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-200 mb-3">{user?.email}</p>
              <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                {user?.country && (
                  <span className="flex items-center gap-1 text-xs text-gray-300">
                    <MapPin className="w-3 h-3" />{user.country}
                  </span>
                )}
                {user?.travelStyle && (
                  <span className="flex items-center gap-1 text-xs text-gray-300">
                    <Globe className="w-3 h-3" />{user.travelStyle}
                  </span>
                )}
                {user?.budgetRange && (
                  <span className="flex items-center gap-1 text-xs text-gray-300">
                    <DollarSign className="w-3 h-3" />{user.budgetRange}
                  </span>
                )}
              </div>
              {user?.interests && (
                <p className="mt-2 text-xs text-gray-300 flex items-center gap-1"><Tag className="w-3 h-3" /> {user.interests}</p>
              )}
            </div>

            {/* Stats */}
            <div className="flex sm:flex-col gap-3 text-center flex-shrink-0">
              <div className="glass-button rounded-lg px-5 py-2.5">
                <p className="text-2xl font-bold text-white">{trips.length}</p>
                <p className="text-xs text-gray-300">Trips</p>
              </div>
              <div className="glass-button rounded-lg px-5 py-2.5">
                <p className="text-2xl font-bold text-white">{userPhotos.length}</p>
                <p className="text-xs text-gray-300">Photos</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="flex gap-1 glass-card rounded-xl p-1.5 mb-6">
          {(["edit", "trips", "photos"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "glass-button-dark text-white"
                  : "text-gray-300 hover:text-white"
              }`}
            >
              {tab === "edit"
                ? "Edit Profile"
                : tab === "trips"
                ? `My Trips${trips.length ? ` (${trips.length})` : ""}`
                : `Photos${userPhotos.length ? ` (${userPhotos.length})` : ""}`}
            </button>
          ))}
        </div>

        {/* ── Edit Profile Tab ── */}
        {activeTab === "edit" && (
          <form onSubmit={handleSubmit} className="glass-card rounded-xl shadow-sm p-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white mb-1.5">
                  Full Name <span className="text-red-300">*</span>
                </label>
                <input
                  type="text" id="name" name="name" value={formData.name} onChange={handleChange} required
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 glass-input text-white placeholder-gray-400 ${errors.name ? "border-red-400" : ""}`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-300">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-1.5">
                  Email Address <span className="text-red-300">*</span>
                </label>
                <input
                  type="email" id="email" name="email" value={formData.email} onChange={handleChange} required
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 glass-input text-white placeholder-gray-400 ${errors.email ? "border-red-400" : ""}`}
                />
                {errors.email && <p className="mt-1 text-xs text-red-300">{errors.email}</p>}
              </div>

              {/* Country */}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-white mb-1.5">Country</label>
                <input
                  type="text" id="country" name="country" value={formData.country} onChange={handleChange}
                  placeholder="e.g., Nepal"
                  className="w-full px-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 text-white placeholder-gray-400"
                />
              </div>

              {/* Travel Style */}
              <div>
                <label htmlFor="travelStyle" className="block text-sm font-medium text-white mb-1.5">Travel Style</label>
                <select
                  id="travelStyle" name="travelStyle" value={formData.travelStyle} onChange={handleChange}
                  className="w-full px-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 text-white [color-scheme:dark]"
                >
                  <option value="">Select a style</option>
                  <option value="budget">Budget backpacker</option>
                  <option value="mid-range">Mid-range traveler</option>
                  <option value="luxury">Luxury traveler</option>
                  <option value="slow">Slow traveler</option>
                  <option value="adventure">Adventure seeker</option>
                  <option value="cultural">Cultural explorer</option>
                </select>
              </div>

              {/* Budget Range */}
              <div className="sm:col-span-2">
                <label htmlFor="budgetRange" className="block text-sm font-medium text-white mb-1.5">Budget Range</label>
                <select
                  id="budgetRange" name="budgetRange" value={formData.budgetRange} onChange={handleChange}
                  className="w-full px-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 text-white [color-scheme:dark]"
                >
                  <option value="">Select budget range</option>
                  <option value="budget">Budget (NPR 2,000–5,000/day)</option>
                  <option value="mid-range">Mid-range (NPR 5,000–10,000/day)</option>
                  <option value="comfortable">Comfortable (NPR 10,000–20,000/day)</option>
                  <option value="luxury">Luxury (NPR 20,000+/day)</option>
                </select>
              </div>

              {/* Interests */}
              <div className="sm:col-span-2">
                <label htmlFor="interests" className="block text-sm font-medium text-white mb-1.5">Interests</label>
                <textarea
                  id="interests" name="interests" value={formData.interests} onChange={handleChange}
                  placeholder="e.g., Hiking, Photography, Local Food, History" rows={3}
                  className="w-full px-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 resize-none text-white placeholder-gray-400"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button" onClick={() => navigate("/homepage")}
                className="flex-1 px-4 py-2.5 glass-button rounded-lg text-white font-medium"
              >
                Cancel
              </button>
              <button
                type="submit" disabled={isSubmitting}
                className="flex-1 px-4 py-2.5 glass-button-dark rounded-lg text-white font-semibold disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* ── My Trips Tab ── */}
        {activeTab === "trips" && (
          <div className="glass-card rounded-xl shadow-sm p-6">
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="glass-button rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-white">{trips.length}</p>
                <p className="text-xs text-gray-300 mt-1">Total</p>
              </div>
              <div className="glass-button rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-300">{upcomingCount}</p>
                <p className="text-xs text-gray-300 mt-1">Upcoming</p>
              </div>
              <div className="glass-button rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-300">{completedCount}</p>
                <p className="text-xs text-gray-300 mt-1">Completed</p>
              </div>
            </div>

            {isLoadingTrips ? (
              <p className="text-gray-200 text-center py-8">Loading trips...</p>
            ) : trips.length === 0 ? (
              <div className="text-center py-10">
                <CalendarDays className="w-10 h-10 text-white/30 mx-auto mb-3" />
                <p className="text-gray-300">You haven't joined any trips yet.</p>
                <button
                  onClick={() => navigate("/hikes")}
                  className="mt-4 glass-button-dark px-5 py-2 rounded-full text-sm text-white font-medium"
                >
                  Browse Hikes
                </button>
              </div>
            ) : (
              <ul className="space-y-3">
                {trips.map((trip) => {
                  const status = getTripStatus(trip.date);
                  return (
                    <li key={trip._id} className="glass-button rounded-lg p-4 flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{trip.title}</p>
                        <p className="text-xs text-gray-300 mt-0.5">
                          {trip.location} • {formatDate(trip.date)}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-full flex-shrink-0 ${
                          status === "Completed"
                            ? "bg-green-500/40 text-green-200"
                            : status === "Upcoming"
                            ? "bg-yellow-500/40 text-yellow-200"
                            : "bg-blue-500/40 text-blue-200"
                        }`}
                      >
                        {status}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        {/* ── Photos Tab ── */}
        {activeTab === "photos" && (
          <div className="glass-card rounded-xl shadow-sm p-6">
            {isLoadingPhotos ? (
              <p className="text-gray-200 text-center py-8">Loading photos...</p>
            ) : userPhotos.length === 0 ? (
              <div className="text-center py-10">
                <Camera className="w-10 h-10 text-white/30 mx-auto mb-3" />
                <p className="text-gray-300">You haven't uploaded any trail photos yet.</p>
                <button
                  onClick={() => navigate("/homepage")}
                  className="mt-4 glass-button-dark px-5 py-2 rounded-full text-sm text-white font-medium"
                >
                  Go to Homepage
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {userPhotos.map((photo) => {
                  const imageList =
                    photo.images && photo.images.length > 0
                      ? photo.images
                      : photo.imageData
                      ? [photo.imageData]
                      : [];
                  const firstImage = imageList[0];
                  return (
                    <div
                      key={photo._id}
                      className="relative aspect-square rounded-lg overflow-hidden glass border border-white/20"
                    >
                      {firstImage ? (
                        <img
                          src={firstImage}
                          alt={photo.caption || "Trail photo"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full glass-dark flex items-center justify-center">
                          <Camera className="w-8 h-8 text-white/30" />
                        </div>
                      )}
                      {imageList.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                          {imageList.length}
                        </div>
                      )}
                      {photo.caption && (
                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-2 line-clamp-2">
                          {photo.caption}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default Profile;
