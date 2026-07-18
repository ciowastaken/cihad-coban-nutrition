"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AppNav } from "@/components/layout/AppNav";
import type {
  DietPlan,
  DietPlanMeal,
} from "@/features/plans/types";

type DbPlan = {
  id: string;
  title: string;
  summary: string;
  target_calories: number;
  meals: DietPlanMeal[];
  status: "active" | "archived";
  created_at: string;
};

type NutritionResult = {
  targetCalories: number;
  proteinGrams?: number;
  carbohydrateGrams?: number;
  fatGrams?: number;
};

type ProfileRow = {
  full_name?: string | null;
  age?: number | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  target_weight_kg?: number | null;
  goal?: string | null;
  activity_level?: string | null;
  dietary_preference?: string | null;
  allergies?: string | null;
  disliked_foods?: string | null;
  nutrition_result?: NutritionResult | null;
  skipped_meals?: string[] | null;
};

type ProfileStatus =
  | "loading"
  | "ready"
  | "incomplete"
  | "missing";

type GoalType =
  | "lose"
  | "maintain"
  | "gain"
  | "muscle";

type MealTemplate = {
  title: string;
  time: string;
  foods: string[];
  alternative: string;
  calorieRatio: number;
};

type PlanVariant = {
  name: string;
  meals: MealTemplate[];
};

function fromDb(
  plan: DbPlan,
): DietPlan & { status?: string } {
  return {
    id: plan.id,
    title: plan.title,
    summary: plan.summary,
    targetCalories: plan.target_calories,
    meals: plan.meals,
    createdAt: plan.created_at,
    status: plan.status,
  };
}

