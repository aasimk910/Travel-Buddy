import { API_BASE_URL } from "../config/env";

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
