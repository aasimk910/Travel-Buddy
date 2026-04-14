// src/components/homepage/ReviewCard.tsx
// Card for submitting and displaying location reviews with star ratings.
// #region Imports
import React, { useState, useRef } from "react";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DOMPurify from "dompurify";
import { MapPin, PenLine, RefreshCw, Star } from "lucide-react";
import { submitReview } from "../../services/reviews";
import { getToken } from "../../services/auth";

// #endregion Imports

// #region Constants
const FEATURED_LOCATIONS = [
  "Chamlang Central",
  "Nagarkot View Tower",
  "Sarangkot Viewpoint",
  "Dhulikhel Sunrise Point",
  "Poon Hill",
  "Shivapuri Peak",
];

// Handles getRandomLocation logic.
const getRandomLocation = (current?: string) => {
  const filtered = FEATURED_LOCATIONS.filter((loc) => loc !== current);
  const list = filtered.length ? filtered : FEATURED_LOCATIONS;
  return list[Math.floor(Math.random() * list.length)];
};
// #endregion Constants

// #region Component
const ReviewCard: React.FC = () => {
  const { logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();
  const locationInputRef = useRef<HTMLInputElement>(null);

  const [reviewLocation, setReviewLocation] = useState<string>(() => getRandomLocation());
  const [locationTouched, setLocationTouched] = useState(false);
  const [reviewRating, setReviewRating]       = useState<number>(0);
  const [hoveredStar, setHoveredStar]         = useState<number>(0);
  const [reviewComment, setReviewComment]     = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage]     = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Handles handleSubmit logic.
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reviewRating || reviewRating < 1 || reviewRating > 5) {
      setReviewMessage({ type: "error", text: "Please select a rating between 1 and 5 stars." });
      return;
    }
    if (!reviewLocation || !reviewLocation.trim()) {
      setReviewMessage({ type: "error", text: "Location is required." });
      return;
    }

    setIsSubmittingReview(true);
    setReviewMessage(null);

    try {
      const token = getToken();
      if (!token) {
        setReviewMessage({ type: "error", text: "You must be logged in to submit a review." });
        navigate("/login");
        return;
      }

      const sanitizedComment = reviewComment ? DOMPurify.sanitize(reviewComment) : undefined;
      await submitReview(reviewLocation.trim(), reviewRating, sanitizedComment, token);

      setReviewMessage({ type: "success", text: "Thanks for sharing your review!" });
      showSuccess("Review submitted successfully!");
      setReviewLocation(getRandomLocation(reviewLocation));
      setReviewComment("");
      setReviewRating(0);
      setTimeout(() => setReviewMessage(null), 3000);
    } catch (err: any) {
      if (err?.message === 'AUTH_EXPIRED') {
        logout();
        navigate('/login');
        showError('Your session has expired. Please log in again.');
      } else {
        const errorMessage = err?.message || "Unable to submit review. Please try again.";
        setReviewMessage({ type: "error", text: errorMessage });
        showError(errorMessage);
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Handles handleShowAnother logic.
  const handleShowAnother = () => {
    setReviewLocation(getRandomLocation(reviewLocation));
    setLocationTouched(false);
    setReviewRating(0);
    setHoveredStar(0);
    setReviewComment("");
    setReviewMessage(null);
  };

  const STAR_LABELS = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <div className="site-card rounded-xl overflow-hidden h-full flex flex-col">
      {/* Header accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#C6A16E]/60 via-[#E8D5B0]/40 to-transparent" />

      <div className="p-6 flex-1 flex flex-col">
        {/* Title row */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#C6A16E]/10 border border-[#C6A16E]/25 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 text-[#C6A16E]" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F5F3EE] font-heading">Leave a Review</h3>
            <p className="text-xs text-[#8E8A81]">Share your trail experience</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4">
          {/* Location */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#8E8A81] mb-2">
              Location
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#C6A16E] pointer-events-none" />
              <input
                ref={locationInputRef}
                type="text"
                value={reviewLocation}
                onChange={e => { setReviewLocation(e.target.value); setLocationTouched(true); }}
                placeholder="e.g. Poon Hill, Nagarkot..."
                className="w-full pl-9 pr-3 py-2.5 site-input rounded-lg text-sm font-medium"
              />
            </div>
            {!locationTouched && (
              <p className="text-[#8E8A81] text-xs mt-1.5">
                Suggested —{" "}
                <button type="button" onClick={handleShowAnother} className="text-[#C6A16E] hover:text-[#D4AE7A] underline transition-colors">
                  try another
                </button>
              </p>
            )}
          </div>

          {/* Star rating */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#8E8A81] mb-2">
              Rating
            </label>
            <div
              className="flex gap-1.5"
              aria-label="Select a rating out of five stars"
              onMouseLeave={() => setHoveredStar(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setReviewRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  className={`text-2xl transition-all duration-100 leading-none ${
                    (hoveredStar || reviewRating) >= star
                      ? "text-[#C6A16E] scale-110"
                      : "text-[#8E8A81]/40 hover:text-[#C6A16E]/60"
                  }`}
                  aria-pressed={reviewRating === star}
                >
                  ★
                </button>
              ))}
              {(hoveredStar || reviewRating) > 0 && (
                <span className="ml-2 text-xs text-[#C6A16E] self-center font-medium">
                  {STAR_LABELS[hoveredStar || reviewRating]}
                </span>
              )}
            </div>
          </div>

          {/* Comment */}
          <div className="flex-1">
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#8E8A81] mb-2">
              Your Experience
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="What did you love? Any tips for others?"
              className="w-full site-input px-4 py-3 rounded-lg resize-none text-sm h-24"
              rows={3}
            />
          </div>

          {reviewMessage && (
            <div className={`rounded-lg px-3 py-2 text-sm border ${
              reviewMessage.type === "success"
                ? "bg-emerald-900/20 border-emerald-700/30 text-emerald-400"
                : "bg-red-900/20 border-red-700/30 text-red-400"
            }`}>
              {reviewMessage.text}
            </div>
          )}

          <div className="flex gap-3 mt-auto pt-1">
            <button
              type="submit"
              disabled={isSubmittingReview}
              className="btn-primary flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold disabled:opacity-60"
            >
              <PenLine className="w-4 h-4" />
              {isSubmittingReview ? "Submitting…" : "Submit Review"}
            </button>
            <button
              type="button"
              onClick={handleShowAnother}
              disabled={isSubmittingReview}
              className="btn-outline px-3 py-2.5 rounded-lg disabled:opacity-60"
              title="Try another location"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// #endregion Component

// #region Exports
export default ReviewCard;
// #endregion Exports
