// frontend/src/services/photos.ts
// API client for photo upload, listing, and deletion.
// #region Imports
import { getJson, postJson, deleteJson } from "../utils/http";

// #endregion Imports
export type PhotoItem = {
  _id: string;
  userName: string;
  caption?: string;
  images?: string[];
  imageData?: string;
  createdAt?: string;
};

export const getUserPhotos = async (userName: string): Promise<PhotoItem[]> => {
  const { res, data } = await getJson(
    `/api/photos?userName=${encodeURIComponent(userName)}`
  );
  if (!res.ok) throw new Error((data as any)?.message || "Unable to fetch photos.");
  return (data as any).photos || data;
};

export const getLatestPhotos = async (): Promise<PhotoItem[]> => {
  const { res, data } = await getJson(`/api/photos/latest`);
  if (!res.ok) throw new Error((data as any)?.message || "Unable to load photos.");
  const photosArray = Array.isArray(data)
    ? (data as any)
    : Array.isArray((data as any).photos)
    ? (data as any).photos
    : [];
  return photosArray as PhotoItem[];
};

// Handles uploadPhotos logic.
export const uploadPhotos = async (images: string[], caption?: string, token?: string) => {
  const { res, data } = await postJson(`/api/photos`, { images, caption }, token);
  if (!res.ok) throw new Error((data as any)?.message || "Unable to upload photo(s).");
  return data;
};

// Handles deletePhoto logic.
export const deletePhoto = async (id: string, token?: string) => {
  const { res, data } = await deleteJson(`/api/photos/${id}`, token);
  if (!res.ok) throw new Error((data as any)?.message || "Unable to delete photo.");
  return data;
};
