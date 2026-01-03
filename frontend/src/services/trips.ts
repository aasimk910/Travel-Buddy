import { API_BASE_URL } from "../config/env";

export const getUserTrips = async () => {
  const token = localStorage.getItem("travelBuddyToken");
  if (!token) {
    throw new Error("No authentication token found.");
  }

  const response = await fetch(`${API_BASE_URL}/api/user-trips`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Unable to fetch user trips.");
  }

  return response.json();
};

export const joinTrip = async (tripId: string) => {
  const token = localStorage.getItem("travelBuddyToken");
  if (!token) {
    throw new Error("No authentication token found.");
  }

  const response = await fetch(`${API_BASE_URL}/api/trips/${tripId}/join`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || "Unable to join trip.");
  }

  return response.json();
};
