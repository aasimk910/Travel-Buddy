// src/pages/Profile.tsx
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Map, User, ArrowLeft, Camera, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import DOMPurify from "dompurify";
import { compressImage } from "../utils/imageCompression";
import { API_BASE_URL } from "../config/env";
import { getUserPhotos } from "../services/photos";

const MAX_PHOTO_SIZE_BYTES = 6 * 1024 * 1024; // 6MB

type PhotoItem = {
  _id: string;
  userName: string;
  caption?: string;
  images?: string[];
  imageData?: string;
  createdAt?: string;
};

const convertFileToBase64 = (file: File): Promise<string> =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { user, loginWithProfile } = useAuth();
  const { showSuccess, showError } = useToast();

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
    } catch (err) {
      console.error("Error fetching user photos:", err);
      showError("Unable to load your photos.");
    } finally {
      setIsLoadingPhotos(false);
    }
  }, [user?.name, showError]);

  useEffect(() => {
    fetchUserPhotos();
  }, [fetchUserPhotos]);

  const handleProfilePictureChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) {
      setProfilePicture(null);
      return;
    }

    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      showError(`Image size must be less than ${MAX_PHOTO_SIZE_BYTES / (1024 * 1024)}MB.`);
      return;
    }

    if (!file.type.startsWith("image/")) {
      showError("Please select an image file.");
      return;
    }

    try {
      // Compress the image
      const compressedFile = await compressImage(file);
      setProfilePicture(compressedFile);
      const preview = await convertFileToBase64(compressedFile);
      setProfilePicturePreview(preview);
    } catch (err) {
      console.error("Failed to process image", err);
      showError("Failed to process image. Please try again.");
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError("Please fix the errors in the form");
      return;
    }

    // Confirmation dialog
    if (!window.confirm("Are you sure you want to update your profile?")) {
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem("travelBuddyToken");
      if (!token) {
        showError("You must be logged in to update your profile");
        navigate("/login");
        return;
      }

      // Convert profile picture to base64 if present
      let avatarUrl = user?.avatarUrl || undefined;
      if (profilePicture) {
        avatarUrl = await convertFileToBase64(profilePicture);
      }

      const res = await fetch(`${API_BASE_URL}/api/users/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
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

      if (!res.ok) {
        throw new Error(data.message || "Unable to update profile");
      }

      // Update auth context with new user data
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
      setProfilePicture(null); // Clear file input after successful upload
    } catch (err) {
      console.error("Profile update error:", err);
      showError(
        err instanceof Error
          ? err.message
          : "Unable to update profile. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
          <p className="text-gray-200">
            Update your travel preferences and personal information
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Profile Picture & Info */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-xl shadow-sm p-6 sticky top-24">
              <div className="flex flex-col items-center">
                <div className="relative mb-4">
                  <div className="w-32 h-32 rounded-full glass-button-dark text-white flex items-center justify-center text-3xl font-semibold overflow-hidden border-4 border-white/30">
                    {profilePicturePreview ? (
                      <img
                        src={profilePicturePreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{user?.name?.[0]?.toUpperCase() || "U"}</span>
                    )}
                  </div>
                  <label
                    htmlFor="profile-picture"
                    className="absolute bottom-0 right-0 glass-button-dark text-white p-2 rounded-full cursor-pointer transition-colors"
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
                <h2 className="text-xl font-semibold text-white mb-1">
                  {user?.name || "User"}
                </h2>
                <p className="text-sm text-gray-200 mb-4">{user?.email}</p>
                {user?.country && (
                  <p className="text-xs text-gray-300">📍 {user.country}</p>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6 glass-card rounded-xl shadow-sm p-6">
              {/* Name */}
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Full Name <span className="text-white">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${
                    errors.name ? "border-red-300" : ""
                  } glass-input text-white placeholder-gray-300`}
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-300">{errors.name}</p>
                )}
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Email Address <span className="text-white">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black ${
                    errors.email ? "border-red-300" : ""
                  } glass-input text-white placeholder-gray-300`}
                  required
                />
                {errors.email && (
                  <p className="mt-1 text-xs text-red-300">{errors.email}</p>
                )}
              </div>

              {/* Country */}
              <div>
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Country
                </label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="e.g., Nepal"
                  className="w-full px-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-300"
                />
              </div>

              {/* Travel Style */}
              <div>
                <label
                  htmlFor="travelStyle"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Travel Style
                </label>
                <select
                  id="travelStyle"
                  name="travelStyle"
                  value={formData.travelStyle}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-300 [color-scheme:dark]"
                >
                  <option value="" className="bg-gray-900 text-white">Select a style</option>
                  <option value="budget" className="bg-gray-900 text-white">Budget backpacker</option>
                  <option value="mid-range" className="bg-gray-900 text-white">Mid-range traveler</option>
                  <option value="luxury" className="bg-gray-900 text-white">Luxury traveler</option>
                  <option value="slow" className="bg-gray-900 text-white">Slow traveler</option>
                  <option value="adventure" className="bg-gray-900 text-white">Adventure seeker</option>
                  <option value="cultural" className="bg-gray-900 text-white">Cultural explorer</option>
                </select>
              </div>

              {/* Budget Range */}
              <div>
                <label
                  htmlFor="budgetRange"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Budget Range
                </label>
                <select
                  id="budgetRange"
                  name="budgetRange"
                  value={formData.budgetRange}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white text-white placeholder-gray-300 [color-scheme:dark]"
                >
                  <option value="" className="bg-gray-900 text-white">Select budget range</option>
                  <option value="budget" className="bg-gray-900 text-white">Budget (NPR 2,000–5,000/day)</option>
                  <option value="mid-range" className="bg-gray-900 text-white">Mid-range (NPR 5,000–10,000/day)</option>
                  <option value="comfortable" className="bg-gray-900 text-white">Comfortable (NPR 10,000–20,000/day)</option>
                  <option value="luxury" className="bg-gray-900 text-white">Luxury (NPR 20,000+/day)</option>
                </select>
              </div>

              {/* Interests */}
              <div>
                <label
                  htmlFor="interests"
                  className="block text-sm font-medium text-white mb-2"
                >
                  Interests
                </label>
                <textarea
                  id="interests"
                  name="interests"
                  value={formData.interests}
                  onChange={handleChange}
                  placeholder="e.g., Hiking, Photography, Local Food, History"
                  rows={4}
                  className="w-full px-4 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white resize-none text-white placeholder-gray-300"
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <Link
                  to="/homepage"
                  className="flex-1 px-6 py-3 glass-button rounded-lg text-white font-semibold transition-colors text-center"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 px-6 py-3 glass-button-dark rounded-lg font-semibold disabled:opacity-60 transition-colors text-white"
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>

            {/* User's Trail Photos */}
            <div className="mt-8 glass-card rounded-xl shadow-sm p-6">
              <h3 className="text-xl font-semibold text-white mb-4">
                My Trail Photos
              </h3>
              {isLoadingPhotos ? (
                <p className="text-gray-200 text-center py-8">Loading photos...</p>
              ) : userPhotos.length === 0 ? (
                <p className="text-gray-200 text-center py-8">
                  You haven't uploaded any trail photos yet.
                </p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
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
                        className="relative aspect-square rounded-lg overflow-hidden glass border border-white/20 group"
                      >
                        {firstImage ? (
                          <img
                            src={firstImage}
                            alt={photo.caption || "Trail photo"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                            <Camera className="w-8 h-8 text-gray-300" />
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
