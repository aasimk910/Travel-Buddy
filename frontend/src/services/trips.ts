// frontend/src/services/trips.ts
// API client for trip/hike join, leave, and user trip listing.
// #region Imports
import { API_BASE_URL } from "../config/env";
import { getToken, clearToken } from "./auth";

// #endregion Imports
export const getUserTrips = async () => {
  const token = getToken();
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
      clearToken();
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

// Handles joinTrip logic.
export const joinTrip = async (tripId: string) => {
  const token = getToken();
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
      clearToken();
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

// Handles leaveHike logic.
export const leaveHike = async (hikeId: string) => {
  const token = getToken();
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
      clearToken();
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
