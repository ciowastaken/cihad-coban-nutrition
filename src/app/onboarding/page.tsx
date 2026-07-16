"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

type Gender = "male" | "female";
type Goal = "lose" | "maintain" | "gain";
type ActivityLevel =
  | "sedentary"
  | "light"
  | "moderate"
  | "active"
  | "very-active";

type FormData = {
  name: string;
  age: string;
  gender: Gender;
  heightCm: string;
  weightKg: string;
  goal: Goal;
  activityLevel: ActivityLevel;
};

type NutritionResult = {
  bmr: number;
  maintenanceCalories: number;
  targetCalories: number;
  proteinGrams: number;
  fatGrams: number;
  carbohydrateGrams: number;
};

const activityMultipliers: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  "very-active": 1.9,
};

const goalAdjustments: Record<Goal, number> = {
  lose: -350,
  maintain: 0,
  gain: 300,
};

const initialFormData: FormData = {
  name: "",
  age: "",
  gender: "male",
  heightCm: "",
  weightKg: "",
  goal: "lose",
  activityLevel: "moderate",
};

function calculateNutrition(formData: FormData): NutritionResult {
  const age = Number(formData.age);
  const heightCm = Number(formData.heightCm);
  const weightKg = Number(formData.weightKg);

  const genderAdjustment = formData.gender === "male" ? 5 : -161;

  const bmr =
    10 * weightKg + 6.25 * heightCm - 5 * age + genderAdjustment;

  const maintenanceCalories =
    bmr * activityMultipliers[formData.activityLevel];

  const targetCalories = Math.max(
    1200,
    maintenanceCalories + goalAdjustments[formData.goal],
  );

  const proteinMultiplier =
    formData.goal === "gain" ? 1.8 : formData.goal === "lose" ? 1.7 : 1.6;

  const proteinGrams = weightKg * proteinMultiplier;
  const fatGrams = weightKg * 0.8;

  const proteinCalories = proteinGrams * 4;
  const fatCalories = fatGrams * 9;

  const carbohydrateGrams = Math.max(
    0,
    (targetCalories - proteinCalories - fatCalories) / 4,
  );

  return {
    bmr: Math.round(bmr),
    maintenanceCalories: Math.round(maintenanceCalories),
    targetCalories: Math.round(targetCalories),
    proteinGrams: Math.round(proteinGrams),
    fatGrams: Math.round(fatGrams),
    carbohydrateGrams: Math.round(carbohydrateGrams),
  };
}

