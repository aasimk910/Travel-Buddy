// frontend/src/services/itinerary.ts
// #region Imports
import { API_BASE_URL } from "../config/env";

// #endregion Imports
interface ItineraryRequest {
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: string;
  travelStyle?: string;
  interests?: string;
  additionalNotes?: string;
  startingLocation?: string;
  customPrompt?: string;   // free-form mode
}

interface ItineraryResponse {
  success: boolean;
  itinerary: string;
  details: {
    destination: string;
    startDate: string;
    endDate: string;
    days: number;
    budget?: string;
    travelStyle?: string;
  };
}

export const generateItinerary = async (
  data: ItineraryRequest,
  token: string
): Promise<ItineraryResponse> => {
  const response = await fetch(`${API_BASE_URL}/api/itinerary/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("travelBuddyToken");
      throw new Error("AUTH_EXPIRED");
    }
    if (response.status === 429) {
      try {
        const err = await response.json();
        throw new Error(err.error || "Too many requests. Please wait a moment and try again.");
      } catch (e) {
        if (e instanceof Error && (e.message.includes('quota') || e.message.includes('API key') || e.message.includes('too many') || e.message.includes('Too many'))) throw e;
        throw new Error("Too many requests. Please wait a moment and try again.");
      }
    }
    try {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate itinerary");
    } catch (e) {
      if (e instanceof Error && e.message.includes('Too many requests')) throw e;
      throw new Error("Failed to generate itinerary");
    }
  }

  return response.json();
};
