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

// #endregion Imports
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
      const token = localStorage.getItem("travelBuddyToken");
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
    <div className="glass-card rounded-xl shadow-sm p-8">
      <form onSubmit={handleSubmit}>
        {/* Icon */}
        <div className="flex justify-center mb-5">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
            <Star className="w-8 h-8 text-emerald-400" />
          </div>
        </div>

        {/* Location input */}
        <div className="mb-5">
          <label className="block text-white/60 text-xs uppercase tracking-widest font-semibold mb-2 text-center">
            Where did you visit?
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <input
              ref={locationInputRef}
              type="text"
              value={reviewLocation}
              onChange={e => { setReviewLocation(e.target.value); setLocationTouched(true); }}
              placeholder="e.g. Poon Hill, Nagarkot..."
              className="w-full pl-9 pr-3 py-2.5 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 text-white placeholder-gray-400 text-center font-semibold text-base"
            />
          </div>
          {!locationTouched && (
            <p className="text-center text-white/35 text-xs mt-1.5">
              Suggested · <button type="button" onClick={handleShowAnother} className="underline hover:text-white/60 transition-colors">try another</button>
            </p>
          )}
        </div>

        {/* Star rating */}
        <div className="flex flex-col items-center mb-5">
          <div
            className="flex gap-1"
            aria-label="Select a rating out of five stars"
            onMouseLeave={() => setHoveredStar(0)}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setReviewRating(star)}
                onMouseEnter={() => setHoveredStar(star)}
                className={`text-3xl transition-all duration-100 ${
                  (hoveredStar || reviewRating) >= star
                    ? "text-yellow-300 scale-110"
                    : "text-gray-400 hover:text-yellow-200"
                }`}
                aria-pressed={reviewRating === star}
              >
                ?
              </button>
            ))}
          </div>
          <p className={`text-xs mt-1.5 transition-all duration-150 ${(hoveredStar || reviewRating) ? "text-yellow-300/80" : "text-white/30"}`}>
            {STAR_LABELS[hoveredStar || reviewRating] || "Tap a star to rate"}
          </p>
        </div>

        {/* Comment */}
        <textarea
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
          placeholder="Share your experience — what did you love? Any tips for others?"
          className="w-full px-4 py-3 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white/40 resize-none mb-4 text-white placeholder-gray-400"
          rows={4}
        />

        {reviewMessage && (
          <div className={`mb-3 rounded-lg px-3 py-2 text-sm ${reviewMessage.type === "success" ? "glass-strong text-black" : "glass-dark text-white"}`}>
            {reviewMessage.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmittingReview}
          className="w-full glass-button-dark font-semibold py-3 px-4 rounded-lg transition-all mb-3 flex items-center justify-center gap-2 disabled:opacity-60 text-white"
        >
          <PenLine className="w-4 h-4" />
          {isSubmittingReview ? "Submitting..." : "Submit Review"}
        </button>
        <button
          type="button"
          onClick={handleShowAnother}
          disabled={isSubmittingReview}
          className="w-full glass-button text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <RefreshCw className="w-4 h-4" />
          Suggest another place
        </button>
      </form>
    </div>
  );
};

// #region Exports
export default ReviewCard;
// #endregion Exports
