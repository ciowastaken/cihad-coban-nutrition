import type { SavedNutritionProfile } from "@/features/onboarding/types";

export type MealRoutine = "two-meals" | "three-meals" | "three-plus-snack" | "flexible";

export type ExtendedProfile = SavedNutritionProfile & {
  targetWeightKg?: string;
  dietaryPreference?: string;
  allergies?: string;
  dislikedFoods?: string;
  mealRoutine?: MealRoutine;
  skippedMeals?: string[];
  waterTargetLiters?: string;
  sleepHours?: string;
  budget?: "low" | "medium" | "flexible";
  cookingTime?: "quick" | "normal" | "flexible";
  updatedAt?: string;
};

export type WeightEntry = {
  id: string;
  weightKg: number;
  date: string;
};
