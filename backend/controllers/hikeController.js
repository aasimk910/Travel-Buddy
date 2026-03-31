// backend/controllers/hikeController.js
// CRUD operations for hikes, plus join/leave logic and AI-powered recommendations.
// Recommendations score upcoming hikes against the user's onboarding profile.

// #region Imports
const Hike = require("../models/Hike");
const OnboardingProfile = require("../models/OnboardingProfile");

// #endregion Imports

// Utility: determines the season (spring/summer/autumn/winter) from a Date value
function getSeasonFromDate(dateValue) {
  const month = new Date(dateValue).getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

// Returns a paginated list of all hikes, sorted by date ascending.
const getHikes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const hikes = await Hike.find()
      .populate("hotels")
      .sort({ date: 1 })
      .limit(limit)
      .skip(skip);

    const total = await Hike.countDocuments();

    res.json({
      hikes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    console.error("Fetch hikes error:", err);
    res.status(500).json({ message: "Unable to fetch hikes." });
  }
};

// Returns personalized hike recommendations for the authenticated user.
// Scores each upcoming hike against the user's onboarding profile (difficulty, region,
// season, fitness, budget, accommodation preference, etc.) and returns the top matches.
const getRecommendedHikes = async (req, res) => {
  try {
    const onboardingProfile = await OnboardingProfile.findOne({ userId: req.user._id }).lean();

    console.log("[Recommendations] User:", req.user?.email, "Onboarding completed:", req.user?.onboardingCompleted, "Profile:", onboardingProfile || req.user?.hikingProfile);

    const profile = onboardingProfile || req.user?.hikingProfile;

    if (!req.user?.onboardingCompleted || !profile) {
      console.log("[Recommendations] Onboarding not completed. Returning error.");
      return res.status(400).json({
        message: "Complete onboarding to get personalized hike recommendations.",
        hikes: [],
      });
    }

    console.log("[Recommendations] Using profile:", JSON.stringify(profile, null, 2));

    const {
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
    } = profile;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allUpcoming = await Hike.find({ date: { $gte: today } })
      .populate("hotels")
      .sort({ date: 1 })
      .limit(100);

    const normalizedRegion = (preferredRegion || "").toLowerCase();
    const hasMedicalNotes = Boolean((medicalConsiderations || "").trim());

    const scored = allUpcoming
      .map((hike) => {
        let score = 0;
        const locationText = (hike.location || "").toLowerCase();
        const titleText = (hike.title || "").toLowerCase();
        const descriptionText = (hike.description || "").toLowerCase();
        const combinedText = `${titleText} ${descriptionText}`;
        const hikeSeason = getSeasonFromDate(hike.date);
        const hasHotels = (hike.hotels || []).length > 0;
        const estimatedDailyCost = 1000 + hike.difficulty * 900 + (hasHotels ? 1200 : 0);
        const scores_breakdown = {};

        if (typeof preferredDifficulty === "number") {
          const diffDelta = Math.abs(hike.difficulty - preferredDifficulty);
          const pts = Math.max(0, 5 - diffDelta);
          score += pts;
          scores_breakdown.difficulty = pts;
        }

        if (experienceLevel === "beginner" && hike.difficulty <= 2) score += 2;
        if (experienceLevel === "intermediate" && hike.difficulty >= 2 && hike.difficulty <= 4) score += 2;
        if (experienceLevel === "advanced" && hike.difficulty >= 4) score += 2;

        if (fitnessLevel === "low" && hike.difficulty <= 2) score += 2;
        if (fitnessLevel === "medium" && hike.difficulty >= 2 && hike.difficulty <= 4) score += 2;
        if (fitnessLevel === "high" && hike.difficulty >= 4) score += 2;

        if (normalizedRegion && normalizedRegion.trim() && locationText.includes(normalizedRegion)) {
          score += 4;
          scores_breakdown.region = 4;
        }

        if (preferredSeason && hikeSeason === preferredSeason) score += 2;

        if (tripGoal === "challenge" && hike.difficulty >= 4) score += 2;
        if (tripGoal === "scenic" && (titleText.includes("lake") || descriptionText.includes("view"))) score += 2;
        if (tripGoal === "social" && hike.spotsLeft >= 5) score += 2;
        if (tripGoal === "photography" && (titleText.includes("sunrise") || descriptionText.includes("photo"))) score += 2;

        if (hikeDuration === "half-day" && hike.difficulty <= 2) score += 1;
        if (hikeDuration === "full-day" && hike.difficulty >= 2 && hike.difficulty <= 4) score += 1;
        if (hikeDuration === "multi-day" && hike.difficulty >= 4) score += 1;

        if (groupPreference === "solo" && hike.spotsLeft <= 5) score += 1;
        if (groupPreference === "small-group" && hike.spotsLeft >= 3 && hike.spotsLeft <= 10) score += 1;
        if (groupPreference === "large-group" && hike.spotsLeft >= 8) score += 1;

        if (typeof maxBudgetPerDay === "number") {
          if (estimatedDailyCost <= maxBudgetPerDay) {
            score += 2;
          } else {
            score -= Math.min(2, Math.ceil((estimatedDailyCost - maxBudgetPerDay) / 2000));
          }
        }

        if (accommodationPreference === "luxury" && hasHotels) score += 1;
        if (accommodationPreference === "comfortable" && hasHotels) score += 1;
        if (accommodationPreference === "basic" && !hasHotels) score += 1;

        if (wantsGuide === true && (combinedText.includes("guide") || combinedText.includes("guided"))) score += 1;
        if (wantsGuide === false && !combinedText.includes("guide") && !combinedText.includes("guided")) score += 1;

        if (hasMedicalNotes && hike.difficulty <= 3) score += 2;

        if (hike._id.toString() === allUpcoming[0]?._id?.toString()) {
          console.log("[Recommendations] Sample hike:", hike.title, "Score breakdown:", scores_breakdown, "Total:", score);
        }

        return { hike, score };
      })
      .sort((a, b) => b.score - a.score);

    console.log("[Recommendations] All scores:", scored.map(s => ({ title: s.hike.title, score: s.score })));

    const topScore = scored[0]?.score ?? 0;
    const minScoreThreshold = topScore > 0 ? Math.ceil(topScore * 0.3) : 0;

    const recommendedEntries = scored
      .filter((entry) => entry.score >= minScoreThreshold)
      .slice(0, 4);

    const finalEntries = recommendedEntries.length > 0 ? recommendedEntries : scored.slice(0, 4);
    const recommended = finalEntries.map((entry) => entry.hike);

    console.log("[Recommendations] Threshold:", minScoreThreshold, "Top score:", topScore);
    console.log("[Recommendations] Returning", recommended.length, "hikes");

    return res.json({ hikes: recommended });
  } catch (err) {
    console.error("Recommended hikes error:", err);
    return res.status(500).json({ message: "Unable to fetch recommended hikes." });
  }
};

// Returns a single hike by ID, populated with creator, participants, and linked hotels/packages.
const getHikeById = async (req, res) => {
  try {
    const hike = await Hike.findById(req.params.id)
      .populate("userId", "name email")
      .populate("participants", "name email")
      .populate({ path: "hotels", populate: { path: "packages" } });
    if (!hike) {
      return res.status(404).json({ message: "Hike not found." });
    }
    res.json(hike);
  } catch (err) {
    console.error("Fetch hike error:", err);
    res.status(500).json({ message: "Unable to fetch hike." });
  }
};

// Creates a new hike. Validates required fields (title, location, date) and difficulty range.
const createHike = async (req, res) => {
  try {
    const { title, location, coordinates, difficulty, date, spotsLeft, imageUrl, description } = req.body;

    if (!title || !location || !date) {
      return res.status(400).json({ message: "title, location and date are required." });
    }

    const difficultyNum = Number(difficulty);
    if (isNaN(difficultyNum) || difficultyNum < 1 || difficultyNum > 5) {
      return res.status(400).json({ message: "Difficulty must be a number between 1 and 5." });
    }

    const hikeDate = new Date(date);
    if (isNaN(hikeDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    const spots = Number(spotsLeft);
    if (isNaN(spots) || spots < 0) {
      return res.status(400).json({ message: "Spots left must be a non-negative number." });
    }

    const hike = await Hike.create({
      userId: req.user._id,
      title: title.trim(),
      location: location.trim(),
      coordinates: coordinates || undefined,
      difficulty: difficultyNum,
      date: hikeDate,
      spotsLeft: spots || 0,
      imageUrl: imageUrl || undefined,
      description: description ? description.trim() : undefined,
    });

    res.status(201).json(hike);
  } catch (err) {
    console.error("Create hike error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(err.errors).map((e) => e.message).join(", "),
      });
    }
    res.status(500).json({ message: "Unable to create hike." });
  }
};

// Adds the authenticated user to a hike's participant list.
// Uses atomic findOneAndUpdate to prevent race conditions on spotsLeft.
const joinHike = async (req, res) => {
  try {
    const hikeId = req.params.id;
    const userId = req.user._id;

    // Atomic: only update if spotsLeft > 0 and user not already a participant.
    // This prevents the race condition where two concurrent requests both read
    // spotsLeft = 1, both decrement, and corrupt the count.
    const hike = await Hike.findOneAndUpdate(
      { _id: hikeId, spotsLeft: { $gt: 0 }, participants: { $ne: userId } },
      { $push: { participants: userId }, $inc: { spotsLeft: -1 } },
      { new: true }
    );

    if (!hike) {
      // Distinguish between "not found", "already joined", and "full"
      const existing = await Hike.findById(hikeId).select("spotsLeft participants").lean();
      if (!existing) return res.status(404).json({ message: "Hike not found." });
      if (existing.participants.some(p => p.equals(userId))) {
        return res.status(400).json({ message: "You have already joined this hike." });
      }
      return res.status(400).json({ message: "No spots left for this hike." });
    }

    res.json({ message: "Successfully joined the hike!", hike });
  } catch (err) {
    console.error("Join hike error:", err);
    res.status(500).json({ message: "Unable to join hike." });
  }
};

// Removes the authenticated user from a hike's participant list.
// Uses atomic findOneAndUpdate to safely increment spotsLeft.
const leaveHike = async (req, res) => {
  try {
    const hikeId = req.params.id;
    const userId = req.user._id;

    // Atomic: only update if user is actually a participant.
    const hike = await Hike.findOneAndUpdate(
      { _id: hikeId, participants: userId },
      { $pull: { participants: userId }, $inc: { spotsLeft: 1 } },
      { new: true }
    );

    if (!hike) {
      const existing = await Hike.findById(hikeId).select("_id").lean();
      if (!existing) return res.status(404).json({ message: "Hike not found." });
      return res.status(400).json({ message: "You are not a participant of this hike." });
    }

    res.json({ message: "Successfully left the hike!", hike });
  } catch (err) {
    console.error("Leave hike error:", err);
    res.status(500).json({ message: "Unable to leave hike." });
  }
};

// GET /api/user-trips - hikes the authenticated user has joined
const getUserTrips = async (req, res) => {
  try {
    const hikes = await Hike.find({ participants: req.user._id }).sort({ date: 1 }).lean();
    res.json(hikes);
  } catch (err) {
    console.error("Fetch user trips error:", err);
    res.status(500).json({ message: "Unable to fetch user trips." });
  }
};

// #region Exports
module.exports = { getHikes, getRecommendedHikes, getHikeById, createHike, joinHike, leaveHike, getUserTrips };
// #endregion Exports
