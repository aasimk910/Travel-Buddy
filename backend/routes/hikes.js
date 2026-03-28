const express = require("express");
const Hike = require("../models/Hike");
const OnboardingProfile = require("../models/OnboardingProfile");
const { authenticateToken } = require("../middleware/auth");
const { createContentLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

function getSeasonFromDate(dateValue) {
  const month = new Date(dateValue).getMonth() + 1;
  if (month >= 3 && month <= 5) return "spring";
  if (month >= 6 && month <= 8) return "summer";
  if (month >= 9 && month <= 11) return "autumn";
  return "winter";
}

// GET /api/hikes - Get all hikes with pagination
router.get("/", async (req, res) => {
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
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Fetch hikes error:", err);
    res.status(500).json({ message: "Unable to fetch hikes." });
  }
});

// GET /api/hikes/recommended - Personalized recommendations from onboarding answers
router.get("/recommended", authenticateToken, async (req, res) => {
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

        // Rough budget estimate: harder trails and hotel-heavy routes usually cost more.
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

        if (preferredSeason && hikeSeason === preferredSeason) {
          score += 2;
        }

        if (tripGoal === "challenge" && hike.difficulty >= 4) {
          score += 2;
        }
        if (tripGoal === "scenic" && (titleText.includes("lake") || descriptionText.includes("view"))) {
          score += 2;
        }
        if (tripGoal === "social" && hike.spotsLeft >= 5) {
          score += 2;
        }
        if (tripGoal === "photography" && (titleText.includes("sunrise") || descriptionText.includes("photo"))) {
          score += 2;
        }

        if (hikeDuration === "half-day" && hike.difficulty <= 2) {
          score += 1;
        }
        if (hikeDuration === "full-day" && hike.difficulty >= 2 && hike.difficulty <= 4) {
          score += 1;
        }
        if (hikeDuration === "multi-day" && hike.difficulty >= 4) {
          score += 1;
        }

        if (groupPreference === "solo" && hike.spotsLeft <= 5) {
          score += 1;
        }
        if (groupPreference === "small-group" && hike.spotsLeft >= 3 && hike.spotsLeft <= 10) {
          score += 1;
        }
        if (groupPreference === "large-group" && hike.spotsLeft >= 8) {
          score += 1;
        }

        if (typeof maxBudgetPerDay === "number") {
          if (estimatedDailyCost <= maxBudgetPerDay) {
            score += 2;
          } else {
            // Mild penalty for going above budget, capped so options still appear.
            score -= Math.min(2, Math.ceil((estimatedDailyCost - maxBudgetPerDay) / 2000));
          }
        }

        if (accommodationPreference === "luxury" && hasHotels) {
          score += 1;
        }
        if (accommodationPreference === "comfortable" && hasHotels) {
          score += 1;
        }
        if (accommodationPreference === "basic" && !hasHotels) {
          score += 1;
        }

        if (wantsGuide === true && (combinedText.includes("guide") || combinedText.includes("guided"))) {
          score += 1;
        }
        if (wantsGuide === false && !combinedText.includes("guide") && !combinedText.includes("guided")) {
          score += 1;
        }

        // When users mention medical/altitude concerns, favor moderate/easier trails.
        if (hasMedicalNotes && hike.difficulty <= 3) {
          score += 2;
        }

        if (hike._id.toString() === allUpcoming[0]?._id?.toString()) {
          console.log("[Recommendations] Sample hike:", hike.title, "Score breakdown:", scores_breakdown, "Total:", score);
        }
        
        return { hike, score };
      })
      .sort((a, b) => b.score - a.score);
    
    console.log("[Recommendations] All scores:", scored.map(s => ({ title: s.hike.title, score: s.score })));

    const topScore = scored[0]?.score ?? 0;
    // Use a low relative threshold so results always appear; fallback to top 4 regardless.
    const minScoreThreshold = topScore > 0 ? Math.ceil(topScore * 0.3) : 0;

    const recommendedEntries = scored
      .filter((entry) => entry.score >= minScoreThreshold)
      .slice(0, 4);

    // Fallback: always return at least 3 hikes even if scores are zero.
    const finalEntries = recommendedEntries.length > 0 ? recommendedEntries : scored.slice(0, 4);
    const recommended = finalEntries.map((entry) => entry.hike);

    console.log("[Recommendations] Threshold:", minScoreThreshold, "Top score:", topScore);
    console.log("[Recommendations] Returning", recommended.length, "hikes");
    console.log("[Recommendations] Top recommended hike IDs:", recommended.map(h => h._id));

    return res.json({ hikes: recommended });
  } catch (err) {
    console.error("Recommended hikes error:", err);
    return res.status(500).json({ message: "Unable to fetch recommended hikes." });
  }
});

