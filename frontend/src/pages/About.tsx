// src/pages/About.tsx
// About page describing the Travel Buddy platform, mission, and team.
// #region Imports
import React, { useEffect, useState } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";
import {
  Map,
  Users,
  Navigation,
  Star,
  Camera,
  MessageCircle,
  ShieldCheck,
  Ruler,
  ChevronRight,
} from "lucide-react";
import { getReviews, Review } from "../services/reviews";
import { API_BASE_URL } from "../config/env";
// #endregion Imports

// #region Types
type SiteStats = {
  hikeCount: number;
  userCount: number;
  photoCount: number;
  upcomingHikes: number;
};
// #endregion Types

// #region Sub-components
// --- Star renderer ------------------------------------------------
const Stars: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i <= rating ? "text-[#C6A16E] fill-[#C6A16E]" : "text-[#8E8A81]/30"}`}
      />
    ))}
  </div>
);

// --- Feature card -------------------------------------------------
const FeatureCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay?: string;
}> = ({ icon, title, desc, delay = "" }) => (
  <div className={`site-card rounded-xl p-6 flex flex-col gap-3 reveal reveal-up ${delay}`}>
    <div className="w-10 h-10 rounded-lg bg-[#C6A16E]/10 border border-[#C6A16E]/25 flex items-center justify-center text-[#C6A16E] flex-shrink-0">
      {icon}
    </div>
    <h3 className="font-semibold text-[#F5F3EE] font-heading">{title}</h3>
    <p className="text-sm text-[#B8B4AA] leading-relaxed">{desc}</p>
  </div>
);

// #endregion Sub-components

// #region Component
// --- Main page ----------------------------------------------------
const RATING_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

const About: React.FC = () => {
  const revealRef = useScrollReveal();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  useEffect(() => {
    Promise.all([
      getReviews(),
      fetch(`${API_BASE_URL}/api/stats`).then((r) => r.json()),
    ])
      .then(([fetchedReviews, fetchedStats]) => {
        setReviews(fetchedReviews);
        setStats(fetchedStats);
      })
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, []);

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
      : null;

  return (
    <div ref={revealRef}>
      {/* ── Cinematic hero ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/1271620/pexels-photo-1271620.jpeg?auto=compress&cs=tinysrgb&w=1400')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0B0F0C]/70 via-[#0B0F0C]/60 to-[#0B0F0C]" />
        <div className="relative px-4 sm:px-6 lg:px-12 xl:px-16 py-20 lg:py-28 text-center max-w-3xl mx-auto">
          <p className="inline-flex items-center gap-2 rounded-full surface-pill px-4 py-1.5 text-xs font-medium mb-5 reveal reveal-fade">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C6A16E]" />
            About Travel Buddy
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-[#F5F3EE] leading-tight reveal reveal-up delay-100 font-heading">
            Your companion for
            <span className="block bg-gradient-to-r from-[#C6A16E] via-[#E8D5B0] to-[#F5F3EE] bg-clip-text text-transparent">
              Nepal's trails
            </span>
          </h1>
          <p className="text-[#B8B4AA] text-base sm:text-lg leading-relaxed reveal reveal-fade delay-200 mt-5 max-w-2xl mx-auto">
            Travel Buddy is a community platform built for hikers and outdoor
            enthusiasts in Nepal. Discover trails, connect with fellow adventurers,
            plan trips together, and share your journey — all in one place.
          </p>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-12 space-y-16">

      {/* ── Mission ───────────────────────────────────────────────── */}
      <section className="relative overflow-hidden rounded-2xl reveal reveal-up">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-12"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/167699/pexels-photo-167699.jpeg?auto=compress&cs=tinysrgb&w=1200')" }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B0F0C]/95 via-[#161D19]/90 to-[#0B0F0C]/95" />
        <div className="relative p-8 sm:p-12 grid md:grid-cols-2 gap-10 items-center border border-white/8 rounded-2xl">
          <div className="space-y-4 reveal reveal-left">
            <p className="section-label">Our Mission</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F3EE] font-heading">Why we built Travel Buddy</h2>
            <p className="text-[#B8B4AA] leading-relaxed">
              Nepal is home to some of the world’s most breathtaking trails —
              from day hikes around Kathmandu Valley to multi-day treks in the
              Annapurna and Everest regions. Yet finding reliable trail partners
              and accurate route information can be difficult.
            </p>
            <p className="text-[#B8B4AA] leading-relaxed">
              Travel Buddy solves this by bringing hikers together, providing
              real-time trail maps with walking distance calculations, and giving
              every adventurer the tools to organise and join group hikes safely.
            </p>
          </div>
          <div className="grid gap-4 grid-cols-2 reveal reveal-right delay-200">
            {[
              { label: "Hikes Listed",  value: stats ? stats.hikeCount.toString() : "...", color: "text-[#C6A16E]", bg: "bg-[#C6A16E]/[0.08] border-[#C6A16E]/20" },
              { label: "Active Hikers", value: stats ? stats.userCount.toString() : "...", color: "text-[#8FA68E]", bg: "bg-[#8FA68E]/[0.08] border-[#8FA68E]/20" },
              { label: "Trip Photos",   value: stats ? stats.photoCount.toString() : "...", color: "text-[#C6A16E]", bg: "bg-[#C6A16E]/[0.08] border-[#C6A16E]/20" },
              { label: "Upcoming Hikes",value: stats ? stats.upcomingHikes.toString() : "...", color: "text-[#8FA68E]", bg: "bg-[#8FA68E]/[0.08] border-[#8FA68E]/20" },
            ].map(({ label, value, color, bg }) => (
              <div key={label} className={`${bg} border rounded-xl p-5 flex flex-col items-center justify-center text-center gap-1`}>
                <span className={`text-3xl font-bold font-heading ${color}`}>{value}</span>
                <span className="text-[10px] text-[#8E8A81] uppercase tracking-widest font-semibold">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────── */}
      <section className="space-y-6">
        <p className="section-label text-center reveal reveal-fade">Platform Features</p>
        <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F3EE] text-center reveal reveal-up font-heading">
          Everything you need for your next hike
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon={<Map className="w-5 h-5" />}
            title="Interactive Trail Maps"
            desc="Explore hikes on a full-screen OpenStreetMap-powered map. View hike markers, click to see details, and get a real-time trail route drawn on the map."
            delay="delay-100"
          />
          <FeatureCard
            icon={<Ruler className="w-5 h-5" />}
            title="Trail Distance Calculator"
            desc="Measure real walking distances along actual paths — not straight lines. Powered by OSRM foot-routing, so you know exactly how far you'll hike."
            delay="delay-200"
          />
          <FeatureCard
            icon={<Users className="w-5 h-5" />}
            title="Group Hike Organiser"
            desc="Create a hike event with a title, description, difficulty, start and end points, and invite other hikers to join with a single click."
            delay="delay-300"
          />
          <FeatureCard
            icon={<Navigation className="w-5 h-5" />}
            title="Start & End Point Routing"
            desc="Every hike has a marked trailhead and summit or viewpoint. Open any hike to see the full route polyline and trail distance in the details panel."
            delay="delay-400"
          />
          <FeatureCard
            icon={<Camera className="w-5 h-5" />}
            title="Photo Feed"
            desc="Share your hiking photos with the community. Upload, browse, and celebrate the beauty of Nepal's landscapes with fellow adventurers."
            delay="delay-500"
          />
          <FeatureCard
            icon={<MessageCircle className="w-5 h-5" />}
            title="Real-time Group Chat"
            desc="Each hike group has a built-in chat so participants can coordinate meetup points, share tips, and keep everyone in the loop before and during the hike."
            delay="delay-600"
          />
          <FeatureCard
            icon={<Star className="w-5 h-5" />}
            title="Location Reviews"
            desc="Rate and review hiking destinations. Help other adventurers make informed decisions with honest community feedback."
            delay="delay-100"
          />
          <FeatureCard
            icon={<ShieldCheck className="w-5 h-5" />}
            title="Expense Tracking"
            desc="Split costs fairly across your group. Log transport, food, and gear expenses, and see each member's share automatically calculated."
            delay="delay-200"
          />
        </div>
      </section>

      {/* ── Community Reviews ───────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4 reveal reveal-up">
          <div>
            <p className="section-label mb-2">Community Reviews</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-[#F5F3EE] font-heading">
              What hikers are saying
            </h2>
            {avgRating && (
              <div className="flex items-center gap-2 mt-2">
                <Stars rating={Math.round(Number(avgRating))} />
                <span className="text-[#C6A16E] font-bold">{avgRating}</span>
                <span className="text-[#8E8A81] text-sm">
                  from {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-3 py-12 text-[#B8B4AA]">
            <div className="w-4 h-4 rounded-full border-2 border-[#C6A16E] border-t-transparent animate-spin" />
            <span className="text-sm">Loading reviews…</span>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-red-400 text-sm">{error}</div>
        ) : reviews.length === 0 ? (
          <div className="site-card rounded-xl p-10 text-center text-[#8E8A81] text-sm">
            No reviews yet — join a hike and be the first to share your experience!
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, visibleCount).map((review, idx) => (
                <div
                  key={review._id}
                  onClick={() => setSelectedReview(review)}
                  className="site-card rounded-xl p-5 flex flex-col gap-3 cursor-pointer hover:border-[#C6A16E]/25 transition-all animate-fade-in group"
                  style={{ animationDelay: `${idx * 0.07}s` }}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-[#1E2820] border border-[#C6A16E]/30 text-[#C6A16E] flex items-center justify-center font-bold text-sm shrink-0">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#F5F3EE] leading-tight">
                          {review.userName}
                        </p>
                        <p className="text-xs text-[#8E8A81]">
                          {new Date(review.createdAt).toLocaleDateString("en-US", {
                            year: "numeric", month: "short", day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Stars rating={review.rating} />
                      <span className="text-[10px] text-[#C6A16E] font-medium">
                        {RATING_LABELS[review.rating]}
                      </span>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="inline-flex items-center gap-1.5 bg-[#111714] border border-white/6 rounded-md px-2.5 py-1 w-fit">
                    <Map className="w-3 h-3 text-[#C6A16E] shrink-0" />
                    <span className="text-xs text-[#B8B4AA]">{review.locationName}</span>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-sm text-[#B8B4AA] leading-relaxed line-clamp-3">
                      {review.comment}
                    </p>
                  )}

                  {review.comment && review.comment.length > 120 && (
                    <span className="text-xs text-[#C6A16E] group-hover:text-[#D4AE7A] transition-colors">
                      Read more →
                    </span>
                  )}
                </div>
              ))}
            </div>

            {visibleCount < reviews.length && (
              <div className="text-center">
                <button
                  onClick={() => setVisibleCount((v) => v + 6)}
                  className="btn-primary inline-flex items-center gap-2 px-6 py-2.5 rounded-md text-sm font-semibold"
                >
                  Load more reviews
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── Review Detail Modal ──────────────────────────────────────── */}
      {selectedReview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B0F0C]/80 p-4"
          onClick={() => setSelectedReview(null)}
        >
          <div
            className="site-card rounded-2xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gold accent top */}
            <div className="h-1 w-full bg-gradient-to-r from-[#C6A16E]/70 via-[#E8D5B0]/40 to-transparent" />

            <div className="p-6 space-y-5 relative">
              {/* Close */}
              <button
                onClick={() => setSelectedReview(null)}
                className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-lg bg-white/6 border border-white/10 text-[#8E8A81] hover:text-[#F5F3EE] transition-all"
              >
                ×
              </button>

              {/* User */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-[#1E2820] border-2 border-[#C6A16E]/40 flex items-center justify-center text-[#C6A16E] font-bold text-xl shrink-0 font-heading">
                  {selectedReview.userName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#F5F3EE] font-heading">
                    {selectedReview.userName}
                  </h3>
                  <p className="text-sm text-[#8E8A81]">
                    {new Date(selectedReview.createdAt).toLocaleDateString("en-US", {
                      weekday: "long", year: "numeric", month: "long", day: "numeric",
                    })}
                  </p>
                </div>
              </div>

              {/* Rating row */}
              <div className="bg-[#111714] border border-white/8 rounded-xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Stars rating={selectedReview.rating} />
                  <span className="text-[#C6A16E] font-bold text-lg font-heading">{selectedReview.rating}.0</span>
                </div>
                <span className="text-xs font-semibold text-[#C6A16E] bg-[#C6A16E]/10 border border-[#C6A16E]/25 px-3 py-1 rounded-full">
                  {RATING_LABELS[selectedReview.rating]}
                </span>
              </div>

              {/* Location */}
              <div className="inline-flex items-center gap-1.5 bg-[#111714] border border-white/8 rounded-md px-3 py-1.5">
                <Map className="w-3.5 h-3.5 text-[#C6A16E]" />
                <span className="text-sm font-medium text-[#B8B4AA]">{selectedReview.locationName}</span>
              </div>

              {/* Comment */}
              {selectedReview.comment ? (
                <div className="space-y-2">
                  <p className="section-label">Review</p>
                  <p className="text-[#B8B4AA] leading-relaxed whitespace-pre-wrap text-sm">
                    {selectedReview.comment}
                  </p>
                </div>
              ) : (
                <p className="text-[#8E8A81] italic text-sm">No written review provided.</p>
              )}

              <button
                onClick={() => setSelectedReview(null)}
                className="btn-outline w-full py-2 rounded-lg text-sm font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

// #endregion Component

// #region Exports
export default About;
// #endregion Exports
