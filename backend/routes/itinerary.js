// backend/routes/itinerary.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * POST /api/itinerary/generate
 * Generate an itinerary using Google Gemini
 */
router.post("/generate", authenticateToken, async (req, res) => {
  try {
    const {
      startingLocation,
      destination,
      startDate,
      endDate,
      budget,
      travelStyle,
      interests,
      additionalNotes,
      customPrompt,   // free-form mode: user wrote their own request
    } = req.body;

    // In custom-prompt mode only a non-empty prompt is required
    if (customPrompt) {
      if (typeof customPrompt !== 'string' || !customPrompt.trim()) {
        return res.status(400).json({ error: "Custom prompt must not be empty." });
      }
    } else {
      // Guided-form mode: destination + dates are required
      if (!destination || !startDate || !endDate) {
        return res.status(400).json({
          error: "Destination, start date, and end date are required",
        });
      }
    }

    // Calculate number of days (only relevant in guided mode)
    const start = startDate ? new Date(startDate) : null;
    const end   = endDate   ? new Date(endDate)   : null;
    const days  = start && end
      ? Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1
      : null;

    // Check if Gemini API key is available
    const useAI = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== '';

    let itinerary;

    if (useAI) {
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        let systemPrompt;
        let userMessage;

        if (customPrompt) {
          // ── Custom / Free-form mode ───────────────────────────────────────
          // Minimal system prompt: persona + formatting only.
          // Everything else comes from the user's own text.
          systemPrompt = [
            `You are an expert travel planner specialising in Nepal and South Asian destinations.`,
            `You create detailed, enthusiastic, professionally formatted travel itineraries.`,
            ``,
            `FORMATTING RULES:`,
            `- Respond in clear, well-structured plain text — no markdown, no asterisks, no hashes.`,
            `- Use section headers like "Day 1: Title", "Morning:", "Afternoon:", "Evening:", "Estimated Cost:".`,
            `- Use bullet points with • or dashes for lists.`,
            `- Never use emojis.`,
            `- All prices and costs MUST be in Nepali Rupees (NPR / Rs). Never use USD or any other currency.`,
            `- Be enthusiastic yet professional. Include interesting facts, local tips, and cultural notes.`,
          ].join('\n');

          userMessage = customPrompt.trim();

        } else {
          // ── Guided / Structured mode ──────────────────────────────────────
          // Dynamic system prompt built from all form fields.
          systemPrompt = [
            `You are an expert travel planner specialising in Nepal and South Asian hiking destinations.`,
            `You create detailed, enthusiastic, professionally formatted round-trip travel itineraries.`,
            ``,
            `PERSONA RULES:`,
            `- Always respond in clear, well-structured plain text — no markdown, no asterisks, no hashes.`,
            `- Use section headers like "Day 1: Title", "Morning:", "Afternoon:", "Evening:", "Estimated Cost for Day X:".`,
            `- Use bullet points with • or dashes for lists.`,
            `- Never use emojis.`,
            `- All prices and costs MUST be in Nepali Rupees (NPR / Rs). Never use USD or any other currency.`,
            `- Be enthusiastic yet professional. Include interesting facts, local tips, and cultural notes.`,
            ``,
            `TRIP CONTEXT:`,
            `- Trip type: Complete round-trip${startingLocation ? ` starting and ending at ${startingLocation}` : ''}.`,
            `- Total duration: ${days} day${days > 1 ? 's' : ''} (${startDate} to ${endDate}).`,
            `- Destination: ${destination}.`,
            startingLocation ? `- Starting & ending point: ${startingLocation}.` : '',
            travelStyle ? `- Travel style preference: ${travelStyle}.` : '',
            interests  ? `- Traveller interests: ${interests}.` : '',
            budget
              ? [
                  `- TOTAL BUDGET: ${budget} NPR for ALL expenses combined.`,
                  `  * Provide a daily cost breakdown every day: Transportation, Accommodation, Food, Activities, Miscellaneous.`,
                  `  * End the itinerary with a "TOTAL TRIP COST SUMMARY" confirming the total stays within ${budget} NPR.`,
                  `  * Suggest budget-friendly options when the budget is tight; premium upgrades when it is generous.`,
                  `  * Use realistic local pricing for ${destination}.`,
                ].join('\n')
              : `- No fixed budget. Provide estimated NPR costs for transportation, accommodation, food, and activities each day.`,
            additionalNotes ? `- Additional traveller notes: ${additionalNotes}.` : '',
            ``,
            `STRUCTURE RULES:`,
            `- Day 1 MUST cover departure from ${startingLocation || 'starting location'} and travel to ${destination}.`,
            `- Middle days cover activities, sightseeing, food, and cultural experiences AT ${destination}.`,
            `- Final day (Day ${days}) MUST cover the return journey back to ${startingLocation || 'starting location'}.`,
            `- Every single day from Day 1 to Day ${days} MUST be fully written — never stop early.`,
            `- Include transportation details (bus/taxi/flight) for both the outbound and return legs.`,
          ].filter(Boolean).join('\n');

          userMessage =
            `Please generate my complete ${days}-day round-trip travel itinerary to ${destination}` +
            (startingLocation ? ` starting and ending at ${startingLocation}` : '') +
            (budget ? `, keeping the total budget within ${budget} NPR` : '') +
            `. Cover every day in full detail including morning, afternoon, and evening sections with ` +
            `transportation info, accommodation, food recommendations, activities, and estimated costs in NPR.`;
        }

        // Try models in order — continue on ANY error so a bad model name or
        // a quota failure on one model doesn't kill the whole request.
        const MODELS_TO_TRY = [
          "gemini-2.0-flash-lite",
          "gemini-2.0-flash",
          "gemini-1.5-flash",
          "gemini-1.5-flash-8b",
        ];

        let lastError = null;
        for (const modelName of MODELS_TO_TRY) {
          try {
            const model = genAI.getGenerativeModel({
              model: modelName,
              systemInstruction: systemPrompt,
              generationConfig: { temperature: 0.4, maxOutputTokens: 8192 },
            });
            const result = await model.generateContent(userMessage);
            itinerary = result.response.text();
            console.log(`Itinerary generated with model: ${modelName}`);
            lastError = null;
            break; // success — stop trying
          } catch (modelErr) {
            console.warn(`Model ${modelName} failed: ${modelErr.message}`);
            lastError = modelErr;
            continue; // always try the next model
          }
        }

        if (lastError) {
          console.error("All models failed. Last error:", lastError.message);
          const isQuota = lastError.message && (
            lastError.message.includes("429") ||
            lastError.message.includes("quota") ||
            lastError.message.includes("RESOURCE_EXHAUSTED")
          );
          return res.status(isQuota ? 429 : 500).json({
            error: isQuota
              ? "All Gemini AI models have exceeded their free-tier quota. Please create a new API key at https://aistudio.google.com/app/apikey and update GEMINI_API_KEY in backend/.env."
              : "AI generation failed: " + lastError.message,
          });
        }
      } catch (aiError) {
        console.error("Gemini AI Error:", aiError.message);
        if (aiError.message && (aiError.message.includes("429") || aiError.message.includes("quota"))) {
          return res.status(429).json({
            error: "AI service quota exceeded. Please try again later or refresh your API key.",
          });
        }
        return res.status(500).json({
          error: "AI generation failed: " + aiError.message,
        });
      }
    } else {
      // Generate demo itinerary when API key is not available
      if (customPrompt) {
        itinerary = `[DEMO MODE — No GEMINI_API_KEY configured]\n\nYour prompt:\n${customPrompt}\n\nAdd a valid GEMINI_API_KEY to backend/.env to get real AI-generated itineraries.`;
      } else {
        itinerary = generateDemoItinerary(destination, days, budget, travelStyle, interests);
      }
    }

    res.json({
      success: true,
      itinerary,
      details: {
        destination: destination || '(custom)',
        startDate,
        endDate,
        days,
        budget,
        travelStyle,
      },
      isDemo: !useAI,
      isCustom: !!customPrompt,
    });
  } catch (error) {
    console.error("Error generating itinerary:", error);
    
    res.status(500).json({
      error: "Failed to generate itinerary. Please try again.",
      details: error.message,
    });
  }
});

