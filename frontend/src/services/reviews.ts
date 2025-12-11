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
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Unable to submit review.");
  return data;
};
