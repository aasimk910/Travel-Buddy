import React, { useState } from "react";
import { useToast } from "../../context/ToastContext";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DOMPurify from "dompurify";
import { submitReview } from "../../services/reviews";

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

const ReviewCard: React.FC = () => {
  const { logout } = useAuth();
  const { showSuccess, showError } = useToast();
  const navigate = useNavigate();

  const [reviewLocation, setReviewLocation] = useState<string>(() => getRandomLocation());
  const [reviewRating, setReviewRating] = useState<number>(0);
  const [reviewComment, setReviewComment] = useState<string>("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewMessage, setReviewMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  const handleShowAnother = () => {
    setReviewLocation(getRandomLocation(reviewLocation));
    setReviewRating(0);
    setReviewComment("");
    setReviewMessage(null);
  };

  return (
    <div className="glass-card rounded-xl shadow-sm p-8">
      <form onSubmit={handleSubmit}>
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
            Have you been to <span className="underline decoration-2 decoration-white">{reviewLocation}</span>?
          </h3>
          <div className="flex gap-1 mb-4" aria-label="Select a rating out of five stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                type="button"
                key={star}
                onClick={() => setReviewRating(star)}
                className={`text-2xl transition-colors ${reviewRating >= star ? "text-yellow-200" : "text-gray-300"}`}
                aria-pressed={reviewRating === star}
              >
                ★
              </button>
            ))}
          </div>
        </div>

        <textarea
          value={reviewComment}
          onChange={(e) => setReviewComment(e.target.value)}
          placeholder="Write your review or a comment here..."
          className="w-full px-4 py-3 glass-input rounded-lg focus:outline-none focus:ring-2 focus:ring-white resize-none mb-4 text-white placeholder-gray-300"
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
          <span>✍️</span>
          {isSubmittingReview ? "Submitting..." : "Submit Review"}
        </button>
        <button
          type="button"
          onClick={handleShowAnother}
          disabled={isSubmittingReview}
          className="w-full glass-button text-white font-medium py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-60"
        >
          <span>🔄</span>
          Show another
        </button>
      </form>
    </div>
  );
};

export default ReviewCard;
