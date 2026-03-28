import { API_BASE_URL } from "../config/env";

export type HotelPackage = {
  _id: string;
  hotelId: string;
  name: string;
  description?: string;
  roomType: "single" | "double" | "twin" | "suite" | "deluxe";
  pricePerNight: number;
  currency: string;
  capacity: number;
  amenities: string[];
  image?: string;
  availableRooms: number;
  maxStayNights?: number;
  minStayNights: number;
  cancellationPolicy: "free" | "partial" | "non-refundable";
};

export type Hotel = {
  _id: string;
  name: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  description?: string;
  contactPhone?: string;
  email?: string;
  website?: string;
  imageUrl?: string;
  rating: number;
  reviewCount: number;
  amenities: string[];
  packages: HotelPackage[];
};

export type Hike = {
  _id: string;
  title: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  startPoint?: { lat: number; lng: number };
  endPoint?: { lat: number; lng: number };
  difficulty: number;
  date: string;
  spotsLeft: number;
  imageUrl?: string;
  description?: string;
  participants?: string[];
  hotels?: Hotel[];
  createdAt?: string;
  updatedAt?: string;
};

export type HotelBooking = {
  _id: string;
  userId: string;
  hikeId: string;
  hotelId: string;
  packageId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfRooms: number;
  numberOfNights: number;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  specialRequests?: string;
  status: "pending" | "confirmed" | "cancelled";
  bookingReference: string;
  paymentStatus: "unpaid" | "partial" | "paid";
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const getHikes = async (): Promise<Hike[]> => {
  const res = await fetch(`${API_BASE_URL}/api/hikes`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Unable to fetch hikes.");
  return data.hikes || data;
};

export const getUpcomingHikes = async (limit = 3): Promise<Hike[]> => {
  const res = await fetch(`${API_BASE_URL}/api/hikes?limit=${limit * 5}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Unable to fetch hikes.");
  const now = new Date();
  const upcoming = (data.hikes || []).filter((h: Hike) => new Date(h.date) >= now);
  upcoming.sort((a: Hike, b: Hike) => new Date(a.date).getTime() - new Date(b.date).getTime());
  return upcoming.slice(0, limit);
};

export const getRecommendedHikes = async (token: string): Promise<Hike[]> => {
  const res = await fetch(`${API_BASE_URL}/api/hikes/recommended`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await res.json();
  console.log("[Hikes Service] getRecommendedHikes response status:", res.status);
  console.log("[Hikes Service] getRecommendedHikes response data:", data);

  if (!res.ok) {
    throw new Error(data?.message || "Unable to fetch recommended hikes.");
  }

  console.log("[Hikes Service] Returning", data.hikes?.length, "recommended hikes");
  return data.hikes || [];
};

export const getHike = async (id: string): Promise<Hike> => {
  const res = await fetch(`${API_BASE_URL}/api/hikes/${id}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Unable to fetch hike.");
  return data;
};

export type CreateHikePayload = {
  title: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  startPoint?: { lat: number; lng: number };
  endPoint?: { lat: number; lng: number };
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

// Booking Service Functions
export const createBooking = async (payload: {
  hikeId: string;
  hotelId: string;
  packageId: string;
  checkInDate: string;
  checkOutDate: string;
  numberOfRooms: number;
  specialRequests?: string;
}, token: string): Promise<HotelBooking> => {
  const res = await fetch(`${API_BASE_URL}/api/bookings`, {
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
    try {
      const data = await res.json();
      throw new Error(data?.message || "Unable to create booking.");
    } catch (e) {
      if (e instanceof Error && e.message.includes('AUTH_EXPIRED')) throw e;
      throw new Error("Unable to create booking.");
    }
  }

  const data = await res.json();
  return data.booking;
};

export const getUserBookings = async (token: string): Promise<HotelBooking[]> => {
  const res = await fetch(`${API_BASE_URL}/api/bookings`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("travelBuddyToken");
      throw new Error("AUTH_EXPIRED");
    }
    throw new Error("Unable to fetch bookings.");
  }

  const data = await res.json();
  return data.bookings || [];
};

export const getBooking = async (bookingId: string, token: string): Promise<HotelBooking> => {
  const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("travelBuddyToken");
      throw new Error("AUTH_EXPIRED");
    }
    throw new Error("Unable to fetch booking.");
  }

  return await res.json();
};

export const cancelBooking = async (bookingId: string, token: string): Promise<HotelBooking> => {
  const res = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      localStorage.removeItem("travelBuddyToken");
      throw new Error("AUTH_EXPIRED");
    }
    throw new Error("Unable to cancel booking.");
  }

  const data = await res.json();
  return data.booking;
};
export type SiteStats = {
  hikeCount: number;
  userCount: number;
  photoCount: number;
  upcomingHikes: number;
};

export const getSiteStats = async (): Promise<SiteStats> => {
  const res = await fetch(`${API_BASE_URL}/api/stats`);
  if (!res.ok) throw new Error("Failed to fetch stats");
  return res.json();
};