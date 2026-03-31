// frontend/src/services/reviews.ts
// API client for travel review CRUD (list all, latest, create).
// #region Imports
import { API_BASE_URL } from "../config/env";

// #endregion Imports
export type Review = {
  _id: string;
  userId: string;
  userName: string;
  locationName: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

export const getReviews = async (): Promise<Review[]> => {
  const res = await fetch(`${API_BASE_URL}/api/reviews`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Unable to fetch reviews.");
  return data;
};

export const submitReview = async (
  locationName: string,
  rating: number,
  comment: string | undefined,
  token: string
) => {
  const res = await fetch(`${API_BASE_URL}/api/reviews`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ locationName, rating, comment }),
  });
  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("travelBuddyToken");
      throw new Error("AUTH_EXPIRED");
    }
    if (res.status === 429) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    }
    try {
      const data = await res.json();
      throw new Error(data?.message || "Unable to submit review.");
    } catch (e) {
      if (e instanceof Error && e.message.includes('Too many requests')) throw e;
      throw new Error("Unable to submit review.");
    }
  }
  const data = await res.json();
  return data;
};
