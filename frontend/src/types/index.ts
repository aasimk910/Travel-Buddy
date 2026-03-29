// frontend/src/types/index.ts
// Centralised TypeScript interfaces for the Travel Buddy application.

// ─── Auth / User ────────────────────────────────────────────────────────────

export type HikingProfile = {
  experienceLevel?: "beginner" | "intermediate" | "advanced";
  fitnessLevel?: "low" | "medium" | "high";
  preferredDifficulty?: number;
  preferredRegion?: string;
  preferredSeason?: "spring" | "summer" | "autumn" | "winter";
  tripGoal?: "scenic" | "challenge" | "social" | "photography";
  hikeDuration?: "half-day" | "full-day" | "multi-day";
  groupPreference?: "solo" | "small-group" | "large-group";
  maxBudgetPerDay?: number;
  accommodationPreference?: "basic" | "comfortable" | "luxury";
  wantsGuide?: boolean;
  medicalConsiderations?: string;
};

export type AuthUser = {
  id?: string;
  name: string;
  email: string;
  age?: number;
  country?: string;
  travelStyle?: string;
  budgetRange?: string;
  interests?: string;
  avatarUrl?: string;
  provider?: "password" | "google";
  role?: "user" | "admin";
  onboardingCompleted?: boolean;
  hikingProfile?: HikingProfile | null;
};

export type AuthResponse = {
  token?: string;
  user?: AuthUser;
  message?: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type SignupPayload = {
  recaptchaToken: string;
  name: string;
  email: string;
  password: string;
  country?: string;
  travelStyle?: string;
  budgetRange?: string;
  interests?: string;
};

// ─── Hotels & Packages ──────────────────────────────────────────────────────

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

// ─── Hikes ──────────────────────────────────────────────────────────────────

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

// ─── Bookings ───────────────────────────────────────────────────────────────

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

// ─── Expenses ───────────────────────────────────────────────────────────────

export type ExpenseParticipant = {
  userId: string;
  name: string;
  share: number;
  amount: number;
};

export type Expense = {
  _id: string;
  hikeId: string;
  description: string;
  amount: number;
  category: string;
  paidBy: {
    userId: string;
    name: string;
  };
  splitType: "equal" | "shares" | "custom";
  participants: ExpenseParticipant[];
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type ExpenseSettlement = {
  userId: string;
  name: string;
  paid: number;
  owes: number;
  balance: number;
};

export type ExpenseSummary = {
  totalExpenses: number;
  expenseCount: number;
  categoryTotals: Record<string, number>;
  settlements: ExpenseSettlement[];
};

// ─── Photos ─────────────────────────────────────────────────────────────────

export type PhotoItem = {
  _id: string;
  userName: string;
  caption?: string;
  images?: string[];
  imageData?: string;
  createdAt?: string;
};

// ─── Reviews ────────────────────────────────────────────────────────────────

export type Review = {
  _id: string;
  userId: string;
  userName: string;
  locationName: string;
  rating: number;
  comment?: string;
  createdAt: string;
};

// ─── Itinerary ──────────────────────────────────────────────────────────────

export type ItineraryRequest = {
  destination?: string;
  startDate?: string;
  endDate?: string;
  budget?: string;
  travelStyle?: string;
  interests?: string;
  additionalNotes?: string;
  startingLocation?: string;
  customPrompt?: string;
};

export type ItineraryDetails = {
  destination: string;
  startDate: string;
  endDate: string;
  days: number;
  budget?: string;
  travelStyle?: string;
};

export type ItineraryResponse = {
  success: boolean;
  itinerary: string;
  details: ItineraryDetails;
};

// ─── Payments ───────────────────────────────────────────────────────────────

export type KhaltiPaymentPayload = {
  amount: number;
  orderId: string;
  orderName: string;
  returnUrl: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

export type KhaltiPaymentResponse = {
  pidx: string;
  payment_url: string;
  expires_at: string;
  expires_in: number;
};

// ─── Pagination ─────────────────────────────────────────────────────────────

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  pages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: PaginationMeta;
};
