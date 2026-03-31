// frontend/src/services/onboarding.ts
// API client for saving the user's hiking onboarding preferences.
// #region Imports
import { API_BASE_URL } from "../config/env";
import type { AuthUser } from "../context/AuthContext";

// #endregion Imports
export type OnboardingPayload = {
  experienceLevel: "beginner" | "intermediate" | "advanced";
  fitnessLevel: "low" | "medium" | "high";
  preferredDifficulty: number;
  preferredRegion: string;
  preferredSeason: "spring" | "summer" | "autumn" | "winter";
  tripGoal: "scenic" | "challenge" | "social" | "photography";
  hikeDuration: "half-day" | "full-day" | "multi-day";
  groupPreference: "solo" | "small-group" | "large-group";
  maxBudgetPerDay: number;
  accommodationPreference: "basic" | "comfortable" | "luxury";
  wantsGuide: boolean;
  medicalConsiderations?: string;
};

type OnboardingResponse = {
  message?: string;
  user?: AuthUser;
};

export const completeOnboarding = async (
  payload: OnboardingPayload,
  token: string
): Promise<OnboardingResponse> => {
  console.log("[OnboardingService] Sending payload to /api/users/onboarding:", payload);
  
  const res = await fetch(`${API_BASE_URL}/api/users/onboarding`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json()) as OnboardingResponse & { message?: string };
  
  console.log("[OnboardingService] Response status:", res.status);
  console.log("[OnboardingService] Response data:", data);
  
  if (!res.ok) {
    console.error("[OnboardingService] Error response:", data?.message);
    throw new Error(data?.message || "Unable to save onboarding answers.");
  }

  console.log("[OnboardingService] Onboarding saved successfully");
  return data;
};
