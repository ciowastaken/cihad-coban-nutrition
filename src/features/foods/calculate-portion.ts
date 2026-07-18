import type {
  FoodSearchResult,
  PortionNutrition,
} from "./types";

export function calculatePortionNutrition(
  food: FoodSearchResult,
  portionGrams: number,
): PortionNutrition {
  const multiplier = portionGrams / 100;

  return {
    calories: Math.round(food.caloriesPer100g * multiplier),
    proteinGrams: roundOne(food.proteinPer100g * multiplier),
    carbohydrateGrams: roundOne(
      food.carbohydratePer100g * multiplier,
    ),
    fatGrams: roundOne(food.fatPer100g * multiplier),
  };
}

function roundOne(value: number) {
  return Math.round(value * 10) / 10;
}
