import type {
  DailyNutritionTotals,
  MealEntry,
  MealType,
} from "./types";

export const MEAL_STORAGE_KEY = "cc-nutrition-meals";

export const mealTypeLabels: Record<MealType, string> = {
  breakfast: "Kahvaltı",
  lunch: "Öğle yemeği",
  dinner: "Akşam yemeği",
  snack: "Ara öğün",
};

export function getLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function readMeals(): MealEntry[] {
  const storedMeals = localStorage.getItem(MEAL_STORAGE_KEY);

  if (!storedMeals) return [];

  try {
    const parsed = JSON.parse(storedMeals) as unknown;
    return Array.isArray(parsed) ? (parsed as MealEntry[]) : [];
  } catch {
    return [];
  }
}

export function writeMeals(meals: MealEntry[]) {
  localStorage.setItem(MEAL_STORAGE_KEY, JSON.stringify(meals));
}

export function calculateDailyTotals(
  meals: MealEntry[],
): DailyNutritionTotals {
  return meals.reduce<DailyNutritionTotals>(
    (totals, meal) => ({
      calories: totals.calories + meal.calories,
      proteinGrams: totals.proteinGrams + meal.proteinGrams,
      carbohydrateGrams:
        totals.carbohydrateGrams + meal.carbohydrateGrams,
      fatGrams: totals.fatGrams + meal.fatGrams,
    }),
    {
      calories: 0,
      proteinGrams: 0,
      carbohydrateGrams: 0,
      fatGrams: 0,
    },
  );
}