function normalizeGoal(goal?: string | null): GoalType {
  const value = (goal ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR");

  if (
    value === "gain" ||
    value.includes("kilo al") ||
    value.includes("hacim")
  ) {
    return "gain";
  }

  if (
    value === "muscle" ||
    value.includes("kas") ||
    value.includes("muscle")
  ) {
    return "muscle";
  }

  if (
    value === "maintain" ||
    value.includes("koru") ||
    value.includes("sabit")
  ) {
    return "maintain";
  }

  return "lose";
}

function getGoalLabel(goal: GoalType): string {
  if (goal === "gain") return "kilo alma";
  if (goal === "muscle") return "kas geliştirme";
  if (goal === "maintain") return "kilo koruma";
  return "kilo verme";
}

function normalizeText(value?: string | null): string {
  return (value ?? "")
    .trim()
    .toLocaleLowerCase("tr-TR");
}

function hasAnyText(
  source: string,
  words: string[],
): boolean {
  return words.some((word) => source.includes(word));
}

function isMealSkipped(
  skippedMeals: string[],
  meal: "breakfast" | "lunch" | "snack",
): boolean {
  const normalized = skippedMeals.map(normalizeText);

  if (meal === "breakfast") {
    return normalized.some(
      (item) =>
        item.includes("kahvaltı") &&
        hasAnyText(item, ["yapm", "atla", "istem"]),
    );
  }

  if (meal === "lunch") {
    return normalized.some(
      (item) =>
        item.includes("öğle") &&
        hasAnyText(item, ["yapm", "atla", "istem"]),
    );
  }

  return normalized.some(
    (item) =>
      item.includes("ara öğün") &&
      hasAnyText(item, ["istem", "yapm", "atla"]),
  );
}

const loseVariants: PlanVariant[] = [
  {
    name: "Akdeniz tipi",
    meals: [
      {
        title: "Kahvaltı",
        time: "08:30",
        foods: [
          "2 yumurtalı sebzeli omlet",
          "1 dilim tam tahıllı ekmek",
          "Domates, salatalık ve yeşillik",
        ],
        alternative:
          "Sade yoğurt, yulaf ve meyve kasesi",
        calorieRatio: 0.23,
      },
      {
        title: "Öğle",
        time: "13:00",
        foods: [
          "Izgara tavuk veya hindi",
          "Bol yeşillikli salata",
          "3–4 yemek kaşığı bulgur",
        ],
        alternative:
          "Ton balıklı tam tahıllı dürüm",
        calorieRatio: 0.31,
      },
      {
        title: "Ara öğün",
        time: "16:30",
        foods: [
          "1 porsiyon meyve",
          "8–10 çiğ badem",
        ],
        alternative:
          "Kefir veya sade yoğurt",
        calorieRatio: 0.11,
      },
      {
        title: "Akşam",
        time: "19:30",
        foods: [
          "Izgara balık veya tavuk",
          "Bol sebze",
          "Küçük porsiyon kompleks karbonhidrat",
          "Yoğurt",
        ],
        alternative:
          "Zeytinyağlı sebze yemeği ve ayran",
        calorieRatio: 0.35,
      },
    ],
  },
  {
    name: "Türk mutfağı dengeli",
    meals: [
      {
        title: "Kahvaltı",
        time: "08:30",
        foods: [
          "1 haşlanmış yumurta",
          "Az yağlı beyaz peynir",
          "1 dilim tam buğday ekmeği",
          "Söğüş sebze",
        ],
        alternative:
          "Menemen ve 1 dilim tam buğday ekmeği",
        calorieRatio: 0.22,
      },
      {
        title: "Öğle",
        time: "13:00",
        foods: [
          "Etli veya tavuklu sebze yemeği",
          "4 yemek kaşığı bulgur pilavı",
          "Cacık",
        ],
        alternative:
          "Mercimek çorbası, salata ve yoğurt",
        calorieRatio: 0.33,
      },
      {
        title: "Ara öğün",
        time: "16:30",
        foods: [
          "1 küçük elma veya armut",
          "1 bardak ayran",
        ],
        alternative:
          "2 tam ceviz ve 1 mandalina",
        calorieRatio: 0.1,
      },
      {
        title: "Akşam",
        time: "19:30",
        foods: [
          "Izgara köfte veya tavuk",
          "Büyük mevsim salatası",
          "1 küçük kase yoğurt",
        ],
        alternative:
          "Zeytinyağlı kuru baklagil ve salata",
        calorieRatio: 0.35,
      },
    ],
  },
  {
    name: "Yüksek protein",
    meals: [
      {
        title: "Kahvaltı",
        time: "08:30",
        foods: [
          "2 tam yumurta ve 2 yumurta beyazı",
          "Lor peyniri",
          "1 dilim tam tahıllı ekmek",
        ],
        alternative:
          "Proteinli yoğurt, yulaf ve çilek",
        calorieRatio: 0.25,
      },
      {
        title: "Öğle",
        time: "13:00",
        foods: [
          "160–180 g tavuk göğsü",
          "Bol salata",
          "Küçük porsiyon esmer pirinç",
        ],
        alternative:
          "Yağsız kıymalı sebze ve yoğurt",
        calorieRatio: 0.32,
      },
      {
        title: "Ara öğün",
        time: "16:30",
        foods: [
          "1 bardak kefir",
          "1 küçük meyve",
        ],
        alternative:
          "Sade yoğurt ve tarçın",
        calorieRatio: 0.1,
      },
      {
        title: "Akşam",
        time: "19:30",
        foods: [
          "170 g balık veya hindi",
          "Fırın sebze",
          "Yoğurtlu salata",
        ],
        alternative:
          "Izgara tavuklu büyük salata",
        calorieRatio: 0.33,
      },
    ],
  },
  {
    name: "Pratik ve ekonomik",
    meals: [
      {
        title: "Kahvaltı",
        time: "08:30",
        foods: [
          "2 yumurta",
          "1 dilim tam tahıllı ekmek",
          "Domates ve salatalık",
        ],
        alternative:
          "Yulaf, süt ve muz",
        calorieRatio: 0.22,
      },
      {
        title: "Öğle",
        time: "13:00",
        foods: [
          "Yeşil mercimek veya nohut yemeği",
          "Yoğurt",
          "Bol salata",
        ],
        alternative:
          "Tavuklu bulgur pilavı",
        calorieRatio: 0.34,
      },
      {
        title: "Ara öğün",
        time: "16:30",
        foods: [
          "1 meyve",
          "1 bardak ayran",
        ],
        alternative:
          "Leblebi ve kefir",
        calorieRatio: 0.1,
      },
      {
        title: "Akşam",
        time: "19:30",
        foods: [
          "Sebzeli tavuk sote",
          "Küçük porsiyon bulgur",
          "Cacık",
        ],
        alternative:
          "Ton balıklı salata",
        calorieRatio: 0.34,
      },
    ],
  },
];

const maintainVariants: PlanVariant[] = [
  {
    name: "Dengeli klasik",
    meals: [
      {
        title: "Kahvaltı",
        time: "08:30",
        foods: [
          "2 yumurtalı omlet",
          "1–2 dilim tam tahıllı ekmek",
          "Peynir ve söğüş sebze",
        ],
        alternative:
          "Yoğurt, yulaf ve meyve kasesi",
        calorieRatio: 0.24,
      },
      {
        title: "Öğle",
        time: "13:00",
        foods: [
          "150–170 g tavuk veya balık",
          "Orta porsiyon bulgur veya pirinç",
          "Bol salata",
        ],
        alternative:
          "Ton balıklı tam tahıllı dürüm",
        calorieRatio: 0.3,
      },
      {
        title: "Ara öğün",
        time: "16:30",
        foods: [
          "1 porsiyon meyve",
          "10–12 çiğ badem",
        ],
        alternative:
          "Kefir ve meyve",
        calorieRatio: 0.14,
      },
      {
        title: "Akşam",
        time: "19:30",
        foods: [
          "Izgara et, tavuk veya balık",
          "Sebze yemeği",
          "Orta porsiyon kompleks karbonhidrat",
        ],
        alternative:
          "Zeytinyağlı sebze, ayran ve ekmek",
        calorieRatio: 0.32,
      },
    ],
  },
  {
    name: "Ev yemekleri",
    meals: [
      {
        title: "Kahvaltı",
        time: "08:30",
        foods: [
          "Menemen",
          "Beyaz peynir",
          "1–2 dilim tam buğday ekmeği",
        ],
        alternative:
          "Haşlanmış yumurta ve peynir tabağı",
        calorieRatio: 0.25,
      },
      {
        title: "Öğle",
        time: "13:00",
        foods: [
          "Kuru fasulye veya nohut",
          "Bulgur pilavı",
          "Cacık",
        ],
        alternative:
          "Etli sebze yemeği ve yoğurt",
        calorieRatio: 0.31,
      },
      {
        title: "Ara öğün",
        time: "16:30",
        foods: [
          "Meyve",
          "2 tam ceviz",
        ],
        alternative:
          "Ayran ve küçük sandviç",
        calorieRatio: 0.13,
      },
      {
        title: "Akşam",
        time: "19:30",
        foods: [
          "Izgara tavuk veya köfte",
          "Mevsim salata",
          "Yoğurt",
        ],
        alternative:
          "Sebzeli makarna ve ayran",
        calorieRatio: 0.31,
      },
    ],
  },
];

const gainVariants: PlanVariant[] = [
  {
    name: "Yüksek enerji",
    meals: [
      {
        title: "Kahvaltı",
        time: "08:30",
        foods: [
          "3 yumurtalı peynirli omlet",
          "2 dilim tam tahıllı ekmek",
          "Yulaf, muz ve süt",
          "1 yemek kaşığı fıstık ezmesi",
        ],
        alternative:
          "Yoğurt, yulaf, muz, bal ve kuruyemiş kasesi",
        calorieRatio: 0.25,
      },
      {
        title: "Öğle",
        time: "13:00",
        foods: [
          "180–200 g tavuk veya et",
          "Büyük porsiyon pirinç veya bulgur",
          "Zeytinyağlı salata",
          "Yoğurt",
        ],
        alternative:
          "Etli makarna ve ayran",
        calorieRatio: 0.3,
      },
      {
        title: "Ara öğün",
        time: "16:30",
        foods: [
          "Muz",
          "Kuruyemiş",
          "Kefir",
          "Tam tahıllı sandviç",
        ],
        alternative:
          "Fıstık ezmeli tost ve süt",
        calorieRatio: 0.15,
      },
      {
        title: "Akşam",
        time: "19:30",
        foods: [
          "180–200 g balık, tavuk veya et",
          "Büyük porsiyon kompleks karbonhidrat",
          "Sebze ve yoğurt",
        ],
        alternative:
          "Kıymalı makarna ve ayran",
        calorieRatio: 0.3,
      },
    ],
  },
  {
    name: "Ekonomik hacim",
    meals: [
      {
        title: "Kahvaltı",
        time: "08:30",
        foods: [
          "3 yumurta",
          "2 dilim ekmek",
          "Peynir",
          "Muzlu süt",
        ],
        alternative:
          "Yulaf, süt, muz ve tahin",
        calorieRatio: 0.26,
      },
      {
        title: "Öğle",
        time: "13:00",
        foods: [
          "Tavuklu bulgur pilavı",
          "Yoğurt",
          "Salata",
        ],
        alternative:
          "Kuru fasulye, pilav ve ayran",
        calorieRatio: 0.31,
      },
      {
        title: "Ara öğün",
        time: "16:30",
        foods: [
          "Fıstık ezmeli sandviç",
          "1 bardak süt",
        ],
        alternative:
          "Kefir, muz ve kuruyemiş",
        calorieRatio: 0.15,
      },
      {
        title: "Akşam",
        time: "19:30",
        foods: [
          "Kıymalı makarna",
          "Yoğurt",
          "Salata",
        ],
        alternative:
          "Tavuk sote ve pilav",
        calorieRatio: 0.28,
      },
    ],
  },
];

const muscleVariants: PlanVariant[] = [
  {
    name: "Antrenman odaklı",
    meals: [
      {
        title: "Kahvaltı",
        time: "08:30",
        foods: [
          "3 yumurta ve lor peynirli omlet",
          "2 dilim tam tahıllı ekmek",
          "Yulaf ve meyve",
        ],
        alternative:
          "Proteinli yoğurt, yulaf ve muz",
        calorieRatio: 0.24,
      },
      {
        title: "Öğle",
        time: "13:00",
        foods: [
          "180 g tavuk, hindi veya yağsız et",
          "Orta-büyük porsiyon pirinç veya bulgur",
          "Bol salata",
        ],
        alternative:
          "Ton balıklı makarna",
        calorieRatio: 0.3,
      },
      {
        title: "Antrenman çevresi",
        time: "16:30",
        foods: [
          "Muz",
          "Kefir veya süt",
          "Yulaf",
          "10–12 badem",
        ],
        alternative:
          "Tam tahıllı peynirli sandviç",
        calorieRatio: 0.16,
      },
      {
        title: "Akşam",
        time: "19:30",
        foods: [
          "180 g balık, tavuk veya yağsız et",
          "Orta porsiyon kompleks karbonhidrat",
          "Bol sebze",
          "Yoğurt",
        ],
        alternative:
          "Izgara köfte, bulgur ve salata",
        calorieRatio: 0.3,
      },
    ],
  },
  {
    name: "Yüksek protein pratik",
    meals: [
      {
        title: "Kahvaltı",
        time: "08:30",
        foods: [
          "2 tam yumurta ve 3 yumurta beyazı",
          "Lor peynirli tost",
          "1 meyve",
        ],
        alternative:
          "Yoğurt, yulaf ve süt karışımı",
        calorieRatio: 0.23,
      },
      {
        title: "Öğle",
        time: "13:00",
        foods: [
          "Tavuklu veya ton balıklı makarna",
          "Ayran",
          "Salata",
        ],
        alternative:
          "Etli pilav ve yoğurt",
        calorieRatio: 0.32,
      },
      {
        title: "Antrenman çevresi",
        time: "16:30",
        foods: [
          "Muz",
          "Kefir",
          "Tam tahıllı sandviç",
        ],
        alternative:
          "Süt, yulaf ve meyve",
        calorieRatio: 0.15,
      },
      {
        title: "Akşam",
        time: "19:30",
        foods: [
          "Izgara tavuk veya balık",
          "Bulgur pilavı",
          "Yoğurtlu salata",
        ],
        alternative:
          "Köfte, patates ve salata",
        calorieRatio: 0.3,
      },
    ],
  },
];

function getVariants(goal: GoalType): PlanVariant[] {
  if (goal === "gain") return gainVariants;
  if (goal === "muscle") return muscleVariants;
  if (goal === "maintain") return maintainVariants;
  return loseVariants;
}

function getBodyCategory(
  weightKg?: number | null,
  heightCm?: number | null,
): "small" | "medium" | "large" {
  if (!weightKg || !heightCm) return "medium";

  const bmi =
    weightKg / Math.pow(heightCm / 100, 2);

  if (bmi < 21) return "small";
  if (bmi >= 29) return "large";
  return "medium";
}

function getActivityScore(
  activity?: string | null,
): number {
  const value = normalizeText(activity);

  if (
    hasAnyText(value, [
      "very",
      "çok aktif",
      "heavy",
      "yüksek",
    ])
  ) {
    return 3;
  }

  if (
    hasAnyText(value, [
      "active",
      "aktif",
      "moderate",
      "orta",
    ])
  ) {
    return 2;
  }

  if (
    hasAnyText(value, [
      "light",
      "hafif",
    ])
  ) {
    return 1;
  }

  return 0;
}

function chooseVariant(
  goal: GoalType,
  profile: ProfileRow,
  existingPlanCount: number,
): PlanVariant {
  const variants = getVariants(goal);

  const bodyCategory = getBodyCategory(
    profile.weight_kg,
    profile.height_cm,
  );

  const bodyScore =
    bodyCategory === "small"
      ? 1
      : bodyCategory === "large"
        ? 3
        : 2;

  const ageScore = Math.floor(
    (profile.age ?? 25) / 10,
  );

  const activityScore = getActivityScore(
    profile.activity_level,
  );

  const genderScore =
    normalizeText(profile.gender).includes("female") ||
    normalizeText(profile.gender).includes("kadın")
      ? 1
      : 2;

  const nameScore = Array.from(
    profile.full_name ?? "",
  ).reduce(
    (sum, character) =>
      sum + character.charCodeAt(0),
    0,
  );

  const index =
    (
      nameScore +
      ageScore +
      activityScore +
      bodyScore +
      genderScore +
      existingPlanCount
    ) % variants.length;

  return variants[index];
}

function filterFoodPreferences(
  meal: MealTemplate,
  profile: ProfileRow,
): MealTemplate {
  const blocked = normalizeText(
    `${profile.allergies ?? ""} ${
      profile.disliked_foods ?? ""
    }`,
  );

  const preference = normalizeText(
    profile.dietary_preference,
  );

  const replacements: Array<{
    keywords: string[];
    replacement: string;
  }> = [
    {
      keywords: ["balık", "ton balığı"],
      replacement:
        "Izgara tavuk, hindi veya kuru baklagil",
    },
    {
      keywords: ["süt", "yoğurt", "kefir", "ayran"],
      replacement:
        "Laktozsuz ürün veya bitkisel alternatif",
    },
    {
      keywords: ["yumurta"],
      replacement:
        "Lor peynirli veya nohut unlu sebzeli alternatif",
    },
    {
      keywords: ["badem", "ceviz", "kuruyemiş", "fıstık"],
      replacement:
        "Kavrulmuş leblebi veya çekirdek içi",
    },
  ];

  let foods = meal.foods.map((food) => {
    const normalizedFood = normalizeText(food);

    if (
      preference.includes("vegan") ||
      preference.includes("vejetaryen")
    ) {
      if (
        hasAnyText(normalizedFood, [
          "tavuk",
          "hindi",
          "et",
          "balık",
          "köfte",
          "ton balığı",
        ])
      ) {
        return "Kuru baklagil, tofu veya bitkisel protein";
      }
    }

    for (const rule of replacements) {
      if (
        hasAnyText(blocked, rule.keywords) &&
        hasAnyText(normalizedFood, rule.keywords)
      ) {
        return rule.replacement;
      }
    }

    return food;
  });

  if (
    preference.includes("vegan")
  ) {
    foods = foods.map((food) =>
      food
        .replace(/yoğurt/gi, "bitkisel yoğurt")
        .replace(/ayran/gi, "bitkisel ayran")
        .replace(/süt/gi, "bitkisel süt")
        .replace(/peynir/gi, "bitkisel peynir"),
    );
  }

  return {
    ...meal,
    foods: Array.from(new Set(foods)),
  };
}

function buildMeals(
  goal: GoalType,
  skippedMeals: string[],
  targetCalories: number,
  profile: ProfileRow,
  existingPlanCount: number,
): {
  meals: DietPlanMeal[];
  variantName: string;
} {
  const noBreakfast = isMealSkipped(
    skippedMeals,
    "breakfast",
  );
  const noLunch = isMealSkipped(
    skippedMeals,
    "lunch",
  );
  const noSnack = isMealSkipped(
    skippedMeals,
    "snack",
  );

  const variant = chooseVariant(
    goal,
    profile,
    existingPlanCount,
  );

  const templates = variant.meals
    .filter((meal) => {
      if (meal.title === "Kahvaltı") return !noBreakfast;
      if (meal.title === "Öğle") return !noLunch;

      if (
        meal.title === "Ara öğün" ||
        meal.title === "Antrenman çevresi"
      ) {
        return !noSnack;
      }

      return true;
    })
    .map((meal) =>
      filterFoodPreferences(meal, profile),
    );

  const totalRatio = templates.reduce(
    (sum, meal) => sum + meal.calorieRatio,
    0,
  );

  let distributedCalories = 0;

  const meals = templates.map((meal, index) => {
    const isLast = index === templates.length - 1;

    const calories = isLast
      ? targetCalories - distributedCalories
      : Math.round(
          targetCalories *
            (meal.calorieRatio / totalRatio),
        );

    distributedCalories += calories;

    return {
      title: meal.title,
      time:
        noBreakfast && meal.title === "Öğle"
          ? "12:00"
          : meal.time,
      foods: meal.foods,
      calories: Math.max(1, calories),
      alternative: meal.alternative,
    };
  });

  return {
    meals,
    variantName: variant.name,
  };
}

export default function PlansPage() {
  const router = useRouter();

  const [plans, setPlans] = useState<
    (DietPlan & { status?: string })[]
  >([]);

  const [profileRow, setProfileRow] =
    useState<ProfileRow | null>(null);

  const [profileStatus, setProfileStatus] =
    useState<ProfileStatus>("loading");

  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(
    null,
  );

  const loadPlans = useCallback(async () => {
    try {
      const response = await fetch("/api/plans", {
        cache: "no-store",
        credentials: "include",
      });

      if (response.status === 401) {
        router.replace("/login?next=/plans");
        return;
      }

      if (!response.ok) {
        setMessage(
          "Programlar yüklenemedi. Lütfen bağlantını kontrol edip tekrar dene.",
        );
        return;
      }

      const json = await response.json();

      setPlans(
        ((json.plans ?? []) as DbPlan[]).map(fromDb),
      );
    } catch {
      setMessage(
        "Programlar yüklenirken beklenmeyen bir hata oluştu.",
      );
    }
  }, [router]);

  const loadProfile = useCallback(async () => {
    try {
      const response = await fetch("/api/profile", {
        cache: "no-store",
        credentials: "include",
      });

      if (response.status === 401) {
        router.replace("/login?next=/plans");
        return;
      }

      if (!response.ok) {
        setProfileStatus("missing");
        setProfileRow(null);
        return;
      }

      const json = await response.json();
      const row = (json.profile ?? json) as ProfileRow;

      setProfileRow(row);

      const hasRequiredInformation =
        Boolean(row.full_name) &&
        Boolean(row.age) &&
        Boolean(row.height_cm) &&
        Boolean(row.weight_kg) &&
        Boolean(row.goal) &&
        Boolean(row.nutrition_result?.targetCalories);

      setProfileStatus(
        hasRequiredInformation
          ? "ready"
          : "incomplete",
      );
    } catch {
      setProfileStatus("missing");
      setProfileRow(null);
    }
  }, [router]);

  useEffect(() => {
    void Promise.all([loadPlans(), loadProfile()]);
  }, [loadPlans, loadProfile]);

  async function createPlan() {
    setMessage("");

    if (
      profileStatus === "missing" ||
      profileStatus === "incomplete"
    ) {
      router.push("/onboarding");
      return;
    }

    if (!profileRow?.nutrition_result?.targetCalories) {
      setProfileStatus("incomplete");
      setMessage(
        "Profil hesaplaman eksik. Önce bilgilerini tamamlamalısın.",
      );
      return;
    }

    setCreating(true);

    try {
      const goal = normalizeGoal(profileRow.goal);
      const targetCalories =
        profileRow.nutrition_result.targetCalories;

      const {
        meals,
        variantName,
      } = buildMeals(
        goal,
        profileRow.skipped_meals ?? [],
        targetCalories,
        profileRow,
        plans.length,
      );

      const currentWeight =
        profileRow.weight_kg ?? 0;
      const targetWeight =
        profileRow.target_weight_kg;

      const payload = {
        title: `${
          profileRow.full_name || "Kullanıcı"
        } için ${getGoalLabel(goal)} planı`,

        summary: `${currentWeight} kg güncel değer${
          targetWeight
            ? ` ve ${targetWeight} kg hedef`
            : ""
        } dikkate alınarak; ${variantName} yaklaşımıyla ${getGoalLabel(
          goal,
        )} amacına uygun oluşturuldu.`,

        targetCalories,
        meals,
      };

      const response = await fetch("/api/plans", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const json = await response
          .json()
          .catch(() => ({}));

        setMessage(
          json.error || "Program kaydedilemedi.",
        );
        return;
      }

      setMessage(
        `${variantName} türünde yeni program başarıyla oluşturuldu.`,
      );

      await loadPlans();
    } catch {
      setMessage(
        "Program hazırlanırken beklenmeyen bir hata oluştu.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function removePlan(id: string) {
    const confirmed = window.confirm(
      "Bu program kalıcı olarak silinecek. Emin misin?",
    );

    if (!confirmed) {
      return;
    }

    setDeleteId(id);
    setMessage("");

    try {
      const response = await fetch(
        `/api/plans/${id}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        setMessage("Program silinemedi.");
        return;
      }

      setPlans((current) =>
        current.filter((plan) => plan.id !== id),
      );
    } catch {
      setMessage(
        "Program silinirken bağlantı hatası oluştu.",
      );
    } finally {
      setDeleteId(null);
    }
  }

  const profileIsIncomplete =
    profileStatus === "missing" ||
    profileStatus === "incomplete";

  const currentGoal = normalizeGoal(
    profileRow?.goal,
  );

  return (
    <>
      <AppNav />

      <main className="shell-wide py-10 lg:py-16">
        <section className="plan-hero">
          <div>
            <p className="eyebrow">
              <span />
              Kişiye özel program
            </p>

            <h1>
              Aynı hedefte bile farklı, sana göre
              çeşitlenen planlar.
            </h1>

            <p>
              Program; hedefin, yaşın, boyun, kilon,
              aktiviten, öğün tercihlerin ve daha önce
              oluşturduğun plan sayısına göre farklı
              menü kombinasyonları hazırlar.
            </p>
          </div>

          <div className="plan-action-card">
            <span className="plan-action-icon">✦</span>

            <h2>Güncel profilinle hesapla</h2>

            <p>
              Her yeni hesaplamada uygun menü havuzundan
              farklı bir plan seçilir ve kaloriler sana
              göre dağıtılır.
            </p>

            {profileStatus === "loading" ? (
              <div className="mt-5 rounded-2xl border border-white/15 bg-white/5 p-5">
                <p className="font-semibold text-white">
                  Profil bilgilerin kontrol ediliyor…
                </p>
              </div>
            ) : profileIsIncomplete ? (
              <div className="mt-6 rounded-2xl border-2 border-amber-400 bg-amber-50 p-5 text-left shadow-lg shadow-amber-950/10">
                <div className="flex items-start gap-4">
                  <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-xl">
                    ⚠️
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-amber-950">
                      Profil bilgilerin eksik
                    </h3>

                    <p className="mt-2 text-sm font-medium leading-6 text-amber-900">
                      Yaş, boy, kilo ve hedef bilgilerini
                      tamamlamalısın.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl border border-emerald-400/40 bg-emerald-400/10 p-4">
                <p className="font-semibold text-emerald-100">
                  ✓ Profilin hazır:{" "}
                  {getGoalLabel(currentGoal)} hedefi
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={createPlan}
              disabled={
                creating || profileStatus === "loading"
              }
              className="button button-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
            >
              {profileStatus === "loading"
                ? "Profil kontrol ediliyor…"
                : creating
                  ? "Program hazırlanıyor…"
                  : profileIsIncomplete
                    ? "Profilimi tamamla →"
                    : "Farklı program oluştur →"}
            </button>

            {message && (
              <div
                className={`mt-4 rounded-2xl border p-4 text-sm font-semibold ${
                  message.includes("başarıyla")
                    ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                    : "border-red-300 bg-red-50 text-red-800"
                }`}
                role="alert"
              >
                {message}
              </div>
            )}
          </div>
        </section>

        <section className="mt-12">
          <div className="section-title-row">
            <div>
              <p className="eyebrow">
                <span />
                Program geçmişi
              </p>

              <h2>Programların</h2>
            </div>

            <span>{plans.length} kayıt</span>
          </div>

          {plans.length === 0 ? (
            <div className="empty-state">
              <b>Henüz programın yok</b>

              <p>
                Profil bilgilerini tamamladıktan sonra
                hedefinle uyumlu ilk programını
                oluşturabilirsin.
              </p>
            </div>
          ) : (
            <div className="plan-list">
              {plans.map((plan) => (
                <article
                  key={plan.id}
                  className={`plan-card ${
                    plan.status === "active"
                      ? "active-plan"
                      : ""
                  }`}
                >
                  <div className="plan-card-head">
                    <div>
                      <div className="status-line">
                        <span>
                          {plan.status === "active"
                            ? "Aktif program"
                            : "Arşiv"}
                        </span>

                        <time>
                          {new Date(
                            plan.createdAt,
                          ).toLocaleDateString("tr-TR")}
                        </time>
                      </div>

                      <h3>{plan.title}</h3>
                      <p>{plan.summary}</p>
                    </div>

                    <div className="plan-card-actions">
                      <div>
                        <b>{plan.targetCalories}</b>
                        <small>kcal / gün</small>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          removePlan(plan.id)
                        }
                        disabled={deleteId === plan.id}
                        className="danger-button"
                      >
                        {deleteId === plan.id
                          ? "Siliniyor…"
                          : "Programı sil"}
                      </button>
                    </div>
                  </div>

                  <div className="meal-plan-grid">
                    {plan.meals.map((meal) => (
                      <div
                        key={`${plan.id}-${meal.title}`}
                        className="meal-plan-card"
                      >
                        <div>
                          <b>{meal.title}</b>
                          <span>{meal.time}</span>
                        </div>

                        <ul>
                          {meal.foods.map((food) => (
                            <li
                              key={`${meal.title}-${food}`}
                            >
                              {food}
                            </li>
                          ))}
                        </ul>

                        <p className="mt-3 text-sm font-semibold text-emerald-700">
                          Yaklaşık {meal.calories} kcal
                        </p>

                        <p>
                          <strong>Alternatif:</strong>{" "}
                          {meal.alternative}
                        </p>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
