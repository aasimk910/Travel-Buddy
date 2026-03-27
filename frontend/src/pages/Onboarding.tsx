import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { completeOnboarding } from "../services/onboarding";
import { getRecommendedHikes, type Hike } from "../services/hikes";

type LocationState = {
  from?: string;
};

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loginWithProfile } = useAuth();

  const nextPath = useMemo(() => {
    const fromPath = (location.state as LocationState | undefined)?.from;
    if (fromPath && fromPath !== "/onboarding") {
      return fromPath;
    }
    return "/homepage";
  }, [location.state]);

  const [experienceLevel, setExperienceLevel] = useState<
    "beginner" | "intermediate" | "advanced"
  >("beginner");
  const [fitnessLevel, setFitnessLevel] = useState<"low" | "medium" | "high">(
    "medium"
  );
  const [preferredDifficulty, setPreferredDifficulty] = useState<number>(2);
  const [preferredRegion, setPreferredRegion] = useState<string>("Annapurna");
  const [preferredSeason, setPreferredSeason] = useState<
    "spring" | "summer" | "autumn" | "winter"
  >("autumn");
  const [tripGoal, setTripGoal] = useState<
    "scenic" | "challenge" | "social" | "photography"
  >("scenic");
  const [hikeDuration, setHikeDuration] = useState<
    "half-day" | "full-day" | "multi-day"
  >("full-day");
  const [groupPreference, setGroupPreference] = useState<
    "solo" | "small-group" | "large-group"
  >("small-group");
  const [maxBudgetPerDay, setMaxBudgetPerDay] = useState<number>(3500);
  const [accommodationPreference, setAccommodationPreference] = useState<
    "basic" | "comfortable" | "luxury"
  >("comfortable");
  const [wantsGuide, setWantsGuide] = useState<boolean>(true);
  const [medicalConsiderations, setMedicalConsiderations] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<Hike[]>([]);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate all required fields
    if (!experienceLevel || !fitnessLevel || !preferredRegion || !preferredSeason || !tripGoal || !hikeDuration || !groupPreference || !accommodationPreference) {
      setError("Please fill in all required fields.");
      return;
    }

    const token = localStorage.getItem("travelBuddyToken");
    if (!token) {
      navigate("/login", { replace: true });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        experienceLevel,
        fitnessLevel,
        preferredDifficulty,
        preferredRegion,
        preferredSeason,
        tripGoal,
        hikeDuration,
        groupPreference,
        maxBudgetPerDay,
        accommodationPreference,
        wantsGuide,
        medicalConsiderations,
      };
      
      console.log("[Onboarding] Submitting payload:", JSON.stringify(payload, null, 2));
      
      const onboardingResult = await completeOnboarding(payload, token);
      
      console.log("[Onboarding] Server response:", JSON.stringify(onboardingResult, null, 2));

      if (onboardingResult.user) {
        console.log("[Onboarding] User profile updated:", onboardingResult.user);
        loginWithProfile({
          ...onboardingResult.user,
          provider: onboardingResult.user.provider || user?.provider || "password",
          role: onboardingResult.user.role || user?.role || "user",
        });
      }

      console.log("[Onboarding] Fetching recommended hikes...");
      const recommendedHikes = await getRecommendedHikes(token);
      console.log("[Onboarding] Received", recommendedHikes.length, "recommendations");
      setRecommendations(recommendedHikes);
      setIsDone(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Unable to complete onboarding.";
      console.error("[Onboarding] Error:", errorMsg);
      setError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full px-4 sm:px-6 lg:px-12 xl:px-16 py-10">
      <div className="max-w-4xl mx-auto">
        <div className="glass-card rounded-xl p-6 sm:p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-gray-300">First-time setup</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mt-2">
            Tell us your hiking style
          </h1>
          <p className="text-sm text-gray-200 mt-2">
            We will use your answers to recommend hikes that match your trekking vibe.
          </p>

          {!isDone && (
            <form className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-5" onSubmit={handleSubmit}>
              {error && (
                <div className="sm:col-span-2 rounded-md bg-red-500/20 border border-red-400/30 px-4 py-3 text-sm text-red-200">
                  {error}
                </div>
              )}
              <label className="text-sm text-gray-100">
                Experience level
                <select
                  className="mt-2 w-full glass-input rounded-md px-3 py-2 text-white"
                  value={experienceLevel}
                  onChange={(e) =>
                    setExperienceLevel(e.target.value as "beginner" | "intermediate" | "advanced")
                  }
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </label>

              <label className="text-sm text-gray-100">
                Current fitness level
                <select
                  className="mt-2 w-full glass-input rounded-md px-3 py-2 text-white"
                  value={fitnessLevel}
                  onChange={(e) => setFitnessLevel(e.target.value as "low" | "medium" | "high")}
                >
                  <option value="low">Low - easy pace only</option>
                  <option value="medium">Medium - regular activity</option>
                  <option value="high">High - endurance ready</option>
                </select>
              </label>

              <label className="text-sm text-gray-100">
                Preferred difficulty (1 to 5)
                <input
                  type="range"
                  min={1}
                  max={5}
                  value={preferredDifficulty}
                  onChange={(e) => setPreferredDifficulty(Number(e.target.value))}
                  className="mt-3 w-full"
                />
                <span className="text-xs text-gray-200">Current: {preferredDifficulty}</span>
              </label>

              <label className="text-sm text-gray-100">
                Preferred region
                <input
                  type="text"
                  value={preferredRegion}
                  onChange={(e) => setPreferredRegion(e.target.value)}
                  className="mt-2 w-full glass-input rounded-md px-3 py-2 text-white placeholder-gray-300"
                  placeholder="e.g. Annapurna"
                  required
                />
              </label>

              <label className="text-sm text-gray-100">
                Preferred season
                <select
                  className="mt-2 w-full glass-input rounded-md px-3 py-2 text-white"
                  value={preferredSeason}
                  onChange={(e) =>
                    setPreferredSeason(e.target.value as "spring" | "summer" | "autumn" | "winter")
                  }
                >
                  <option value="spring">Spring</option>
                  <option value="summer">Summer</option>
                  <option value="autumn">Autumn</option>
                  <option value="winter">Winter</option>
                </select>
              </label>

              <label className="text-sm text-gray-100">
                Main trip goal
                <select
                  className="mt-2 w-full glass-input rounded-md px-3 py-2 text-white"
                  value={tripGoal}
                  onChange={(e) =>
                    setTripGoal(e.target.value as "scenic" | "challenge" | "social" | "photography")
                  }
                >
                  <option value="scenic">Scenic views</option>
                  <option value="challenge">Physical challenge</option>
                  <option value="social">Meet new people</option>
                  <option value="photography">Photography spots</option>
                </select>
              </label>

              <label className="text-sm text-gray-100">
                Typical hike duration
                <select
                  className="mt-2 w-full glass-input rounded-md px-3 py-2 text-white"
                  value={hikeDuration}
                  onChange={(e) =>
                    setHikeDuration(e.target.value as "half-day" | "full-day" | "multi-day")
                  }
                >
                  <option value="half-day">Half-day</option>
                  <option value="full-day">Full-day</option>
                  <option value="multi-day">Multi-day</option>
                </select>
              </label>

              <label className="text-sm text-gray-100">
                Group preference
                <select
                  className="mt-2 w-full glass-input rounded-md px-3 py-2 text-white"
                  value={groupPreference}
                  onChange={(e) =>
                    setGroupPreference(e.target.value as "solo" | "small-group" | "large-group")
                  }
                >
                  <option value="solo">Solo or very small</option>
                  <option value="small-group">Small group</option>
                  <option value="large-group">Large group</option>
                </select>
              </label>

              <label className="text-sm text-gray-100">
                Max budget per day (NPR)
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={maxBudgetPerDay}
                  onChange={(e) => setMaxBudgetPerDay(Number(e.target.value || 0))}
                  className="mt-2 w-full glass-input rounded-md px-3 py-2 text-white placeholder-gray-300"
                  required
                />
              </label>

              <label className="text-sm text-gray-100">
                Accommodation preference
                <select
                  className="mt-2 w-full glass-input rounded-md px-3 py-2 text-white"
                  value={accommodationPreference}
                  onChange={(e) =>
                    setAccommodationPreference(e.target.value as "basic" | "comfortable" | "luxury")
                  }
                >
                  <option value="basic">Basic teahouse / budget stay</option>
                  <option value="comfortable">Comfortable lodge/hotel</option>
                  <option value="luxury">Premium comfort</option>
                </select>
              </label>

              <label className="text-sm text-gray-100">
                Do you prefer a guide?
                <select
                  className="mt-2 w-full glass-input rounded-md px-3 py-2 text-white"
                  value={wantsGuide ? "yes" : "no"}
                  onChange={(e) => setWantsGuide(e.target.value === "yes")}
                >
                  <option value="yes">Yes, I want a guide</option>
                  <option value="no">No, independent trek</option>
                </select>
              </label>

              <label className="text-sm text-gray-100 sm:col-span-2">
                Health/altitude notes (optional)
                <textarea
                  value={medicalConsiderations}
                  onChange={(e) => setMedicalConsiderations(e.target.value.slice(0, 300))}
                  rows={3}
                  className="mt-2 w-full glass-input rounded-md px-3 py-2 text-white placeholder-gray-300"
                  placeholder="Any injuries, altitude concerns, or pace limits"
                />
                <span className="text-xs text-gray-300">
                  {medicalConsiderations.length}/300
                </span>
              </label>

              <div className="sm:col-span-2 flex items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="glass-button-dark rounded-md px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Saving..." : "Get my recommendations"}
                </button>
                <button
                  type="button"
                  onClick={() => navigate(nextPath, { replace: true })}
                  className="glass-button rounded-md px-5 py-2 text-sm font-semibold text-white"
                >
                  Skip for now
                </button>
              </div>
            </form>
          )}

          {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

          {isDone && (
            <div className="mt-8">
              <div className="rounded-md bg-emerald-500/20 border border-emerald-400/30 px-4 py-3 mb-6 text-sm text-emerald-200">
                ✓ Your preferences have been saved successfully!
              </div>
              
              <h2 className="text-xl font-semibold text-white">Recommended for you</h2>
              <p className="text-sm text-gray-200 mt-1">
                Based on your answers, these hikes are the best match right now.
              </p>

              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.map((hike) => (
                  <article key={hike._id} className="glass-card rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white">{hike.title}</h3>
                    <p className="text-sm text-gray-200 mt-1">{hike.location}</p>
                    <p className="text-xs text-gray-300 mt-2">Difficulty: {hike.difficulty}/5</p>
                    <p className="text-xs text-gray-300 mt-1">
                      Date: {new Date(hike.date).toLocaleDateString()}
                    </p>
                  </article>
                ))}
              </div>

              {recommendations.length === 0 && (
                <p className="mt-4 text-sm text-gray-200">
                  No strong matches yet. We will still show the newest hikes.
                </p>
              )}

              <button
                type="button"
                onClick={() => navigate(nextPath, { replace: true })}
                className="mt-6 glass-button-dark rounded-md px-5 py-2 text-sm font-semibold text-white"
              >
                Continue to dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Onboarding;
