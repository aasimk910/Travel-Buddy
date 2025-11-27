// src/pages/Homepage.tsx
import React from "react";
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

const Homepage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
          <p className="text-gray-600 mb-1">
            Welcome to the mountain lovers community!
          </p>
          <p className="text-sm text-blue-600 hover:text-blue-800 cursor-pointer">
            Explore exciting routes, upload GPS tracks, join hikes, or organize your own
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
                  Chamlang Central
                </span>
                ?
              </h3>
              <div className="flex gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    className="text-2xl text-gray-300 hover:text-yellow-400 transition-colors"
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
            <textarea
              placeholder="Write your review or a comment here..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none mb-4"
              rows={4}
            />
            <button className="w-full bg-gradient-to-r from-pink-100 to-purple-100 text-gray-900 font-semibold py-3 px-4 rounded-lg hover:from-pink-200 hover:to-purple-200 transition-all mb-3 flex items-center justify-center gap-2">
              <span>✍️</span>
              Submit Review
            </button>
            <button className="w-full bg-gradient-to-r from-yellow-100 to-orange-100 text-gray-900 font-medium py-3 px-4 rounded-lg hover:from-yellow-200 hover:to-orange-200 transition-all flex items-center justify-center gap-2">
              <span>🔄</span>
              Show another
            </button>
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
                />
              </label>
            </div>

            <textarea
              placeholder="Add a caption or description..."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none mb-4"
              rows={3}
            />
            
            <button className="w-full bg-gradient-to-r from-blue-100 to-indigo-100 text-gray-900 font-semibold py-3 px-4 rounded-lg hover:from-blue-200 hover:to-indigo-200 transition-all mb-3 flex items-center justify-center gap-2">
              <span>📤</span>
              Upload Photos
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

        {/* Quick actions */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Link
            to="/hikes"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
              <Compass className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Explore Hikes
            </h3>
            <p className="text-xs text-gray-600">
              Find group hikes near your favorite destinations
            </p>
          </Link>

          <Link
            to="/dashboard"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Find Buddies
            </h3>
            <p className="text-xs text-gray-600">
              Connect with travelers who share your style
            </p>
          </Link>

          <Link
            to="/dashboard"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              Plan Trip
            </h3>
            <p className="text-xs text-gray-600">
              Create a new trip and invite others to join
            </p>
          </Link>

          <Link
            to="/dashboard"
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">
              My Trips
            </h3>
            <p className="text-xs text-gray-600">
              View and manage your upcoming adventures
            </p>
          </Link>
        </div>

        {/* Suggested hikes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Suggested Hikes for You
              </h2>
              <p className="text-sm text-gray-600">
                Based on your travel style and interests
              </p>
            </div>
            <Link
              to="/hikes"
              className="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              View all →
            </Link>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-32 bg-[url('https://images.pexels.com/photos/417074/pexels-photo-417074.jpeg?auto=compress&cs=tinysrgb&w=800')] bg-cover bg-center" />
              <div className="p-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 mb-2">
                  <TrendingUp className="w-3 h-3" />
                  Trending
                </span>
                <p className="text-xs text-gray-400 mb-1">
                  Banff National Park • Canada
                </p>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Hot Springs Sunrise Hike
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  Easy pace, perfect for first-time group hikers.
                </p>
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>Difficulty: 1/5</span>
                  <span className="text-emerald-600 font-medium">
                    3 spots left
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-32 bg-[url('https://images.pexels.com/photos/552785/pexels-photo-552785.jpeg?auto=compress&cs=tinysrgb&w=800')] bg-cover bg-center" />
              <div className="p-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 mb-2">
                  New
                </span>
                <p className="text-xs text-gray-400 mb-1">
                  Dolomites • Italy
                </p>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  Through the Heart of the Peaks
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  Full-day route with big views and shared snacks.
                </p>
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>Difficulty: 4/5</span>
                  <span className="text-emerald-600 font-medium">
                    6 spots left
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="h-32 bg-[url('https://images.pexels.com/photos/1028225/pexels-photo-1028225.jpeg?auto=compress&cs=tinysrgb&w=800')] bg-cover bg-center" />
              <div className="p-4">
                <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 mb-2">
                  Popular
                </span>
                <p className="text-xs text-gray-400 mb-1">
                  Lisbon • Portugal
                </p>
                <h3 className="text-sm font-semibold text-gray-900 mb-1">
                  City View Sunset Walk
                </h3>
                <p className="text-xs text-gray-600 mb-3">
                  Short evening walk ending at a lookout with snacks.
                </p>
                <div className="flex items-center justify-between text-[11px] text-gray-500">
                  <span>Difficulty: 2/5</span>
                  <span className="text-emerald-600 font-medium">
                    4 spots left
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Travel Tips */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-700 rounded-xl p-6 text-white">
          <h2 className="text-xl font-semibold mb-2">
            Travel Tip of the Day 💡
          </h2>
          <p className="text-sm text-gray-200 mb-4">
            Always meet your travel buddies in a public place before committing
            to a trip together. It's a great way to ensure compatibility and
            build trust!
          </p>
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm font-medium text-white hover:text-gray-200"
          >
            Read more tips →
          </Link>
        </div>
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

