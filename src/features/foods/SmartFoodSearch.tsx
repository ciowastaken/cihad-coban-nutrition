"use client";

import { FormEvent, useMemo, useState } from "react";

import { calculatePortionNutrition } from "./calculate-portion";
import type {
  FoodSearchResult,
  PortionNutrition,
} from "./types";
import type { MealType } from "@/features/meals/types";
import { mealTypeLabels } from "@/features/meals/storage";

type Props = {
  defaultMealType: MealType;
  onAdd: (data: {
    mealType: MealType;
    food: FoodSearchResult;
    portionGrams: number;
    nutrition: PortionNutrition;
  }) => void;
  onCancel: () => void;
};

export function SmartFoodSearch({
  defaultMealType,
  onAdd,
  onCancel,
}: Props) {
  const [mealType, setMealType] =
    useState<MealType>(defaultMealType);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FoodSearchResult[]>([]);
  const [selectedFood, setSelectedFood] =
    useState<FoodSearchResult | null>(null);
  const [portionGrams, setPortionGrams] = useState("100");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const nutrition = useMemo(() => {
    if (!selectedFood) return null;

    return calculatePortionNutrition(
      selectedFood,
      Number(portionGrams) || 0,
    );
  }, [selectedFood, portionGrams]);

  async function handleSearch(event: FormEvent) {
    event.preventDefault();

    if (query.trim().length < 2) {
      setError("En az iki karakter yaz.");
      return;
    }

    setLoading(true);
    setError("");
    setSelectedFood(null);

    try {
      const response = await fetch(
        `/api/foods/search?q=${encodeURIComponent(query.trim())}`,
      );

      const data = (await response.json()) as {
        results?: FoodSearchResult[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Arama başarısız oldu.");
      }

      setResults(data.results ?? []);

      if (!data.results?.length) {
        setError(
          "Eşleşme bulunamadı. Daha açık bir isim veya ürün markası yaz.",
        );
      }
    } catch (searchError) {
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Arama sırasında hata oluştu.",
      );
    } finally {
      setLoading(false);
    }
  }

  function chooseFood(food: FoodSearchResult) {
    setSelectedFood(food);
    setPortionGrams(String(food.defaultServingGrams));
    setError("");
  }

  function submitFood() {
    const grams = Number(portionGrams);

    if (
      !selectedFood ||
      !nutrition ||
      !Number.isFinite(grams) ||
      grams <= 0 ||
      grams > 5000
    ) {
      setError("Geçerli bir yiyecek ve porsiyon seç.");
      return;
    }

    onAdd({
      mealType,
      food: selectedFood,
      portionGrams: grams,
      nutrition,
    });
  }

  return (
    <div className="mt-6 rounded-4xl border border-zinc-200 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-8">
      <div className="grid gap-5 md:grid-cols-[0.35fr_0.65fr]">
        <label>
          <span className="mb-2 block text-sm font-semibold">
            Öğün
          </span>
          <select
            value={mealType}
            onChange={(event) =>
              setMealType(event.target.value as MealType)
            }
            className={inputClass}
          >
            {Object.entries(mealTypeLabels).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </select>
        </label>

        <form onSubmit={handleSearch}>
          <span className="mb-2 block text-sm font-semibold">
            Ne yedin?
          </span>
          <div className="flex gap-3">
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Örn. kaşarlı tost, tavuklu pilav, Sütaş yoğurt"
              className={inputClass}
            />
            <button
              type="submit"
              disabled={loading}
              className="rounded-2xl bg-emerald-600 px-6 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Aranıyor..." : "Ara"}
            </button>
          </div>
        </form>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {error}
        </div>
      )}

      {results.length > 0 && !selectedFood && (
        <div className="mt-6 grid gap-3 md:grid-cols-2">
          {results.map((food) => (
            <button
              key={food.id}
              type="button"
              onClick={() => chooseFood(food)}
              className="rounded-2xl border border-zinc-200 p-5 text-left transition hover:border-emerald-400 hover:bg-emerald-50/50"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-bold">{food.name}</p>
                  {food.brand && (
                    <p className="mt-1 text-sm text-zinc-500">
                      {food.brand}
                    </p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
                  {Math.round(food.caloriesPer100g)} kcal / 100 g
                </span>
              </div>
              <p className="mt-3 text-xs text-zinc-400">
                Kaynak: {food.sourceLabel}
              </p>
            </button>
          ))}
        </div>
      )}

      {selectedFood && nutrition && (
        <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-emerald-700">
                Seçilen yiyecek
              </p>
              <h3 className="mt-2 text-2xl font-bold">
                {selectedFood.name}
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                {selectedFood.brand
                  ? `${selectedFood.brand} · `
                  : ""}
                Kaynak: {selectedFood.sourceLabel}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedFood(null)}
              className="text-sm font-semibold text-emerald-800 underline"
            >
              Başka sonuç seç
            </button>
          </div>

          <label className="mt-6 block max-w-xs">
            <span className="mb-2 block text-sm font-semibold">
              Porsiyon ağırlığı
            </span>
            <div className="relative">
              <input
                type="number"
                min="1"
                max="5000"
                step="1"
                value={portionGrams}
                onChange={(event) =>
                  setPortionGrams(event.target.value)
                }
                className={`${inputClass} pr-14`}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                g
              </span>
            </div>
            <p className="mt-2 text-xs text-zinc-500">
              Önerilen: {selectedFood.servingLabel}
            </p>
          </label>

          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            {[
              ["Kalori", `${nutrition.calories} kcal`],
              ["Protein", `${nutrition.proteinGrams} g`],
              ["Karbonhidrat", `${nutrition.carbohydrateGrams} g`],
              ["Yağ", `${nutrition.fatGrams} g`],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl bg-white p-4"
              >
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="mt-2 font-bold">{value}</p>
              </div>
            ))}
          </div>

          <p className="mt-5 text-xs leading-5 text-zinc-500">
            Değerler tarif, marka, yağ miktarı ve porsiyona göre
            değişebilir. Sonuç tahminidir.
          </p>
        </div>
      )}

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-2xl border border-zinc-300 px-6 py-3.5 font-semibold"
        >
          Vazgeç
        </button>
        <button
          type="button"
          disabled={!selectedFood}
          onClick={submitFood}
          className="rounded-2xl bg-emerald-600 px-7 py-3.5 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Öğüne ekle
        </button>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10";
