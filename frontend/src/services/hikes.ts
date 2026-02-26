import { API_BASE_URL } from "../config/env";

export type Hike = {
  _id: string;
  title: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  difficulty: number;
  date: string;
  spotsLeft: number;
  imageUrl?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const getHikes = async (): Promise<Hike[]> => {
  const res = await fetch(`${API_BASE_URL}/api/hikes`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Unable to fetch hikes.");
  return data.hikes || data;
};

export type CreateHikePayload = {
  title: string;
  location: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  date: string;
  difficulty: number;
  spotsLeft: number;
  imageUrl?: string;
  description?: string;
};

export const createHike = async (payload: CreateHikePayload, token: string) => {
  const res = await fetch(`${API_BASE_URL}/api/hikes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
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
      throw new Error(data?.message || "Unable to create hike.");
    } catch (e) {
      if (e instanceof Error && e.message.includes('Too many requests')) throw e;
      throw new Error("Unable to create hike.");
    }
  }
  const data = await res.json();
  return data;
};

export const joinHike = async (hikeId: string, token: string) => {
  const res = await fetch(`${API_BASE_URL}/api/hikes/${hikeId}/join`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
      throw new Error(data?.message || "Unable to join hike.");
    } catch (e) {
      if (e instanceof Error && e.message.includes('Too many requests')) throw e;
      throw new Error("Unable to join hike.");
    }
  }
  const data = await res.json();
  return data;
};
