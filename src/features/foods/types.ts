export type FoodSource = "local" | "openfoodfacts";

export type FoodSearchResult = {
  id: string;
  name: string;
  brand?: string;
  source: FoodSource;
  sourceLabel: string;
  servingLabel: string;
  defaultServingGrams: number;
  caloriesPer100g: number;
  proteinPer100g: number;
  carbohydratePer100g: number;
  fatPer100g: number;
};

export type PortionNutrition = {
  calories: number;
  proteinGrams: number;
  carbohydrateGrams: number;
  fatGrams: number;
};