// Helper function to generate a demo itinerary
function generateDemoItinerary(destination, days, budget, travelStyle, interests) {
  let itinerary = `${days}-Day Adventure to ${destination}\n`;
  itinerary += `\nNOTE: This is a demo itinerary. AI model is currently unavailable.\n`;
  itinerary += `\n---\n\n`;
  itinerary += `Trip Overview\n\n`;
  
  if (budget) itinerary += `Total Budget: ${budget} NPR\n`;
  if (travelStyle) itinerary += `Travel Style: ${travelStyle}\n`;
  if (interests) itinerary += `Interests: ${interests}\n`;
  itinerary += `\n---\n\n`;
  
  // Calculate budget allocation if provided
  let totalCost = 0;
  let dailyBudget = 0;
  if (budget) {
    const budgetAmount = parseFloat(budget.replace(/[^0-9.]/g, ''));
    dailyBudget = Math.floor(budgetAmount / days);
  }
  
  for (let day = 1; day <= days; day++) {
    itinerary += `Day ${day}\n\n`;
    
    itinerary += `Morning (8:00 AM - 12:00 PM)\n`;
    itinerary += `• Start your day with breakfast at a local café\n`;
    itinerary += `• Visit the main attractions in ${destination}\n`;
    itinerary += `• Explore the local markets and street food scene\n\n`;
    
    itinerary += `Afternoon (12:00 PM - 5:00 PM)\n`;
    itinerary += `• Enjoy lunch at a recommended local restaurant\n`;
    itinerary += `• Take a guided tour or self-explore popular landmarks\n`;
    itinerary += `• Visit museums or cultural sites\n\n`;
    
    itinerary += `Evening (5:00 PM - 10:00 PM)\n`;
    itinerary += `• Watch the sunset from a scenic viewpoint\n`;
    itinerary += `• Dinner at a traditional restaurant\n`;
    itinerary += `• Optional: Experience local nightlife or cultural performances\n\n`;
    
    // Add cost breakdown if budget is specified
    if (budget && dailyBudget > 0) {
      const dayCost = calculateDayBudget(dailyBudget, travelStyle);
      totalCost += dayCost.total;
      
      itinerary += `Estimated Cost for Day ${day}:\n`;
      itinerary += `• Transportation: Rs ${dayCost.transport}\n`;
      itinerary += `• Accommodation: Rs ${dayCost.accommodation}\n`;
      itinerary += `• Food: Rs ${dayCost.food}\n`;
      itinerary += `• Activities: Rs ${dayCost.activities}\n`;
      itinerary += `• Miscellaneous: Rs ${dayCost.misc}\n`;
      itinerary += `• Day Total: Rs ${dayCost.total}\n\n`;
    }
    
    if (day < days) {
      itinerary += `---\n\n`;
    }
  }
  
  // Add total cost summary if budget is specified
  if (budget && totalCost > 0) {
    itinerary += `\nTOTAL TRIP COST SUMMARY:\n`;
    itinerary += `• Total Estimated Cost: Rs ${totalCost.toLocaleString()}\n`;
    itinerary += `• Your Budget: ${budget} NPR\n`;
    const remaining = parseFloat(budget.replace(/[^0-9.]/g, '')) - totalCost;
    if (remaining >= 0) {
      itinerary += `• Remaining Budget: Rs ${remaining.toLocaleString()}\n`;
      itinerary += `• Status: Within budget\n\n`;
    } else {
      itinerary += `• Over Budget By: Rs ${Math.abs(remaining).toLocaleString()}\n`;
      itinerary += `• Status: Consider adjusting for budget constraints\n\n`;
    }
  }
  
  itinerary += `\nPractical Tips:\n`;
  itinerary += `• Book accommodations in advance, especially during peak season\n`;
  itinerary += `• Carry local currency (NPR) for small purchases\n`;
  itinerary += `• Learn a few basic phrases in the local language\n`;
  itinerary += `• Respect local customs and dress codes\n`;
  itinerary += `• Stay hydrated and protect yourself from the sun\n\n`;
  
  itinerary += `Transportation:\n`;
  itinerary += `• Use local taxis or ride-sharing apps for convenience\n`;
  itinerary += `• Consider renting a bike or scooter for shorter distances\n`;
  itinerary += `• Public transportation is often the most economical option\n\n`;
  
  itinerary += `Food Recommendations:\n`;
  itinerary += `• Try authentic local cuisine at recommended restaurants\n`;
  itinerary += `• Don't miss the street food - it's often the best!\n`;
  itinerary += `• Ask locals for their favorite hidden gems\n\n`;
  
  itinerary += `NOTE: To get AI-powered personalized itineraries, please add a valid GEMINI_API_KEY to your .env file.\n`;
  
  return itinerary;
}

// Helper function to calculate daily budget breakdown
function calculateDayBudget(dailyBudget, travelStyle) {
  let multipliers = {
    budget: { transport: 0.15, accommodation: 0.35, food: 0.25, activities: 0.15, misc: 0.10 },
    balanced: { transport: 0.20, accommodation: 0.30, food: 0.25, activities: 0.15, misc: 0.10 },
    luxury: { transport: 0.15, accommodation: 0.40, food: 0.25, activities: 0.15, misc: 0.05 }
  };
  
  const style = travelStyle || 'balanced';
  const mult = multipliers[style] || multipliers.balanced;
  
  return {
    transport: Math.round(dailyBudget * mult.transport),
    accommodation: Math.round(dailyBudget * mult.accommodation),
    food: Math.round(dailyBudget * mult.food),
    activities: Math.round(dailyBudget * mult.activities),
    misc: Math.round(dailyBudget * mult.misc),
    total: dailyBudget
  };
}

module.exports = router;
