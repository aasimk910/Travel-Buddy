// frontend/src/services/itinerary.ts
import { API_BASE_URL } from "../config/env";

interface ItineraryRequest {
  destination: string;
  startDate: string;
  endDate: string;
  budget?: string;
  travelStyle?: string;
  interests?: string;
  additionalNotes?: string;
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
    const error = await response.json();
    throw new Error(error.error || "Failed to generate itinerary");
  }

  return response.json();
};
