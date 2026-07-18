import type { ExtendedProfile, WeightEntry } from "./types";

export const PROFILE_STORAGE_KEY = "cc-nutrition-profile";
export const WEIGHT_HISTORY_KEY = "cc-nutrition-weight-history";

export function readProfile(): ExtendedProfile | null {
  const value = localStorage.getItem(PROFILE_STORAGE_KEY);
  if (!value) return null;
  try {
    return JSON.parse(value) as ExtendedProfile;
  } catch {
    return null;
  }
}

export function writeProfile(profile: ExtendedProfile) {
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export function readWeightHistory(): WeightEntry[] {
  const value = localStorage.getItem(WEIGHT_HISTORY_KEY);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as WeightEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeWeightHistory(entries: WeightEntry[]) {
  localStorage.setItem(WEIGHT_HISTORY_KEY, JSON.stringify(entries));
}
