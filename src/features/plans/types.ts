export type DietPlanMeal = {
  title: string;
  time: string;
  foods: string[];
  calories: number;
  alternative: string;
};

export type DietPlan = {
  id: string;
  title: string;
  createdAt: string;
  targetCalories: number;
  summary: string;
  meals: DietPlanMeal[];
};
