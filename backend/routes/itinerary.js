// backend/routes/itinerary.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const OpenAI = require("openai");

/**
 * POST /api/itinerary/generate
 * Generate an itinerary using Mistral-7B-Instruct-v0.2 via Hugging Face
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
    } = req.body;

    // Validate required fields
    if (!destination || !startDate || !endDate) {
      return res.status(400).json({
        error: "Destination, start date, and end date are required",
      });
    }

    // Calculate number of days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    // Check if HF API key is available
    const useAI = process.env.HF_TOKEN && process.env.HF_TOKEN !== '';
    
    let itinerary;
    
    if (useAI) {
      try {
        // Initialize OpenAI client for Hugging Face
        const client = new OpenAI({
          baseURL: "https://router.huggingface.co/v1",
          apiKey: process.env.HF_TOKEN,
        });

        // Build the prompt for Mistral
        const prompt = `You are an enthusiastic travel assistant. Create a FUN, ENGAGING, and COMPLETE ROUND-TRIP ${days}-day travel itinerary ${startingLocation ? `starting and ending at ${startingLocation}` : ''} for the EXACT destination: "${destination}".

CRITICAL INSTRUCTIONS:
1. The destination is "${destination}" - do NOT confuse this with any other similar-sounding location
2. This must be a COMPLETE ROUND TRIP itinerary:
   ${startingLocation ? `- START: Day 1 begins at ${startingLocation}` : '- START: Day 1 begins at the starting point'}
   - JOURNEY: Include transportation from starting point to ${destination}
   - EXPLORE: Activities and sightseeing at ${destination}
   - RETURN: Include the return journey back to ${startingLocation ? startingLocation : 'starting point'}
   ${startingLocation ? `- END: Final day ends back at ${startingLocation}` : '- END: Final day ends back at starting point'}

Trip Details:
${startingLocation ? `Starting & Ending Location: ${startingLocation}` : ""}
Destination: ${destination}
Dates: ${startDate} to ${endDate} (${days} days total for complete round trip)
${budget ? `TOTAL BUDGET: ${budget} NPR (MUST stay within this budget for ALL expenses)` : ""}
${travelStyle ? `Travel Style: ${travelStyle}` : ""}
${interests ? `Interests: ${interests}` : ""}
${additionalNotes ? `Additional Notes: ${additionalNotes}` : ""}

IMPORTANT REQUIREMENTS:
1. All costs and prices MUST be in Nepali Rupees (NPR/Rs) - do NOT use USD ($) or any other currency
2. Include detailed transportation information for BOTH outbound and return journeys
3. Account for travel time in your day planning
4. CRITICAL: The itinerary MUST cover ALL ${days} days from Day 1 to Day ${days} - do NOT stop in the middle
5. COMPLETE THE ENTIRE ITINERARY - include every single day with full details
${budget ? `6. BUDGET CONSTRAINT: The TOTAL cost of the entire trip (transportation, accommodation, food, activities, and miscellaneous) MUST NOT EXCEED ${budget} NPR
   - Provide estimated costs in NPR for each category every day
   - Include a daily cost breakdown showing: Transportation, Accommodation, Food, Activities, Miscellaneous
   - At the end, provide a "TOTAL TRIP COST SUMMARY" that adds up all expenses and confirms it stays within ${budget} NPR
   - If the budget is tight, suggest budget-friendly options (local transportation, affordable guesthouses, street food)
   - If the budget is generous, suggest premium experiences while still respecting the limit
   - Be realistic with pricing based on actual costs in ${destination}` : "6. Provide estimated costs for transportation, accommodation, food, and activities in NPR"}

FORMATTING REQUIREMENTS - CLEAN AND PROFESSIONAL:
1. DO NOT use emojis anywhere in the itinerary
2. DO NOT use markdown formatting symbols like **, ##, ###, --, __, ~~, or any other markdown syntax
3. DO NOT use asterisks (*) or hashes (#) for formatting - use plain text only
4. Use clear section headers for:
   - Day numbers (e.g., "Day 1: Kathmandu to Nayapul")
   - Time of day (e.g., "Morning:", "Afternoon:", "Evening:")
   - Other sections (e.g., "Practical tips:", "Estimated cost for Day X:")
5. Use simple bullet points (•) or dashes (-) for lists
6. Use line breaks and spacing for better readability
7. Use enthusiastic but professional language
8. Include practical information and interesting facts about places

Please provide a comprehensive, WELL-FORMATTED, and PROFESSIONAL day-by-day itinerary that includes:
1. Day 1: Departure from ${startingLocation ? startingLocation : 'starting location'} and travel to ${destination}
2. Middle days: Morning, afternoon, and evening activities at ${destination}
   - Recommended places to visit
   - Local food suggestions with descriptions
   - Cultural experiences
3. Final day: Return journey from ${destination} back to ${startingLocation ? startingLocation : 'starting location'}
4. For ALL days: Transportation details, estimated costs in NPR, and practical tips

Make it informative, professional, and format it in a clear way with proper sections and spacing!`;


        // Call Hugging Face API with Mistral model
        const completion = await client.chat.completions.create({
          model: "mistralai/Mistral-7B-Instruct-v0.2",
          messages: [
            {
              role: "user",
              content: prompt
            }
          ],
          max_tokens: 16000,
          temperature: 0.3,
        });

        itinerary = completion.choices[0].message.content;
      } catch (aiError) {
        console.error("Mistral AI Error:", aiError.message);
        // Fall back to demo itinerary if AI fails
        itinerary = generateDemoItinerary(destination, days, budget, travelStyle, interests);
      }
    } else {
      // Generate demo itinerary when API key is not available
      itinerary = generateDemoItinerary(destination, days, budget, travelStyle, interests);
    }

    res.json({
      success: true,
      itinerary,
      details: {
        destination,
        startDate,
        endDate,
        days,
        budget,
        travelStyle,
      },
      isDemo: !useAI,
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
  
  itinerary += `NOTE: To get AI-powered personalized itineraries, please add a valid HF_TOKEN (Hugging Face token) to your .env file.\n`;
  
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
