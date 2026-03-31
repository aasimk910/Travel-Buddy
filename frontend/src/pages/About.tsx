// src/pages/About.tsx
// About page describing the Travel Buddy platform, mission, and team.
// #region Imports
import React, { useEffect, useState } from "react";
import { useScrollReveal } from "../hooks/useScrollReveal";
import {
// #endregion Imports
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

type SiteStats = {
  hikeCount: number;
  userCount: number;
  photoCount: number;
  upcomingHikes: number;
};

// --- Star renderer ------------------------------------------------
const Stars: React.FC<{ rating: number }> = ({ rating }) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i <= rating ? "text-yellow-400 fill-yellow-400" : "text-gray-500"}`}
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
  <div className={`glass-card rounded-xl p-6 flex flex-col gap-3 reveal reveal-up ${delay}`}>
    <div className="w-10 h-10 rounded-lg glass-button-dark flex items-center justify-center text-white flex-shrink-0">
      {icon}
    </div>
    <h3 className="font-semibold text-white">{title}</h3>
    <p className="text-sm text-gray-300 leading-relaxed">{desc}</p>
  </div>
);

// --- Main page ----------------------------------------------------
const About: React.FC = () => {
  const revealRef = useScrollReveal();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(6);
  const [stats, setStats] = useState<SiteStats | null>(null);

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
    <div className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-12 space-y-16" ref={revealRef}>
      {/* -- Hero --------------------------------------------------- */}
      <section className="text-center max-w-3xl mx-auto space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full glass-strong px-4 py-1.5 text-xs font-medium text-black reveal reveal-fade">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          About Travel Buddy
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight reveal reveal-up delay-100">
          Your companion for Nepal's trails
        </h1>
        <p className="text-gray-200 text-base sm:text-lg leading-relaxed reveal reveal-fade delay-200">
          Travel Buddy is a community platform built for hikers and outdoor
          enthusiasts in Nepal. Discover trails, connect with fellow adventurers,
          plan trips together, and share your journey — all in one place.
        </p>
      </section>

      {/* -- Mission ------------------------------------------------ */}
      <section className="glass-card rounded-2xl p-8 sm:p-12 grid md:grid-cols-2 gap-10 items-center reveal reveal-up">
        <div className="space-y-4 reveal reveal-left">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Our Mission</h2>
          <p className="text-gray-200 leading-relaxed">
            Nepal is home to some of the world's most breathtaking trails —
            from day hikes around Kathmandu Valley to multi-day treks in the
            Annapurna and Everest regions. Yet finding reliable trail partners
            and accurate route information can be difficult.
          </p>
          <p className="text-gray-200 leading-relaxed">
            Travel Buddy solves this by bringing hikers together, providing
            real-time trail maps with walking distance calculations, and giving
            every adventurer the tools to organise and join group hikes safely.
          </p>
        </div>
        <div className="grid gap-4 grid-cols-2 reveal reveal-right delay-200">
          {[
            { label: "Hikes Listed", value: stats ? stats.hikeCount.toString() : "…", delay: "delay-100" },
            { label: "Active Hikers", value: stats ? stats.userCount.toString() : "…", delay: "delay-200" },
            { label: "Trip Photos", value: stats ? stats.photoCount.toString() : "…", delay: "delay-300" },
            { label: "Upcoming Hikes", value: stats ? stats.upcomingHikes.toString() : "…", delay: "delay-400" },
          ].map(({ label, value, delay }) => (
            <div
              key={label}
              className={`glass rounded-xl p-5 flex flex-col items-center justify-center text-center gap-1 reveal reveal-scale ${delay}`}
            >
              <span className="text-3xl font-bold text-white">{value}</span>
              <span className="text-xs text-gray-300 uppercase tracking-wide">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* -- Features ----------------------------------------------- */}
      <section className="space-y-6">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center reveal reveal-up">
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

      {/* -- Community Reviews --------------------------------------- */}
      <section className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-4 reveal reveal-up">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              What hikers are saying
            </h2>
            {avgRating && (
              <div className="flex items-center gap-2 mt-2">
                <Stars rating={Math.round(Number(avgRating))} />
                <span className="text-white font-semibold">{avgRating}</span>
                <span className="text-gray-300 text-sm">
                  average from {reviews.length} review{reviews.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-300">Loading reviews…</div>
        ) : error ? (
          <div className="text-center py-12 text-red-300">{error}</div>
        ) : reviews.length === 0 ? (
          <div className="glass-card rounded-xl p-10 text-center text-gray-300">
            No reviews yet — join a hike and be the first to share your experience!
          </div>
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {reviews.slice(0, visibleCount).map((review, idx) => (
                <div
                  key={review._id}
                  className={`glass-card rounded-xl p-5 flex flex-col gap-3 reveal reveal-scale ${["delay-100","delay-200","delay-300","delay-400","delay-500","delay-600"][idx % 6]}`}
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full glass-button-dark text-white flex items-center justify-center font-semibold text-sm flex-shrink-0">
                        {review.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white leading-tight">
                          {review.userName}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(review.createdAt).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    <Stars rating={review.rating} />
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-1 text-xs text-emerald-300">
                    <Map className="w-3 h-3" />
                    <span>{review.locationName}</span>
                  </div>

                  {/* Comment */}
                  {review.comment && (
                    <p className="text-sm text-gray-200 leading-relaxed line-clamp-4">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {visibleCount < reviews.length && (
              <div className="text-center">
                <button
                  onClick={() => setVisibleCount((v) => v + 6)}
                  className="inline-flex items-center gap-2 px-6 py-2.5 glass-button-dark rounded-full text-white text-sm font-medium hover:opacity-90 transition"
                >
                  View more reviews
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

// #region Exports
export default About;
// #endregion Exports
