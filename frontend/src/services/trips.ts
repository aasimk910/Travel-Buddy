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
    if (response.status === 401) {
      // Clear invalid token
      localStorage.removeItem("travelBuddyToken");
      throw new Error("AUTH_EXPIRED");
    }
    if (response.status === 429) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    }
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || "Unable to fetch user trips.");
    } catch (e) {
      throw new Error("Unable to fetch user trips.");
    }
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
    if (response.status === 401) {
      localStorage.removeItem("travelBuddyToken");
      throw new Error("AUTH_EXPIRED");
    }
    if (response.status === 429) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    }
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || "Unable to join trip.");
    } catch (e) {
      throw new Error("Unable to join trip.");
    }
  }

  return response.json();
};

export const leaveHike = async (hikeId: string) => {
  const token = localStorage.getItem("travelBuddyToken");
  if (!token) {
    throw new Error("No authentication token found.");
  }

  const response = await fetch(`${API_BASE_URL}/api/hikes/${hikeId}/leave`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      localStorage.removeItem("travelBuddyToken");
      throw new Error("AUTH_EXPIRED");
    }
    if (response.status === 429) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    }
    try {
      const errorData = await response.json();
      throw new Error(errorData.message || "Unable to leave hike.");
    } catch (e) {
      throw new Error("Unable to leave hike.");
    }
  }

  return response.json();
};
