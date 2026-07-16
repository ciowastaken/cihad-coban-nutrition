export type Gender = "male" | "female";

export type Goal = "lose" | "maintain" | "gain";

export type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very-active";

export type OnboardingFormData = {
  name: string;
  age: string;
  gender: Gender;
  heightCm: string;
  weightKg: string;
  goal: Goal;
  activityLevel: ActivityLevel;
};

export type NutritionResult = {
  bmr: number;
  maintenanceCalories: number;
  targetCalories: number;
  proteinGrams: number;
  fatGrams: number;
  carbohydrateGrams: number;
};

export type SavedNutritionProfile = {
  formData: OnboardingFormData;
  result: NutritionResult;
  createdAt: string;
};
