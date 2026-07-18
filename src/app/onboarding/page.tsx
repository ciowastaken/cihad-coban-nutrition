"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { calculateNutrition } from "@/features/onboarding/calculate-nutrition";
import type {
  ActivityLevel,
  Gender,
  Goal,
  NutritionResult,
  OnboardingFormData,
  SavedNutritionProfile,
} from "@/features/onboarding/types";

const STORAGE_KEY = "cc-nutrition-profile";

const initialFormData: OnboardingFormData = {
  name: "",
  age: "",
  gender: "male",
  heightCm: "",
  weightKg: "",
  goal: "lose",
  activityLevel: "moderate",
};

const stepTitles = [
  "Adın nedir?",
  "Yaşını öğrenelim",
  "Hesaplama kategorin",
  "Boyun kaç?",
  "Kilon kaç?",
  "Hedefin nedir?",
  "Ne kadar hareketlisin?",
];

type ProfileRow = {
  full_name?: string | null;
  age?: number | null;
  gender?: string | null;
  height_cm?: number | null;
  weight_kg?: number | null;
  goal?: string | null;
  activity_level?: string | null;
};

type StartMode =
  | "loading"
  | "choose"
  | "wizard";

function isGender(value?: string | null): value is Gender {
  return value === "male" || value === "female";
}

function isGoal(value?: string | null): value is Goal {
  return (
    value === "lose" ||
    value === "maintain" ||
    value === "gain"
  );
}

function isActivityLevel(
  value?: string | null,
): value is ActivityLevel {
  return (
    value === "sedentary" ||
    value === "light" ||
    value === "moderate" ||
    value === "active" ||
    value === "very-active"
  );
}

function profileRowToFormData(
  profile: ProfileRow,
): OnboardingFormData {
  return {
    name: profile.full_name?.trim() ?? "",
    age: profile.age ? String(profile.age) : "",
    gender: isGender(profile.gender)
      ? profile.gender
      : "male",
    heightCm: profile.height_cm
      ? String(profile.height_cm)
      : "",
    weightKg: profile.weight_kg
      ? String(profile.weight_kg)
      : "",
    goal: isGoal(profile.goal)
      ? profile.goal
      : "lose",
    activityLevel: isActivityLevel(
      profile.activity_level,
    )
      ? profile.activity_level
      : "moderate",
  };
}

function getGoalLabel(goal: Goal): string {
  if (goal === "gain") {
    return "Kilo almak";
  }

  if (goal === "maintain") {
    return "Kiloyu korumak";
  }

  return "Kilo vermek";
}

function getActivityLabel(
  activityLevel: ActivityLevel,
): string {
  const labels: Record<ActivityLevel, string> = {
    sedentary: "Hareketsiz",
    light: "Hafif hareketli",
    moderate: "Orta hareketli",
    active: "Çok hareketli",
    "very-active": "Yoğun",
  };

  return labels[activityLevel];
}

