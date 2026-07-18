import { NextRequest, NextResponse } from "next/server";

import {
  normalizeFoodText,
  searchLocalFoods,
} from "@/features/foods/local-foods";
import type { FoodSearchResult } from "@/features/foods/types";

type OffProduct = {
  code?: string;
  product_name?: string;
  product_name_tr?: string;
  generic_name?: string;
  brands?: string;
  serving_size?: string;
  countries_tags?: string[];
  nutriments?: {
    "energy-kcal_100g"?: number;
    proteins_100g?: number;
    carbohydrates_100g?: number;
    fat_100g?: number;
  };
};

type OffResponse = {
  products?: OffProduct[];
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json(
      { error: "En az iki karakter gir." },
      { status: 400 },
    );
  }

  const localResults = searchLocalFoods(query).slice(0, 8);
  let externalResults: FoodSearchResult[] = [];

  try {
    const params = new URLSearchParams({
      search_terms: query,
      search_simple: "1",
      action: "process",
      json: "1",
      page_size: "20",
      fields:
        "code,product_name,product_name_tr,generic_name,brands,serving_size,countries_tags,nutriments",
    });

    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?${params.toString()}`,
      {
        headers: {
          "User-Agent":
            "CCNutrition/0.1 (development nutrition tracker)",
        },
        next: { revalidate: 3600 },
      },
    );

    if (response.ok) {
      const data = (await response.json()) as OffResponse;

      externalResults = (data.products ?? [])
        .map((product) => mapOpenFoodFactsProduct(product, query))
        .filter(
          (product): product is FoodSearchResult => product !== null,
        )
        .sort((a, b) => relevanceScore(b, query) - relevanceScore(a, query))
        .slice(0, 8);
    }
  } catch {
    // Dış servis çalışmazsa yerel sonuçlar kullanılmaya devam eder.
  }

  return NextResponse.json({
    results: deduplicate([...localResults, ...externalResults]).slice(0, 12),
  });
}

function mapOpenFoodFactsProduct(
  product: OffProduct,
  query: string,
): FoodSearchResult | null {
  const name =
    product.product_name_tr ||
    product.product_name ||
    product.generic_name;

  const nutrients = product.nutriments;
  const calories = nutrients?.["energy-kcal_100g"];

  if (
    !name ||
    !product.code ||
    typeof calories !== "number" ||
    !Number.isFinite(calories) ||
    calories <= 0 ||
    calories > 1000
  ) {
    return null;
  }

  if (!isRelevant(name, product.brands, query)) {
    return null;
  }

  return {
    id: `off-${product.code}`,
    name,
    brand: product.brands,
    source: "openfoodfacts",
    sourceLabel: "Open Food Facts",
    servingLabel: product.serving_size || "100 g",
    defaultServingGrams: parseServingGrams(product.serving_size),
    caloriesPer100g: calories,
    proteinPer100g: safeNumber(nutrients?.proteins_100g),
    carbohydratePer100g: safeNumber(
      nutrients?.carbohydrates_100g,
    ),
    fatPer100g: safeNumber(nutrients?.fat_100g),
  };
}

function isRelevant(
  name: string,
  brand: string | undefined,
  query: string,
) {
  const normalizedQuery = normalizeFoodText(query);
  const haystack = normalizeFoodText(`${name} ${brand ?? ""}`);

  const queryTokens = normalizedQuery
    .split(" ")
    .filter((token) => token.length >= 2);

  if (!queryTokens.length) return false;

  return queryTokens.some((token) => haystack.includes(token));
}

function relevanceScore(result: FoodSearchResult, query: string) {
  const normalizedQuery = normalizeFoodText(query);
  const name = normalizeFoodText(`${result.name} ${result.brand ?? ""}`);

  if (name === normalizedQuery) return 100;
  if (name.startsWith(normalizedQuery)) return 80;
  if (name.includes(normalizedQuery)) return 60;

  const tokens = normalizedQuery.split(" ").filter(Boolean);
  return tokens.reduce(
    (score, token) => score + (name.includes(token) ? 10 : 0),
    0,
  );
}

function parseServingGrams(servingSize?: string) {
  if (!servingSize) return 100;

  const match = servingSize.match(/(\d+(?:[.,]\d+)?)\s*g/i);

  if (!match) return 100;

  const grams = Number(match[1].replace(",", "."));

  return Number.isFinite(grams) && grams > 0 ? grams : 100;
}

function safeNumber(value?: number) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : 0;
}

function deduplicate(results: FoodSearchResult[]) {
  const seen = new Set<string>();

  return results.filter((result) => {
    const key = normalizeFoodText(
      `${result.name}-${result.brand ?? ""}`,
    );

    if (seen.has(key)) return false;

    seen.add(key);
    return true;
  });
}
