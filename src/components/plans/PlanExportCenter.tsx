"use client";

import { useEffect, useMemo, useState } from "react";

type Meal = {
  title: string;
  time?: string;
  foods: string[];
  calories?: number;
  alternative?: string;
};

type Plan = {
  id: string;
  title: string;
  summary?: string;
  target_calories: number;
  meals: Meal[];
  status?: string;
  created_at: string;
};

type Profile = {
  full_name?: string | null;
  nutrition_result?: {
    targetCalories?: number;
    proteinGrams?: number;
    carbohydrateGrams?: number;
    fatGrams?: number;
  } | null;
};

type PlansResponse = {
  plans?: Plan[];
};

type ProfileResponse = {
  profile?: Profile | null;
  full_name?: string | null;
  nutrition_result?: Profile["nutrition_result"];
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function downloadPlanPdf(plan: Plan, profile: Profile | null) {
  const popup = window.open("", "_blank", "width=900,height=1100");
  if (!popup) return;

  const name = profile?.full_name || "Danışan";
  const meals = plan.meals
    .map(
      (meal) => `
        <section class="meal">
          <div class="meal-head">
            <h2>${escapeHtml(meal.title)}</h2>
            <span>${escapeHtml(meal.time || "")}</span>
          </div>
          <ul>${meal.foods.map((food) => `<li>${escapeHtml(food)}</li>`).join("")}</ul>
          ${meal.calories ? `<p class="calorie">Yaklaşık ${meal.calories} kcal</p>` : ""}
          ${meal.alternative ? `<p class="alternative"><b>Alternatif:</b> ${escapeHtml(meal.alternative)}</p>` : ""}
        </section>`,
    )
    .join("");

  popup.document.write(`<!doctype html>
  <html lang="tr"><head><meta charset="utf-8"><title>${escapeHtml(plan.title)}</title>
  <style>
    @page { size: A4; margin: 18mm; }
    * { box-sizing: border-box; }
    body { font-family: Arial, sans-serif; color: #173b2d; margin: 0; background: white; }
    .brand { display:flex; justify-content:space-between; align-items:center; padding-bottom:18px; border-bottom:3px solid #16915f; }
    .brand h1 { margin:0; font-size:24px; }
    .brand span { color:#16915f; font-weight:800; letter-spacing:.08em; }
    .intro { padding:22px 0 10px; }
    .intro h2 { margin:0 0 8px; font-size:22px; }
    .intro p { margin:5px 0; color:#51645c; line-height:1.6; }
    .meta { display:grid; grid-template-columns:repeat(3,1fr); gap:10px; margin:18px 0 24px; }
    .meta div { border:1px solid #d8e5de; border-radius:12px; padding:12px; }
    .meta small { display:block; color:#718078; margin-bottom:4px; }
    .meta b { font-size:16px; }
    .meal { border:1px solid #d8e5de; border-radius:16px; padding:16px; margin:0 0 14px; break-inside:avoid; }
    .meal-head { display:flex; justify-content:space-between; align-items:center; }
    .meal h2 { margin:0; font-size:18px; }
    .meal-head span { color:#16915f; font-weight:700; }
    ul { margin:12px 0; padding-left:20px; }
    li { margin:7px 0; line-height:1.45; }
    .calorie { color:#16915f; font-weight:700; }
    .alternative { background:#f2f8f5; padding:10px 12px; border-radius:10px; color:#40534a; }
    footer { margin-top:24px; padding-top:14px; border-top:1px solid #d8e5de; color:#718078; font-size:11px; line-height:1.5; }
    .print-note { position:fixed; top:12px; right:12px; background:#16915f; color:white; border:0; border-radius:999px; padding:10px 16px; font-weight:700; cursor:pointer; }
    @media print { .print-note { display:none; } }
  </style></head><body>
    <button class="print-note" onclick="window.print()">PDF olarak kaydet</button>
    <header class="brand"><h1>Cihad Çoban Nutrition</h1><span>KİŞİYE ÖZEL BESLENME</span></header>
    <section class="intro">
      <h2>${escapeHtml(plan.title)}</h2>
      <p><b>${escapeHtml(name)}</b> için hazırlanmıştır.</p>
      <p>${escapeHtml(plan.summary || "Kişisel hedeflerinize göre oluşturulmuş beslenme programı.")}</p>
    </section>
    <div class="meta">
      <div><small>Günlük enerji</small><b>${plan.target_calories} kcal</b></div>
      <div><small>Oluşturulma tarihi</small><b>${new Date(plan.created_at).toLocaleDateString("tr-TR")}</b></div>
      <div><small>Durum</small><b>${plan.status === "active" ? "Aktif program" : "Program"}</b></div>
    </div>
    ${meals}
    <footer>
      Bu belge Cihad Çoban Nutrition platformu tarafından oluşturulmuştur. Program kişiye özeldir; sağlık durumunuz veya kullandığınız ilaçlar değişirse diyetisyeninize danışın.
    </footer>
    <script>setTimeout(() => window.print(), 350);</script>
  </body></html>`);
  popup.document.close();
}

export function PlanExportCenter() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [plansResponse, profileResponse] = await Promise.all([
          fetch("/api/plans", { cache: "no-store", credentials: "include" }),
          fetch("/api/profile", { cache: "no-store", credentials: "include" }),
        ]);

        const planData: PlansResponse = plansResponse.ok
          ? await plansResponse.json()
          : { plans: [] };

        const profileData: ProfileResponse = profileResponse.ok
          ? await profileResponse.json()
          : {};

        setPlans(planData.plans ?? []);
        setProfile(profileData.profile ?? profileData ?? null);
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  const nutrition = profile?.nutrition_result;
  const calories = nutrition?.targetCalories || plans[0]?.target_calories || 0;
  const protein = nutrition?.proteinGrams || Math.round((calories * 0.25) / 4);
  const carbs = nutrition?.carbohydrateGrams || Math.round((calories * 0.45) / 4);
  const fat = nutrition?.fatGrams || Math.round((calories * 0.30) / 9);

  const maxMacro = useMemo(() => Math.max(protein, carbs, fat, 1), [protein, carbs, fat]);

  if (loading || (!calories && plans.length === 0)) return null;

  return (
    <section className="shell-wide pt-8">
      <div className="rounded-[28px] border border-emerald-900/10 bg-white p-6 shadow-[0_20px_60px_rgba(20,65,45,.08)] lg:p-8">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between border-b border-emerald-600 pb-4">
              <h2 className="text-xl font-bold text-emerald-950">Beslenme raporun</h2>
              <span className="text-sm font-extrabold text-emerald-600">Cihad Çoban Nutrition</span>
            </div>
            <div className="mt-5 flex items-end justify-between gap-4">
              <span className="text-slate-600">Günlük enerji hedefi</span>
              <b className="text-3xl text-emerald-950">{calories.toLocaleString("tr-TR")} kcal</b>
            </div>
            {[
              ["Protein", protein, "bg-emerald-500"],
              ["Karbonhidrat", carbs, "bg-amber-500"],
              ["Yağ", fat, "bg-slate-500"],
            ].map(([label, value, color]) => (
              <div className="mt-5" key={String(label)}>
                <div className="mb-2 flex justify-between"><span>{label}</span><b>{value} g</b></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.max(18, (Number(value) / maxMacro) * 100)}%` }} /></div>
              </div>
            ))}
            <p className="mt-5 border-t pt-4 text-sm text-slate-500">Değerler profilindeki enerji hedefi ve makro dağılımına göre kişisel olarak hesaplanır.</p>
          </div>

          <div className="w-full lg:max-w-md">
            <h3 className="text-lg font-bold text-emerald-950">Programlarını PDF indir</h3>
            <p className="mt-1 text-sm text-slate-500">Her belge marka adı, hedef kalori, öğünler ve alternatiflerle düzenli A4 formatında hazırlanır.</p>
            <div className="mt-4 space-y-3">
              {plans.map((plan) => (
                <div key={plan.id} className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-900/10 bg-emerald-50/50 p-4">
                  <div className="min-w-0"><b className="block truncate text-emerald-950">{plan.title}</b><small className="text-slate-500">{plan.target_calories} kcal · {new Date(plan.created_at).toLocaleDateString("tr-TR")}</small></div>
                  <button type="button" onClick={() => downloadPlanPdf(plan, profile)} className="button button-primary button-small shrink-0">PDF indir</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
