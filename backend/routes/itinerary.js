// backend/routes/itinerary.js
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { GoogleGenerativeAI } = require("@google/generative-ai");

/**
 * POST /api/itinerary/generate
 * Generate an itinerary using Google Gemini AI
 */
router.post("/generate", authenticateToken, async (req, res) => {
  try {
    const {
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

    // Check if Gemini API key is available
    const useGemini = process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== '';
    
    let itinerary;
    
    if (useGemini) {
      try {
        // Initialize Google Gemini AI
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        // Build the prompt for Gemini
        const prompt = `You are a helpful travel assistant. Create a detailed ${days}-day travel itinerary for ${destination}.

Trip Details:
- Dates: ${startDate} to ${endDate} (${days} days)
${budget ? `- Budget: ${budget}` : ""}
${travelStyle ? `- Travel Style: ${travelStyle}` : ""}
${interests ? `- Interests: ${interests}` : ""}
${additionalNotes ? `- Additional Notes: ${additionalNotes}` : ""}

Please provide a day-by-day itinerary that includes:
1. Morning, afternoon, and evening activities
2. Recommended places to visit
3. Local food suggestions
4. Transportation tips
5. Estimated costs (if budget is specified)
6. Practical tips and cultural insights

Format the response in a clear, organized manner with day headings and activity descriptions.`;

        // Call Gemini API
        const result = await model.generateContent(prompt);
        const response = await result.response;
        itinerary = response.text();
      } catch (geminiError) {
        console.error("Gemini Error:", geminiError.message);
        // Fall back to demo itinerary if Gemini fails
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
      isDemo: !useGemini,
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
  let itinerary = `🌍 ${days}-Day Itinerary for ${destination}\n`;
  itinerary += `\n📝 NOTE: This is a demo itinerary. Gemini API is currently unavailable.\n`;
  itinerary += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  if (budget) itinerary += `💰 Budget: ${budget}\n`;
  if (travelStyle) itinerary += `🎒 Travel Style: ${travelStyle}\n`;
  if (interests) itinerary += `❤️ Interests: ${interests}\n`;
  itinerary += `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
  
  for (let day = 1; day <= days; day++) {
    itinerary += `📅 DAY ${day}\n\n`;
    
    itinerary += `🌅 MORNING (8:00 AM - 12:00 PM)\n`;
    itinerary += `• Start your day with breakfast at a local café\n`;
    itinerary += `• Visit the main attractions in ${destination}\n`;
    itinerary += `• Explore the local markets and street food scene\n\n`;
    
    itinerary += `☀️ AFTERNOON (12:00 PM - 5:00 PM)\n`;
    itinerary += `• Enjoy lunch at a recommended local restaurant\n`;
    itinerary += `• Take a guided tour or self-explore popular landmarks\n`;
    itinerary += `• Visit museums or cultural sites\n\n`;
    
    itinerary += `🌆 EVENING (5:00 PM - 10:00 PM)\n`;
    itinerary += `• Watch the sunset from a scenic viewpoint\n`;
    itinerary += `• Dinner at a traditional restaurant\n`;
    itinerary += `• Optional: Experience local nightlife or cultural performances\n\n`;
    
    if (day < days) {
      itinerary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    }
  }
  
  itinerary += `\n💡 PRACTICAL TIPS:\n`;
  itinerary += `• Book accommodations in advance, especially during peak season\n`;
  itinerary += `• Carry local currency for small purchases\n`;
  itinerary += `• Learn a few basic phrases in the local language\n`;
  itinerary += `• Respect local customs and dress codes\n`;
  itinerary += `• Stay hydrated and protect yourself from the sun\n\n`;
  
  itinerary += `🚗 TRANSPORTATION:\n`;
  itinerary += `• Use local taxis or ride-sharing apps for convenience\n`;
  itinerary += `• Consider renting a bike or scooter for shorter distances\n`;
  itinerary += `• Public transportation is often the most economical option\n\n`;
  
  itinerary += `🍽️ FOOD RECOMMENDATIONS:\n`;
  itinerary += `• Try authentic local cuisine at recommended restaurants\n`;
  itinerary += `• Don't miss the street food - it's often the best!\n`;
  itinerary += `• Ask locals for their favorite hidden gems\n\n`;
  
  itinerary += `⚠️ To get AI-powered personalized itineraries, please add a valid Gemini API key to your .env file.\n`;
  
  return itinerary;
}

module.exports = router;
