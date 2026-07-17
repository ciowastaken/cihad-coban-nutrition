"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { SmartFoodSearch } from "@/features/foods/SmartFoodSearch";
import type {
  FoodSearchResult,
  PortionNutrition,
} from "@/features/foods/types";
import {
  calculateDailyTotals,
  getLocalDateKey,
  mealTypeLabels,
  readMeals,
  writeMeals,
} from "@/features/meals/storage";
import type {
  MealEntry,
  MealType,
} from "@/features/meals/types";
import type { SavedNutritionProfile } from "@/features/onboarding/types";

const PROFILE_STORAGE_KEY = "cc-nutrition-profile";
const mealOrder: MealType[] = [
  "breakfast",
  "lunch",
  "dinner",
  "snack",
];

export default function DashboardPage() {
  const [profile, setProfile] =
    useState<SavedNutritionProfile | null>(null);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] =
    useState<MealType>("breakfast");

  const today = getLocalDateKey();

  useEffect(() => {
    const savedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);

    if (savedProfile) {
      try {
        setProfile(
          JSON.parse(savedProfile) as SavedNutritionProfile,
        );
      } catch {
        localStorage.removeItem(PROFILE_STORAGE_KEY);
      }
    }

    setMeals(readMeals());
    setLoaded(true);
  }, []);

  const todayMeals = useMemo(
    () => meals.filter((meal) => meal.date === today),
    [meals, today],
  );

  const totals = useMemo(
    () => calculateDailyTotals(todayMeals),
    [todayMeals],
  );

  function openSearch(mealType: MealType = "breakfast") {
    setSelectedMealType(mealType);
    setSearchOpen(true);
  }

  function addFood(data: {
    mealType: MealType;
    food: FoodSearchResult;
    portionGrams: number;
    nutrition: PortionNutrition;
  }) {
    const entry: MealEntry = {
      id: crypto.randomUUID(),
      date: today,
      mealType: data.mealType,
      foodName:
        data.food.brand
          ? `${data.food.name} — ${data.food.brand}`
          : data.food.name,
      portion: `${data.portionGrams} g`,
      calories: data.nutrition.calories,
      proteinGrams: data.nutrition.proteinGrams,
      carbohydrateGrams:
        data.nutrition.carbohydrateGrams,
      fatGrams: data.nutrition.fatGrams,
      createdAt: new Date().toISOString(),
    };

    const nextMeals = [...meals, entry];
    setMeals(nextMeals);
    writeMeals(nextMeals);
    setSearchOpen(false);
  }

  function deleteMeal(id: string) {
    const nextMeals = meals.filter((meal) => meal.id !== id);
    setMeals(nextMeals);
    writeMeals(nextMeals);
  }

  if (!loaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf7]">
        <p className="text-zinc-500">Panel hazırlanıyor...</p>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf7] px-5">
        <div className="max-w-lg rounded-4xl border border-zinc-200 bg-white p-8 text-center">
          <h1 className="text-3xl font-bold">
            Henüz planın bulunmuyor
          </h1>
          <Link
            href="/onboarding"
            className="mt-7 inline-flex rounded-2xl bg-emerald-600 px-6 py-4 font-semibold text-white"
          >
            Planımı oluştur
          </Link>
        </div>
      </main>
    );
  }

  const { formData, result } = profile;
  const percentage = Math.min(
    100,
    Math.round((totals.calories / result.targetCalories) * 100),
  );
  const remaining = result.targetCalories - totals.calories;

  return (
    <main className="min-h-screen bg-[#f7faf7] px-5 py-7 text-zinc-950 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-600 font-bold text-white">
              CC
            </div>
            <div>
              <p className="font-semibold">Cihad Çoban</p>
              <p className="text-xs text-zinc-500">Nutrition</p>
            </div>
          </Link>
          <Link
            href="/onboarding"
            className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold"
          >
            Bilgileri güncelle
          </Link>
        </header>

        <section className="py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Bugünün özeti
          </p>
          <h1 className="mt-3 text-4xl font-bold sm:text-5xl">
            Günaydın, {formData.name} 👋
          </h1>
          <p className="mt-4 text-lg text-zinc-600">
            Yediğin besini ara; kalori ve makroları sistem doldursun.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-4xl bg-zinc-950 p-7 text-white sm:p-9">
            <div className="flex justify-between gap-4">
              <div>
                <p className="text-sm text-zinc-400">
                  Günlük tüketim
                </p>
                <p className="mt-3 text-5xl font-bold">
                  {totals.calories}
                  <span className="ml-2 text-base font-normal text-zinc-400">
                    / {result.targetCalories} kcal
                  </span>
                </p>
              </div>
              <span className="rounded-full bg-white/10 px-4 py-2 text-sm">
                %{percentage}
              </span>
            </div>

            <div className="mt-7 h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-emerald-400"
                style={{ width: `${percentage}%` }}
              />
            </div>

            <p className="mt-4 text-sm text-zinc-400">
              {remaining >= 0
                ? `${remaining} kcal hakkın kaldı.`
                : `Hedefini ${Math.abs(remaining)} kcal aştın.`}
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {[
                ["Protein", totals.proteinGrams, result.proteinGrams],
                [
                  "Karbonhidrat",
                  totals.carbohydrateGrams,
                  result.carbohydrateGrams,
                ],
                ["Yağ", totals.fatGrams, result.fatGrams],
              ].map(([label, consumed, target]) => (
                <div
                  key={String(label)}
                  className="rounded-2xl bg-white/10 p-5"
                >
                  <p className="text-xs text-zinc-400">{label}</p>
                  <p className="mt-2 text-xl font-bold">
                    {consumed} g
                  </p>
                  <p className="mt-1 text-xs text-zinc-400">
                    Hedef: {target} g
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-4xl border border-emerald-200 bg-emerald-50 p-7">
            <p className="text-sm font-semibold text-emerald-800">
              Akıllı kayıt
            </p>
            <h2 className="mt-3 text-2xl font-bold">
              Makroları bilmen gerekmiyor
            </h2>
            <p className="mt-3 leading-7 text-emerald-900/75">
              Yemeğin adını yaz, doğru sonucu ve porsiyonu seç.
              Hesabı sistem yapar.
            </p>
          </div>
        </section>

        <section className="mt-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                Günlük öğünler
              </p>
              <h2 className="mt-2 text-3xl font-bold">
                Bugün ne yedin?
              </h2>
            </div>
            <button
              type="button"
              onClick={() => openSearch()}
              className="rounded-2xl bg-emerald-600 px-6 py-3.5 font-semibold text-white"
            >
              + Yiyecek ara
            </button>
          </div>

          {searchOpen && (
            <SmartFoodSearch
              key={selectedMealType}
              defaultMealType={selectedMealType}
              onAdd={addFood}
              onCancel={() => setSearchOpen(false)}
            />
          )}

          <div className="mt-6 space-y-5">
            {mealOrder.map((mealType) => {
              const matching = todayMeals.filter(
                (meal) => meal.mealType === mealType,
              );

              return (
                <article
                  key={mealType}
                  className="rounded-4xl border border-zinc-200 bg-white p-6 sm:p-8"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold">
                        {mealTypeLabels[mealType]}
                      </h3>
                      <p className="mt-1 text-sm text-zinc-500">
                        {matching.length
                          ? `${matching.reduce(
                              (sum, meal) =>
                                sum + meal.calories,
                              0,
                            )} kcal`
                          : "Henüz kayıt yok"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSearch(mealType)}
                      className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-semibold"
                    >
                      Ekle
                    </button>
                  </div>

                  {matching.length > 0 && (
                    <div className="mt-5 divide-y divide-zinc-100">
                      {matching.map((meal) => (
                        <div
                          key={meal.id}
                          className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div>
                            <p className="font-semibold">
                              {meal.foodName}
                            </p>
                            <p className="mt-1 text-sm text-zinc-500">
                              {meal.portion}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 text-sm">
                            <span>
                              <strong>{meal.calories} kcal</strong>
                              {" · "}P {meal.proteinGrams} g
                              {" · "}K {meal.carbohydrateGrams} g
                              {" · "}Y {meal.fatGrams} g
                            </span>
                            <button
                              type="button"
                              onClick={() => deleteMeal(meal.id)}
                              className="rounded-xl bg-red-50 px-3 py-2 text-xs font-semibold text-red-600"
                            >
                              Sil
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </article>
              );
            })}
          </div>
        </section>
      </div>
    </main>
  );
}
