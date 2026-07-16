"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { SavedNutritionProfile } from "@/features/onboarding/types";

const STORAGE_KEY = "cc-nutrition-profile";

export default function DashboardPage() {
  const [profile, setProfile] = useState<SavedNutritionProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedProfile = localStorage.getItem(STORAGE_KEY);

    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile) as SavedNutritionProfile);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
    }

    setLoaded(true);
  }, []);

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
        <div className="max-w-lg rounded-4xl border border-zinc-200 bg-white p-8 text-center shadow-xl shadow-emerald-950/5">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
            CC
          </div>
          <h1 className="mt-6 text-3xl font-bold">Henüz planın bulunmuyor</h1>
          <p className="mt-3 leading-7 text-zinc-600">
            Dashboard’unu görüntülemek için önce kişisel bilgilerini girerek
            başlangıç hedeflerini oluştur.
          </p>
          <Link
            href="/onboarding"
            className="mt-7 inline-flex rounded-2xl bg-emerald-600 px-6 py-4 font-semibold text-white transition hover:bg-emerald-700"
          >
            Planımı oluştur
          </Link>
        </div>
      </main>
    );
  }

  const { formData, result } = profile;

  return (
    <main className="min-h-screen bg-[#f7faf7] px-5 py-7 text-zinc-950 sm:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-600 font-bold text-white">
              CC
            </div>
            <div>
              <p className="font-semibold leading-none">Cihad Çoban</p>
              <p className="mt-1 text-xs text-zinc-500">Nutrition</p>
            </div>
          </Link>

          <Link
            href="/onboarding"
            className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold transition hover:border-emerald-500 hover:text-emerald-700"
          >
            Bilgileri güncelle
          </Link>
        </header>

        <section className="py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Kişisel panelin
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
            Günaydın, {formData.name} 👋
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-zinc-600">
            Günlük hedeflerin hazır. İlerleyen adımlarda öğün kaydı, su takibi
            ve kişisel menü burada yer alacak.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-4xl bg-zinc-950 p-7 text-white sm:p-9">
            <p className="text-sm text-zinc-400">Günlük kalori hedefi</p>
            <p className="mt-3 text-5xl font-bold">
              {result.targetCalories.toLocaleString("tr-TR")}
              <span className="ml-2 text-base font-normal text-zinc-400">
                kcal
              </span>
            </p>

            <div className="mt-9 grid gap-3 sm:grid-cols-3">
              {[
                ["Protein", `${result.proteinGrams} g`],
                ["Karbonhidrat", `${result.carbohydrateGrams} g`],
                ["Yağ", `${result.fatGrams} g`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-2xl bg-white/10 p-5">
                  <p className="text-xs text-zinc-400">{label}</p>
                  <p className="mt-2 text-xl font-bold">{value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-4xl border border-emerald-200 bg-emerald-50 p-7">
            <p className="text-sm font-semibold text-emerald-800">
              AI önerin
            </p>
            <h2 className="mt-3 text-2xl font-bold text-emerald-950">
              İlk gün hedefi
            </h2>
            <p className="mt-3 leading-7 text-emerald-900/75">
              Bugün yalnızca yediklerini doğru şekilde kaydetmeye odaklan.
              Mükemmel olmaya değil, düzenli takip yapmaya çalış.
            </p>
          </div>
        </section>

        <section className="mt-5 grid gap-5 md:grid-cols-3">
          {[
            {
              title: "Bazal metabolizma",
              value: `${result.bmr.toLocaleString("tr-TR")} kcal`,
              description: "Vücudunun dinlenme hâlindeki tahmini ihtiyacı.",
            },
            {
              title: "Koruma kalorisi",
              value: `${result.maintenanceCalories.toLocaleString("tr-TR")} kcal`,
              description: "Mevcut ağırlığı korumaya yönelik tahmin.",
            },
            {
              title: "Hedef",
              value:
                formData.goal === "lose"
                  ? "Kilo vermek"
                  : formData.goal === "gain"
                    ? "Kilo almak"
                    : "Kiloyu korumak",
              description: "Programının başlangıç yönü.",
            },
          ].map((card) => (
            <article
              key={card.title}
              className="rounded-3xl border border-zinc-200 bg-white p-6"
            >
              <p className="text-sm text-zinc-500">{card.title}</p>
              <p className="mt-3 text-2xl font-bold">{card.value}</p>
              <p className="mt-3 text-sm leading-6 text-zinc-500">
                {card.description}
              </p>
            </article>
          ))}
        </section>

        <section className="mt-5 rounded-4xl border border-zinc-200 bg-white p-7 sm:p-9">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                Sonraki özellik
              </p>
              <h2 className="mt-3 text-3xl font-bold">
                Günlük öğün takibi
              </h2>
            </div>
            <span className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-500">
              Yakında
            </span>
          </div>

          <p className="mt-4 max-w-2xl leading-7 text-zinc-600">
            Bir sonraki geliştirme adımında kahvaltı, öğle, akşam ve ara
            öğünleri ekleyebileceğin gerçek takip sistemini kuracağız.
          </p>
        </section>
      </div>
    </main>
  );
}
