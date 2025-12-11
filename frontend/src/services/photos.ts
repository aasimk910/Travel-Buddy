import { API_BASE_URL } from "../config/env";

export type PhotoItem = {
  _id: string;
  userName: string;
  caption?: string;
  images?: string[];
  imageData?: string;
  createdAt?: string;
};

export const getUserPhotos = async (userName: string): Promise<PhotoItem[]> => {
  const res = await fetch(
    `${API_BASE_URL}/api/photos?userName=${encodeURIComponent(userName)}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Unable to fetch photos.");
  return data.photos || data;
};

export const getLatestPhotos = async (): Promise<PhotoItem[]> => {
  const res = await fetch(`${API_BASE_URL}/api/photos/latest`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Unable to load photos.");
  const photosArray = Array.isArray(data) ? data : Array.isArray((data as any).photos) ? (data as any).photos : [];
  return photosArray;
};

export const uploadPhotos = async (images: string[], caption?: string, token?: string) => {
  const res = await fetch(`${API_BASE_URL}/api/photos`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: token ? `Bearer ${token}` : "",
    },
    body: JSON.stringify({ images, caption }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Unable to upload photo(s).");
  return data;
};

export const deletePhoto = async (id: string, token?: string) => {
  const res = await fetch(`${API_BASE_URL}/api/photos/${id}`, {
    method: "DELETE",
    headers: { Authorization: token ? `Bearer ${token}` : "" },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Unable to delete photo.");
  return data;
};