export default function OnboardingPage() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [result, setResult] = useState<NutritionResult | null>(null);
  const [error, setError] = useState("");

  function updateField<Key extends keyof FormData>(
    field: Key,
    value: FormData[Key],
  ) {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const age = Number(formData.age);
    const heightCm = Number(formData.heightCm);
    const weightKg = Number(formData.weightKg);

    if (!formData.name.trim()) {
      setError("Lütfen adını yaz.");
      return;
    }

    if (!Number.isFinite(age) || age < 18 || age > 80) {
      setError("Bu ilk sürüm yalnızca 18–80 yaş arası yetişkinler içindir.");
      return;
    }

    if (!Number.isFinite(heightCm) || heightCm < 130 || heightCm > 230) {
      setError("Lütfen 130–230 cm arasında geçerli bir boy gir.");
      return;
    }

    if (!Number.isFinite(weightKg) || weightKg < 35 || weightKg > 300) {
      setError("Lütfen 35–300 kg arasında geçerli bir kilo gir.");
      return;
    }

    setResult(calculateNutrition(formData));
  }

  function resetForm() {
    setResult(null);
    setError("");
  }

  return (
    <main className="min-h-screen bg-[#f7faf7] px-5 py-8 text-zinc-950 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-600 font-bold text-white">
              CC
            </div>

            <div>
              <p className="font-semibold leading-none">Cihad Çoban</p>
              <p className="mt-1 text-xs text-zinc-500">Nutrition</p>
            </div>
          </Link>

          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-700">
            Kişisel plan oluşturma
          </span>
        </header>

        <section className="grid gap-10 py-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="lg:sticky lg:top-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
              İlk adım
            </p>

            <h1 className="mt-4 text-4xl font-bold tracking-[-0.04em] sm:text-5xl">
              Seni biraz
              <span className="block text-emerald-600">tanıyalım.</span>
            </h1>

            <p className="mt-6 max-w-lg text-lg leading-8 text-zinc-600">
              Günlük enerji ve makro hedeflerini hesaplayabilmemiz için temel
              bilgilerini gir. Bu hesaplama ilk tahmindir ve tıbbi değerlendirme
              yerine geçmez.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Bilgilerin üzerinden tahmini kalori hedefi",
                "Hedefine göre protein, yağ ve karbonhidrat dağılımı",
                "Sonraki aşamada kişiselleştirilmiş öğün planı",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                    ✓
                  </span>
                  <p className="text-zinc-600">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[32px] border border-zinc-200 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-9">
            {!result ? (
              <form onSubmit={handleSubmit} className="space-y-7">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Adın
                  </label>

                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(event) =>
                      updateField("name", event.target.value)
                    }
                    placeholder="Örneğin Cihad"
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="age"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Yaş
                    </label>

                    <input
                      id="age"
                      type="number"
                      min="18"
                      max="80"
                      value={formData.age}
                      onChange={(event) =>
                        updateField("age", event.target.value)
                      }
                      placeholder="24"
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="gender"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Hesaplama kategorisi
                    </label>

                    <select
                      id="gender"
                      value={formData.gender}
                      onChange={(event) =>
                        updateField("gender", event.target.value as Gender)
                      }
                      className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                    >
                      <option value="male">Erkek</option>
                      <option value="female">Kadın</option>
                    </select>
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="height"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Boy
                    </label>

                    <div className="relative">
                      <input
                        id="height"
                        type="number"
                        min="130"
                        max="230"
                        value={formData.heightCm}
                        onChange={(event) =>
                          updateField("heightCm", event.target.value)
                        }
                        placeholder="178"
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 pr-14 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                        cm
                      </span>
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="weight"
                      className="mb-2 block text-sm font-semibold"
                    >
                      Kilo
                    </label>

                    <div className="relative">
                      <input
                        id="weight"
                        type="number"
                        min="35"
                        max="300"
                        step="0.1"
                        value={formData.weightKg}
                        onChange={(event) =>
                          updateField("weightKg", event.target.value)
                        }
                        placeholder="82"
                        className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 pr-14 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                        kg
                      </span>
                    </div>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="goal"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Hedefin
                  </label>

                  <select
                    id="goal"
                    value={formData.goal}
                    onChange={(event) =>
                      updateField("goal", event.target.value as Goal)
                    }
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  >
                    <option value="lose">Kilo vermek</option>
                    <option value="maintain">Kiloyu korumak</option>
                    <option value="gain">Kilo almak</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="activity"
                    className="mb-2 block text-sm font-semibold"
                  >
                    Günlük hareket seviyen
                  </label>

                  <select
                    id="activity"
                    value={formData.activityLevel}
                    onChange={(event) =>
                      updateField(
                        "activityLevel",
                        event.target.value as ActivityLevel,
                      )
                    }
                    className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                  >
                    <option value="sedentary">
                      Hareketsiz — masa başı yaşam
                    </option>
                    <option value="light">
                      Hafif hareketli — haftada 1–3 antrenman
                    </option>
                    <option value="moderate">
                      Orta hareketli — haftada 3–5 antrenman
                    </option>
                    <option value="active">
                      Çok hareketli — haftada 6–7 antrenman
                    </option>
                    <option value="very-active">
                      Yoğun — ağır fiziksel iş veya çift antrenman
                    </option>
                  </select>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                  >
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full rounded-2xl bg-emerald-600 px-6 py-4 font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 active:scale-[0.99]"
                >
                  Planımı hesapla
                </button>

                <p className="text-center text-xs leading-5 text-zinc-400">
                  Bu araç genel bilgilendirme amaçlı tahmin üretir. Hastalık,
                  gebelik, ilaç kullanımı veya özel beslenme gereksinimlerinde
                  sağlık uzmanına danışılmalıdır.
                </p>
              </form>
            ) : (
              <div>
                <div className="flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                  ✓
                </div>

                <p className="mt-6 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                  İlk hedeflerin hazır
                </p>

                <h2 className="mt-3 text-3xl font-bold tracking-tight">
                  Harika, {formData.name}.
                </h2>

                <p className="mt-3 leading-7 text-zinc-600">
                  Girdiğin bilgilere göre başlangıç için oluşturduğumuz tahmini
                  günlük değerler aşağıda.
                </p>

                <div className="mt-8 rounded-3xl bg-zinc-950 p-6 text-white">
                  <p className="text-sm text-zinc-400">
                    Günlük kalori hedefin
                  </p>

                  <p className="mt-2 text-5xl font-bold">
                    {result.targetCalories.toLocaleString("tr-TR")}
                    <span className="ml-2 text-base font-normal text-zinc-400">
                      kcal
                    </span>
                  </p>

                  <div className="mt-6 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs text-zinc-400">Bazal metabolizma</p>
                      <p className="mt-2 font-bold">
                        {result.bmr.toLocaleString("tr-TR")} kcal
                      </p>
                    </div>

                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-xs text-zinc-400">Koruma tahmini</p>
                      <p className="mt-2 font-bold">
                        {result.maintenanceCalories.toLocaleString("tr-TR")} kcal
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      label: "Protein",
                      value: `${result.proteinGrams} g`,
                      detail: "Günlük hedef",
                    },
                    {
                      label: "Karbonhidrat",
                      value: `${result.carbohydrateGrams} g`,
                      detail: "Günlük hedef",
                    },
                    {
                      label: "Yağ",
                      value: `${result.fatGrams} g`,
                      detail: "Günlük hedef",
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-2xl border border-zinc-200 bg-zinc-50 p-5"
                    >
                      <p className="text-sm text-zinc-500">{item.label}</p>
                      <p className="mt-2 text-2xl font-bold">{item.value}</p>
                      <p className="mt-1 text-xs text-zinc-400">{item.detail}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  Bu sonuç bir başlangıç tahminidir. Vücut ağırlığı ve günlük
                  enerji düzeyi takip edilerek sonraki haftalarda yeniden
                  ayarlanmalıdır.
                </div>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <Link
                    href="/dashboard"
                    className="flex-1 rounded-2xl bg-emerald-600 px-6 py-4 text-center font-semibold text-white transition hover:bg-emerald-700"
                  >
                    Beslenme planımı oluştur
                  </Link>

                  <button
                    type="button"
                    onClick={resetForm}
                    className="rounded-2xl border border-zinc-300 px-6 py-4 font-semibold transition hover:bg-zinc-50"
                  >
                    Bilgileri düzenle
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}