export default function OnboardingPage() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [formData, setFormData] =
    useState<OnboardingFormData>(initialFormData);
  const [result, setResult] =
    useState<NutritionResult | null>(null);
  const [error, setError] = useState("");

  const [startMode, setStartMode] =
    useState<StartMode>("loading");

  const [savedProfile, setSavedProfile] =
    useState<ProfileRow | null>(null);

  const [usingProfile, setUsingProfile] =
    useState(false);

  const progress = useMemo(
    () => ((step + 1) / stepTitles.length) * 100,
    [step],
  );

  useEffect(() => {
    let cancelled = false;

    async function loadExistingProfile() {
      try {
        const response = await fetch("/api/profile", {
          method: "GET",
          cache: "no-store",
          credentials: "include",
        });

        if (response.status === 401) {
          router.replace(
            "/login?next=/onboarding",
          );
          return;
        }

        if (!response.ok) {
          if (!cancelled) {
            setStartMode("wizard");
          }
          return;
        }

        const json = await response.json();
        const profile = (
          json.profile ?? json
        ) as ProfileRow;

        const hasUsefulProfileData =
          Boolean(profile.full_name) ||
          Boolean(profile.age) ||
          Boolean(profile.height_cm) ||
          Boolean(profile.weight_kg);

        if (!cancelled) {
          if (hasUsefulProfileData) {
            setSavedProfile(profile);
            setStartMode("choose");
          } else {
            setStartMode("wizard");
          }
        }
      } catch {
        if (!cancelled) {
          setStartMode("wizard");
        }
      }
    }

    void loadExistingProfile();

    return () => {
      cancelled = true;
    };
  }, [router]);

  function updateField<
    Key extends keyof OnboardingFormData,
  >(
    field: Key,
    value: OnboardingFormData[Key],
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    setError("");
  }

  function useSavedProfile() {
    if (!savedProfile) {
      return;
    }

    setFormData(
      profileRowToFormData(savedProfile),
    );
    setUsingProfile(true);
    setStep(0);
    setResult(null);
    setError("");
    setStartMode("wizard");
  }

  function useManualForm() {
    setFormData(initialFormData);
    setUsingProfile(false);
    setStep(0);
    setResult(null);
    setError("");
    setStartMode("wizard");
  }

  function validateCurrentStep() {
    if (step === 0 && !formData.name.trim()) {
      return "Lütfen adını yaz.";
    }

    if (step === 1) {
      const age = Number(formData.age);

      if (
        !Number.isFinite(age) ||
        age < 18 ||
        age > 80
      ) {
        return "Bu sürüm 18–80 yaş arası yetişkinler içindir.";
      }
    }

    if (step === 3) {
      const height = Number(
        formData.heightCm,
      );

      if (
        !Number.isFinite(height) ||
        height < 130 ||
        height > 230
      ) {
        return "Lütfen 130–230 cm arasında geçerli bir boy gir.";
      }
    }

    if (step === 4) {
      const weight = Number(
        formData.weightKg,
      );

      if (
        !Number.isFinite(weight) ||
        weight < 35 ||
        weight > 300
      ) {
        return "Lütfen 35–300 kg arasında geçerli bir kilo gir.";
      }
    }

    return "";
  }

  function nextStep() {
    const validationError =
      validateCurrentStep();

    if (validationError) {
      setError(validationError);
      return;
    }

    if (
      step ===
      stepTitles.length - 1
    ) {
      setResult(
        calculateNutrition(formData),
      );
      return;
    }

    setStep((current) => current + 1);
  }

  function previousStep() {
    setError("");
    setStep((current) =>
      Math.max(0, current - 1),
    );
  }

  async function saveAndContinue() {
    if (!result) {
      return;
    }

    const profile: SavedNutritionProfile = {
      formData,
      result,
      createdAt: new Date().toISOString(),
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(profile),
    );

    const response = await fetch(
      "/api/profile",
      {
        method: "PUT",
        headers: {
          "Content-Type":
            "application/json",
        },
        credentials: "include",
        body: JSON.stringify(profile),
      },
    );

    if (!response.ok) {
      setError(
        "Profil sunucuya kaydedilemedi. Lütfen giriş yaptığından ve veritabanı bağlantısının çalıştığından emin ol.",
      );
      return;
    }

    router.push("/dashboard");
  }

  function resetForm() {
    setFormData(initialFormData);
    setResult(null);
    setStep(0);
    setError("");
    setUsingProfile(false);
  }

  function renderStep() {
    const inputClass =
      "w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-lg outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10";

    if (step === 0) {
      return (
        <input
          autoFocus
          type="text"
          value={formData.name}
          onChange={(event) =>
            updateField(
              "name",
              event.target.value,
            )
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              nextStep();
            }
          }}
          placeholder="Örneğin Cihad"
          className={inputClass}
        />
      );
    }

    if (step === 1) {
      return (
        <input
          autoFocus
          type="number"
          min="18"
          max="80"
          value={formData.age}
          onChange={(event) =>
            updateField(
              "age",
              event.target.value,
            )
          }
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              nextStep();
            }
          }}
          placeholder="24"
          className={inputClass}
        />
      );
    }

    if (step === 2) {
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            ["male", "Erkek"],
            ["female", "Kadın"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() =>
                updateField(
                  "gender",
                  value as Gender,
                )
              }
              className={`rounded-3xl border p-6 text-left transition ${
                formData.gender === value
                  ? "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/10"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <p className="text-lg font-bold">
                {label}
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                Enerji ihtiyacı formülünde
                kullanılacak kategori
              </p>
            </button>
          ))}
        </div>
      );
    }

    if (step === 3) {
      return (
        <div className="relative">
          <input
            autoFocus
            type="number"
            min="130"
            max="230"
            value={formData.heightCm}
            onChange={(event) =>
              updateField(
                "heightCm",
                event.target.value,
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                nextStep();
              }
            }}
            placeholder="178"
            className={`${inputClass} pr-20`}
          />

          <span className="absolute right-5 top-1/2 -translate-y-1/2 font-semibold text-zinc-400">
            cm
          </span>
        </div>
      );
    }

    if (step === 4) {
      return (
        <div className="relative">
          <input
            autoFocus
            type="number"
            min="35"
            max="300"
            step="0.1"
            value={formData.weightKg}
            onChange={(event) =>
              updateField(
                "weightKg",
                event.target.value,
              )
            }
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                nextStep();
              }
            }}
            placeholder="82"
            className={`${inputClass} pr-20`}
          />

          <span className="absolute right-5 top-1/2 -translate-y-1/2 font-semibold text-zinc-400">
            kg
          </span>
        </div>
      );
    }

    if (step === 5) {
      const goals: Array<{
        value: Goal;
        title: string;
        description: string;
      }> = [
        {
          value: "lose",
          title: "Kilo vermek",
          description:
            "Kontrollü bir kalori açığı oluştur.",
        },
        {
          value: "maintain",
          title: "Kiloyu korumak",
          description:
            "Mevcut ağırlığını dengeli şekilde sürdür.",
        },
        {
          value: "gain",
          title: "Kilo almak",
          description:
            "Kontrollü bir kalori fazlası oluştur.",
        },
      ];

      return (
        <div className="space-y-3">
          {goals.map((goal) => (
            <button
              key={goal.value}
              type="button"
              onClick={() =>
                updateField(
                  "goal",
                  goal.value,
                )
              }
              className={`w-full rounded-2xl border p-5 text-left transition ${
                formData.goal === goal.value
                  ? "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/10"
                  : "border-zinc-200 bg-white hover:border-zinc-300"
              }`}
            >
              <p className="font-bold">
                {goal.title}
              </p>

              <p className="mt-1 text-sm text-zinc-500">
                {goal.description}
              </p>
            </button>
          ))}
        </div>
      );
    }

    const activities: Array<{
      value: ActivityLevel;
      title: string;
      description: string;
    }> = [
      {
        value: "sedentary",
        title: "Hareketsiz",
        description:
          "Masa başı yaşam, düzenli egzersiz yok.",
      },
      {
        value: "light",
        title: "Hafif hareketli",
        description:
          "Haftada 1–3 antrenman.",
      },
      {
        value: "moderate",
        title: "Orta hareketli",
        description:
          "Haftada 3–5 antrenman.",
      },
      {
        value: "active",
        title: "Çok hareketli",
        description:
          "Haftada 6–7 antrenman.",
      },
      {
        value: "very-active",
        title: "Yoğun",
        description:
          "Ağır fiziksel iş veya çift antrenman.",
      },
    ];

    return (
      <div className="space-y-3">
        {activities.map((activity) => (
          <button
            key={activity.value}
            type="button"
            onClick={() =>
              updateField(
                "activityLevel",
                activity.value,
              )
            }
            className={`w-full rounded-2xl border p-5 text-left transition ${
              formData.activityLevel ===
              activity.value
                ? "border-emerald-500 bg-emerald-50 ring-4 ring-emerald-500/10"
                : "border-zinc-200 bg-white hover:border-zinc-300"
            }`}
          >
            <p className="font-bold">
              {activity.title}
            </p>

            <p className="mt-1 text-sm text-zinc-500">
              {activity.description}
            </p>
          </button>
        ))}
      </div>
    );
  }

  if (startMode === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faf7] px-5 text-zinc-950">
        <div className="text-center">
          <div className="flex justify-center"><BrandLogo compact subtitle="Nutrition" /></div>

          <p className="mt-5 text-sm font-semibold text-zinc-500">
            Profil bilgilerin kontrol ediliyor…
          </p>
        </div>
      </main>
    );
  }

  if (
    startMode === "choose" &&
    savedProfile
  ) {
    const preview =
      profileRowToFormData(savedProfile);

    return (
      <main className="min-h-screen bg-[#f7faf7] px-5 py-8 text-zinc-950 sm:px-8">
        <div className="mx-auto max-w-5xl">
          <header className="flex items-center justify-between">
            <BrandLogo subtitle="Nutrition" />
          </header>

          <section className="mx-auto max-w-3xl py-16 sm:py-24">
            <div className="rounded-[2rem] border border-emerald-200 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-10">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">
                📋
              </div>

              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                Kayıtlı profil bulundu
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                Bilgilerini nasıl doldurmak
                istersin?
              </h1>

              <p className="mt-4 max-w-2xl leading-7 text-zinc-600">
                Profilindeki bilgileri otomatik
                getirebilir veya bu hesaplama için
                tüm alanları yeniden doldurabilirsin.
                Profilden getirilen alanlar yine
                düzenlenebilir.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                {[
                  ["Ad", preview.name || "Eksik"],
                  ["Yaş", preview.age || "Eksik"],
                  [
                    "Boy",
                    preview.heightCm
                      ? `${preview.heightCm} cm`
                      : "Eksik",
                  ],
                  [
                    "Kilo",
                    preview.weightKg
                      ? `${preview.weightKg} kg`
                      : "Eksik",
                  ],
                  [
                    "Hedef",
                    getGoalLabel(preview.goal),
                  ],
                  [
                    "Aktivite",
                    getActivityLabel(
                      preview.activityLevel,
                    ),
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                  >
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      {label}
                    </p>

                    <p className="mt-2 font-bold">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={useSavedProfile}
                  className="rounded-2xl bg-emerald-600 px-6 py-4 font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
                >
                  Profilimden getir →
                </button>

                <button
                  type="button"
                  onClick={useManualForm}
                  className="rounded-2xl border border-zinc-300 bg-white px-6 py-4 font-semibold transition hover:bg-zinc-50"
                >
                  Manuel dolduracağım
                </button>
              </div>

              <p className="mt-5 text-sm leading-6 text-zinc-500">
                Profilindeki kilo eskiyse
                “Profilimden getir” seçeneğini
                kullanıp kilo adımında güncel
                değerini değiştirebilirsin.
              </p>
            </div>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faf7] px-5 py-8 text-zinc-950 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex items-center justify-between">
          <BrandLogo subtitle="Nutrition" />

          {!result && (
            <p className="text-sm font-semibold text-zinc-500">
              {step + 1} / {stepTitles.length}
            </p>
          )}
        </header>

        {!result ? (
          <section className="mx-auto max-w-2xl py-16 sm:py-24">
            <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />
            </div>

            {usingProfile && (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <p className="font-semibold text-emerald-900">
                  ✓ Bilgiler profilinden getirildi
                </p>

                <p className="mt-1 text-sm leading-6 text-emerald-800">
                  Alanları kontrol et; güncel olmayan
                  bilgileri istediğin adımda
                  değiştirebilirsin.
                </p>
              </div>
            )}

            <p className="mt-10 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
              Kişisel planın
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              {stepTitles[step]}
            </h1>

            <div className="mt-10">
              {renderStep()}
            </div>

            {error && (
              <div
                role="alert"
                className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
              >
                {error}
              </div>
            )}

            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={previousStep}
                disabled={step === 0}
                className="rounded-2xl border border-zinc-300 px-6 py-3.5 font-semibold transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                Geri
              </button>

              <button
                type="button"
                onClick={nextStep}
                className="rounded-2xl bg-emerald-600 px-7 py-3.5 font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
              >
                {step ===
                stepTitles.length - 1
                  ? "Hedeflerimi hesapla"
                  : "Devam et"}
              </button>
            </div>

            <p className="mt-8 text-center text-xs leading-5 text-zinc-400">
              Bu araç genel bilgilendirme
              amaçlı tahmin üretir ve tıbbi
              değerlendirme yerine geçmez.
            </p>
          </section>
        ) : (
          <section className="mx-auto max-w-3xl py-16">
            <div className="rounded-4xl border border-zinc-200 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-10">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl text-emerald-700">
                ✓
              </div>

              <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                İlk hedeflerin hazır
              </p>

              <h1 className="mt-3 text-4xl font-bold tracking-tight">
                Harika, {formData.name}.
              </h1>

              <p className="mt-3 leading-7 text-zinc-600">
                Başlangıç için oluşturduğumuz
                tahmini günlük değerlerin burada.
              </p>

              <div className="mt-8 rounded-3xl bg-zinc-950 p-6 text-white">
                <p className="text-sm text-zinc-400">
                  Günlük kalori hedefin
                </p>

                <p className="mt-2 text-5xl font-bold">
                  {result.targetCalories.toLocaleString(
                    "tr-TR",
                  )}

                  <span className="ml-2 text-base font-normal text-zinc-400">
                    kcal
                  </span>
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs text-zinc-400">
                      Bazal metabolizma
                    </p>

                    <p className="mt-2 font-bold">
                      {result.bmr.toLocaleString(
                        "tr-TR",
                      )}{" "}
                      kcal
                    </p>
                  </div>

                  <div className="rounded-2xl bg-white/10 p-4">
                    <p className="text-xs text-zinc-400">
                      Koruma tahmini
                    </p>

                    <p className="mt-2 font-bold">
                      {result.maintenanceCalories.toLocaleString(
                        "tr-TR",
                      )}{" "}
                      kcal
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                {[
                  [
                    "Protein",
                    `${result.proteinGrams} g`,
                  ],
                  [
                    "Karbonhidrat",
                    `${result.carbohydrateGrams} g`,
                  ],
                  [
                    "Yağ",
                    `${result.fatGrams} g`,
                  ],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5"
                  >
                    <p className="text-sm text-zinc-500">
                      {label}
                    </p>

                    <p className="mt-2 text-2xl font-bold">
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  {error}
                </div>
              )}

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={saveAndContinue}
                  className="flex-1 rounded-2xl bg-emerald-600 px-6 py-4 font-semibold text-white transition hover:bg-emerald-700"
                >
                  Kaydet ve panele geç
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-2xl border border-zinc-300 px-6 py-4 font-semibold transition hover:bg-zinc-50"
                >
                  Baştan düzenle
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}