// GET /api/hikes/:id - Get a single hike by ID
router.get("/:id", async (req, res) => {
  try {
    const hike = await Hike.findById(req.params.id)
      .populate("userId", "name email")
      .populate("participants", "name email")
      .populate({
        path: "hotels",
        populate: {
          path: "packages",
        },
      });
    if (!hike) {
      return res.status(404).json({ message: "Hike not found." });
    }
    res.json(hike);
  } catch (err) {
    console.error("Fetch hike error:", err);
    res.status(500).json({ message: "Unable to fetch hike." });
  }
});

// POST /api/hikes - Create hike (requires authentication)
router.post("/", authenticateToken, createContentLimiter, async (req, res) => {
  try {
    const { title, location, coordinates, difficulty, date, spotsLeft, imageUrl, description } =
      req.body;

    // Validation
    if (!title || !location || !date) {
      return res.status(400).json({
        message: "title, location and date are required.",
      });
    }

    // Validate difficulty range
    const difficultyNum = Number(difficulty);
    if (isNaN(difficultyNum) || difficultyNum < 1 || difficultyNum > 5) {
      return res.status(400).json({
        message: "Difficulty must be a number between 1 and 5.",
      });
    }

    // Validate date format
    const hikeDate = new Date(date);
    if (isNaN(hikeDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format." });
    }

    // Validate spotsLeft
    const spots = Number(spotsLeft);
    if (isNaN(spots) || spots < 0) {
      return res.status(400).json({
        message: "Spots left must be a non-negative number.",
      });
    }

    // Sanitize inputs
    const sanitizedTitle = title.trim();
    const sanitizedLocation = location.trim();
    const sanitizedDescription = description ? description.trim() : undefined;

    // Use authenticated user's information
    const hike = await Hike.create({
      userId: req.user._id,
      title: sanitizedTitle,
      location: sanitizedLocation,
      coordinates: coordinates || undefined,
      difficulty: difficultyNum,
      date: hikeDate,
      spotsLeft: spots || 0,
      imageUrl: imageUrl || undefined,
      description: sanitizedDescription,
    });

    res.status(201).json(hike);
  } catch (err) {
    console.error("Create hike error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({
        message: Object.values(err.errors)
          .map((e) => e.message)
          .join(", "),
      });
    }
    res.status(500).json({ message: "Unable to create hike." });
  }
});

// POST /api/hikes/:id/join - Join a hike
router.post("/:id/join", authenticateToken, async (req, res) => {
  try {
    const hikeId = req.params.id;
    const userId = req.user._id;

    const hike = await Hike.findById(hikeId);
    if (!hike) {
      return res.status(404).json({ message: "Hike not found." });
    }

    // Check if user already joined
    if (hike.participants && hike.participants.some(p => p.equals(userId))) {
      return res.status(400).json({ message: "You have already joined this hike." });
    }

    // Check spots availability
    if (hike.spotsLeft <= 0) {
      return res.status(400).json({ message: "No spots left for this hike." });
    }

    // Add user to participants and decrement spots
    hike.participants = hike.participants || [];
    hike.participants.push(userId);
    hike.spotsLeft -= 1;
    await hike.save();

    res.json({ message: "Successfully joined the hike!", hike });
  } catch (err) {
    console.error("Join hike error:", err);
    res.status(500).json({ message: "Unable to join hike." });
  }
});

// POST /api/hikes/:id/leave - Leave a hike
router.post("/:id/leave", authenticateToken, async (req, res) => {
  try {
    const hikeId = req.params.id;
    const userId = req.user._id;

    const hike = await Hike.findById(hikeId);
    if (!hike) {
      return res.status(404).json({ message: "Hike not found." });
    }

    // Check if user is a participant
    if (!hike.participants || !hike.participants.some(p => p.equals(userId))) {
      return res.status(400).json({ message: "You are not a participant of this hike." });
    }

    // Remove user from participants and increment spots
    hike.participants = hike.participants.filter(p => !p.equals(userId));
    hike.spotsLeft += 1;
    await hike.save();

    res.json({ message: "Successfully left the hike!", hike });
  } catch (err) {
    console.error("Leave hike error:", err);
    res.status(500).json({ message: "Unable to leave hike." });
  }
});

module.exports = router;
