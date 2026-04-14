// src/pages/Profile.tsx
// #region Imports
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
import { getToken } from "../services/auth";

// #endregion Imports

// #region Constants
const MAX_PHOTO_SIZE_BYTES = 6 * 1024 * 1024;
// #endregion Constants

// #region Types
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
// #endregion Types

// #region Helpers
const convertFileToBase64 = (file: File): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

// Handles formatDate logic.
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
// #endregion Helpers

// #region Component
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

  // Handles handleSubmit logic.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) { showError("Please fix the errors in the form"); return; }
    if (!window.confirm("Are you sure you want to update your profile?")) return;
    setIsSubmitting(true);
    try {
      const token = getToken();
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
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          country: data.user.country,
          travelStyle: data.user.travelStyle,
          budgetRange: data.user.budgetRange,
          interests: data.user.interests,
          avatarUrl: data.user.avatarUrl,
          provider: data.user.provider || user?.provider || "password",
          role: data.user.role || user?.role || "user",
          onboardingCompleted: data.user.onboardingCompleted,
          hikingProfile: data.user.hikingProfile,
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

  const initials = user?.name?.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase() || "U";

  return (
    <div className="w-full">

      {/* ══ CINEMATIC HERO ══════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/1366909/pexels-photo-1366909.jpeg?auto=compress&cs=tinysrgb&w=1400')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F0C]/55 via-[#0B0F0C]/72 to-[#0B0F0C]" />
        <div className="relative px-4 sm:px-6 lg:px-12 xl:px-16 pt-12 pb-10">
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center sm:items-end gap-6">

            {/* Avatar */}
            <div className="relative shrink-0">
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-[#C6A16E]/50 bg-[#1E2820] flex items-center justify-center text-3xl font-bold text-[#C6A16E] shadow-2xl">
                {profilePicturePreview ? (
                  <img src={profilePicturePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="font-heading">{initials}</span>
                )}
              </div>
              <label htmlFor="profile-picture"
                className="absolute -bottom-1 -right-1 bg-[#C6A16E] text-[#0B0F0C] p-1.5 rounded-lg cursor-pointer shadow-lg hover:bg-[#D4AE7A] transition-colors" title="Change photo">
                <Camera className="w-3.5 h-3.5" />
              </label>
              <input id="profile-picture" type="file" accept="image/*" onChange={handleProfilePictureChange} className="hidden" />
              <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#0B0F0C]" />
            </div>

            {/* Identity */}
            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start mb-1">
                <h1 className="text-3xl sm:text-4xl font-bold text-[#F5F3EE] font-heading">{user?.name || "User"}</h1>
                {user?.role === "admin" && (
                  <span className="text-xs font-bold px-2 py-0.5 bg-[#C6A16E]/20 text-[#C6A16E] rounded-full border border-[#C6A16E]/40">Admin</span>
                )}
              </div>
              <p className="text-sm text-[#8E8A81] mb-4">{user?.email}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                {user?.country && (
                  <span className="inline-flex items-center gap-1.5 bg-[#161D19]/80 border border-white/10 rounded-full px-3 py-1 text-xs text-[#B8B4AA]">
                    <MapPin className="w-3 h-3 text-[#C6A16E]" />{user.country}
                  </span>
                )}
                {user?.travelStyle && (
                  <span className="inline-flex items-center gap-1.5 bg-[#161D19]/80 border border-white/10 rounded-full px-3 py-1 text-xs text-[#B8B4AA]">
                    <Globe className="w-3 h-3 text-[#8FA68E]" />{user.travelStyle}
                  </span>
                )}
                {user?.budgetRange && (
                  <span className="inline-flex items-center gap-1.5 bg-[#161D19]/80 border border-white/10 rounded-full px-3 py-1 text-xs text-[#B8B4AA]">
                    <DollarSign className="w-3 h-3 text-[#C6A16E]" />{user.budgetRange}
                  </span>
                )}
                {user?.interests && (
                  <span className="inline-flex items-center gap-1.5 bg-[#161D19]/80 border border-white/10 rounded-full px-3 py-1 text-xs text-[#B8B4AA]">
                    <Tag className="w-3 h-3 text-[#8FA68E]" />{user.interests}
                  </span>
                )}
              </div>
            </div>

            {/* Stat tiles */}
            <div className="flex gap-3 shrink-0">
              {[
                { val: trips.length,      label: "Trips",  color: "text-[#C6A16E]" },
                { val: userPhotos.length, label: "Photos", color: "text-[#8FA68E]" },
                { val: completedCount,    label: "Done",   color: "text-[#8FA68E]" },
              ].map(({ val, label, color }) => (
                <div key={label} className="bg-[#161D19]/70 border border-white/10 rounded-xl px-4 py-3 text-center min-w-[60px]">
                  <p className={`text-2xl font-bold font-heading ${color}`}>{val}</p>
                  <p className="text-[10px] text-[#8E8A81] uppercase tracking-widest mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ══ BODY ════════════════════════════════════════════════════ */}
      <div className="px-4 sm:px-6 lg:px-12 xl:px-16 py-6">
      <div className="max-w-4xl mx-auto">

        {/* ── Tab Bar ── */}
        <div className="flex items-center gap-1 bg-[#111714] border border-white/8 rounded-xl p-1 mb-6">
          {(["edit", "trips", "photos"] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab
                  ? "bg-[#C6A16E]/[0.12] border border-[#C6A16E]/30 text-[#C6A16E]"
                  : "text-[#8E8A81] hover:text-[#F5F3EE] border border-transparent"
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
          <form onSubmit={handleSubmit} className="site-card rounded-2xl p-6 space-y-5">
            <div className="grid gap-5 sm:grid-cols-2">
              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-white mb-1.5">
                  Full Name <span className="text-red-300">*</span>
                </label>
                <input
                  type="text" id="name" name="name" value={formData.name} onChange={handleChange} required
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none site-input ${errors.name ? "border-red-700/50" : ""}`}
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
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none site-input ${errors.email ? "border-red-700/50" : ""}`}
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
                  className="w-full px-4 py-2.5 site-input rounded-lg [color-scheme:dark]"
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
                  className="w-full px-4 py-2.5 site-input rounded-lg [color-scheme:dark]"
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
                  className="w-full px-4 py-2.5 site-input rounded-lg resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button" onClick={() => navigate("/homepage")}
                className="btn-outline flex-1 px-4 py-2.5 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit" disabled={isSubmitting}
                className="btn-primary flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60"
              >
                {isSubmitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        )}

        {/* ── My Trips Tab ── */}
        {activeTab === "trips" && (
          <div>
            <div className="grid grid-cols-3 gap-3 mb-5">
              {[
                { val: trips.length,   label: "Total Trips", color: "text-[#C6A16E]" },
                { val: upcomingCount,  label: "Upcoming",    color: "text-[#C6A16E]" },
                { val: completedCount, label: "Completed",   color: "text-[#8FA68E]" },
              ].map(({ val, label, color }) => (
                <div key={label} className="site-card rounded-xl p-4 text-center">
                  <p className={`text-3xl font-bold font-heading ${color}`}>{val}</p>
                  <p className="text-xs text-[#8E8A81] mt-1 uppercase tracking-widest">{label}</p>
                </div>
              ))}
            </div>
            {isLoadingTrips ? (
              <div className="flex items-center justify-center gap-3 py-12 text-[#B8B4AA]">
                <div className="w-4 h-4 rounded-full border-2 border-[#C6A16E] border-t-transparent animate-spin" />
                <span className="text-sm">Loading trips…</span>
              </div>
            ) : trips.length === 0 ? (
              <div className="site-card rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#C6A16E]/10 border border-[#C6A16E]/20 flex items-center justify-center mx-auto mb-4">
                  <CalendarDays className="w-8 h-8 text-[#C6A16E]" />
                </div>
                <p className="text-[#F5F3EE] font-medium mb-1 font-heading">No trips yet</p>
                <p className="text-[#8E8A81] text-sm mb-4">Join a hike to start your adventure.</p>
                <button onClick={() => navigate("/hikes")} className="btn-primary px-5 py-2 rounded-md text-sm font-semibold">Browse Hikes</button>
              </div>
            ) : (
              <div className="space-y-3">
                {trips.map((trip) => {
                  const status = getTripStatus(trip.date);
                  const sStyle = { Upcoming: "bg-[#C6A16E]/10 border-[#C6A16E]/25 text-[#C6A16E]", Ongoing: "bg-[#8FA68E]/10 border-[#8FA68E]/25 text-[#8FA68E]", Completed: "bg-white/5 border-white/10 text-[#8E8A81]" }[status];
                  return (
                    <div key={trip._id} className="site-card rounded-xl p-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-[#C6A16E]/10 border border-[#C6A16E]/20 flex items-center justify-center shrink-0">
                          <CalendarDays className="w-5 h-5 text-[#C6A16E]" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-[#F5F3EE] truncate text-sm">{trip.title}</p>
                          <p className="text-xs text-[#8E8A81] mt-0.5">{trip.location} · {formatDate(trip.date)}</p>
                        </div>
                      </div>
                      <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${sStyle}`}>{status}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Photos Tab ── */}
        {activeTab === "photos" && (
          <div>
            {isLoadingPhotos ? (
              <div className="flex items-center justify-center gap-3 py-12 text-[#B8B4AA]">
                <div className="w-4 h-4 rounded-full border-2 border-[#C6A16E] border-t-transparent animate-spin" />
                <span className="text-sm">Loading photos…</span>
              </div>
            ) : userPhotos.length === 0 ? (
              <div className="site-card rounded-2xl p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#8FA68E]/10 border border-[#8FA68E]/20 flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-8 h-8 text-[#8FA68E]" />
                </div>
                <p className="text-[#F5F3EE] font-medium mb-1 font-heading">No photos yet</p>
                <p className="text-[#8E8A81] text-sm mb-4">Share your trail experiences with the community.</p>
                <button onClick={() => navigate("/homepage")} className="btn-primary px-5 py-2 rounded-md text-sm font-semibold">Upload Photos</button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {userPhotos.map((photo) => {
                  const imageList = photo.images?.length ? photo.images : photo.imageData ? [photo.imageData] : [];
                  const firstImage = imageList[0];
                  return (
                    <div key={photo._id} className="relative aspect-square rounded-xl overflow-hidden site-card group">
                      {firstImage ? (
                        <img src={firstImage} alt={photo.caption || "Trail photo"}
                          className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full bg-[#111714] flex items-center justify-center">
                          <Camera className="w-8 h-8 text-[#8E8A81]/30" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F0C]/65 via-transparent to-transparent pointer-events-none" />
                      {imageList.length > 1 && (
                        <div className="absolute top-2 right-2 bg-[#0B0F0C]/70 border border-white/15 text-[#B8B4AA] text-[10px] font-medium px-2 py-0.5 rounded-md">+{imageList.length - 1}</div>
                      )}
                      {photo.caption && (
                        <p className="absolute bottom-0 left-0 right-0 px-3 py-2 text-xs text-[#F5F3EE] line-clamp-1">{photo.caption}</p>
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
    </div>
  );
};

// #endregion Component

// #region Exports
export default Profile;
// #endregion Exports
