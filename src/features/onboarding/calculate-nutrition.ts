import type {
  ActivityLevel,
  Goal,
  NutritionResult,
  OnboardingFormData,
} from "./types";

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  "very-active": 1.9,
};

const goalAdjustments: Record<Goal, number> = {
  lose: -350,
  maintain: 0,
  gain: 300,
};

export function calculateNutrition(
  formData: OnboardingFormData,
): NutritionResult {
  const age = Number(formData.age);
  const heightCm = Number(formData.heightCm);
  const weightKg = Number(formData.weightKg);

  const genderAdjustment = formData.gender === "male" ? 5 : -161;

  const bmr =
    10 * weightKg + 6.25 * heightCm - 5 * age + genderAdjustment;

  const maintenanceCalories =
    bmr * activityMultipliers[formData.activityLevel];

  const targetCalories = Math.max(
    1200,
    maintenanceCalories + goalAdjustments[formData.goal],
  );

  const proteinMultiplier =
    formData.goal === "gain"
      ? 1.8
      : formData.goal === "lose"
        ? 1.7
        : 1.6;

  const proteinGrams = weightKg * proteinMultiplier;
  const fatGrams = weightKg * 0.8;

  const proteinCalories = proteinGrams * 4;
  const fatCalories = fatGrams * 9;

  const carbohydrateGrams = Math.max(
    0,
    (targetCalories - proteinCalories - fatCalories) / 4,
  );

  return {
    bmr: Math.round(bmr),
    maintenanceCalories: Math.round(maintenanceCalories),
    targetCalories: Math.round(targetCalories),
    proteinGrams: Math.round(proteinGrams),
    fatGrams: Math.round(fatGrams),
    carbohydrateGrams: Math.round(carbohydrateGrams),
  };
}
