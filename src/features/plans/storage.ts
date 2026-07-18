import type { DietPlan } from "./types";

export const PLAN_STORAGE_KEY = "cc-nutrition-plans";

export function readPlans(): DietPlan[] {
  const value = localStorage.getItem(PLAN_STORAGE_KEY);
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as DietPlan[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writePlans(plans: DietPlan[]) {
  localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify(plans));
}
