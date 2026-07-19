"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";

type Tier = "standard" | "pro" | "clinic";

const plans: Array<{ id: Tier; name: string; price: number; description: string; popular?: boolean; features: string[] }> = [
  { id: "standard", name: "Standart", price: 349, description: "Temel takip ve düzenli program kullanımı için.", features: ["Ayda 2 yeni program oluşturma", "Diyetisyenin gönderdiği programları görüntüleme", "Her programı markalı PDF olarak indirme", "Öğün, kilo ve su takibi", "Randevu oluşturma ve değişiklik bildirimleri", "Günlük kalori hedefini gösteren temel rapor"] },
  { id: "pro", name: "PRO", price: 699, description: "Daha sık plan oluşturan ve ayrıntılı analiz isteyenler için.", popular: true, features: ["Ayda 20 yeni program oluşturma", "Standart paketteki tüm özellikler", "Protein, karbonhidrat ve yağ analizleri", "Gelişmiş ilerleme ve hedef raporları", "Program ve randevu hatırlatmaları", "Yeni özelliklere ve desteğe öncelikli erişim"] },
  { id: "clinic", name: "Klinik", price: 1299, description: "Diyetisyenle yoğun çalışan ve sınırsız kullanım isteyenler için.", features: ["Sınırsız program oluşturma", "PRO paketteki tüm özellikler", "Diyetisyen tarafından özel program atama", "Tüm geçmiş program ve raporları dışa aktarma", "Randevu ve program değişikliklerinde anlık bildirim", "Öncelikli diyetisyen iletişimi"] },
];

export default function PricingPage() {
  const [selected, setSelected] = useState<Tier>("standard");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState<Tier | null>(null);

  useEffect(() => {
    fetch("/api/membership", { cache: "no-store", credentials: "include" })
      .then((response) => response.ok ? response.json() : { tier: "standard" })
      .then((data: { tier?: Tier }) => setSelected(data.tier || "standard"));
  }, []);

  async function choosePlan(tier: Tier) {
    setSaving(tier); setMessage("");
    const response = await fetch("/api/membership", { method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ tier }) });
    const data = await response.json().catch(() => ({}));
    setSaving(null);
    if (!response.ok) { setMessage(data.error || "Üyelik paketi güncellenemedi."); return; }
    setSelected(tier);
    setMessage(`${plans.find((plan) => plan.id === tier)?.name} üyeliği hesabına tanımlandı.`);
    window.dispatchEvent(new Event("membership-changed"));
  }

  return (
    <>
      <SiteHeader variant="simple" />
      <main className="shell-wide py-12 lg:py-20">
        <section className="mx-auto max-w-3xl text-center">
          <p className="eyebrow justify-center"><span /> Üyelik paketleri</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-emerald-950 lg:text-6xl">Hangi pakette ne kullanacağını net gör.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-slate-600">Paket izinleri hesabına kaydedilir. Standart kullanıcı PRO veya Klinik özelliklerini açamaz.</p>
        </section>
        {message && <div className="mx-auto mt-8 max-w-2xl rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center font-semibold text-emerald-900">{message}</div>}
        <section className="mt-12 grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => {
            const active = selected === plan.id;
            return (
              <article key={plan.id} className={`relative flex min-h-[560px] flex-col rounded-[30px] border p-8 shadow-sm ${plan.popular ? "border-emerald-950 bg-emerald-950 text-white shadow-xl" : "border-emerald-950/10 bg-white text-emerald-950"}`}>
                {plan.popular && <span className="mb-5 w-fit rounded-full bg-emerald-200 px-4 py-2 text-xs font-bold text-emerald-950">En popüler</span>}
                <p className={`text-sm font-bold uppercase tracking-[.18em] ${plan.popular ? "text-emerald-200" : "text-slate-500"}`}>{plan.name}</p>
                <div className="mt-5 flex items-end gap-1"><b className="text-5xl">₺{plan.price}</b><span className={plan.popular ? "text-emerald-200" : "text-slate-500"}>/ay</span></div>
                <p className={`mt-5 min-h-14 leading-6 ${plan.popular ? "text-emerald-100" : "text-slate-600"}`}>{plan.description}</p>
                <ul className="mt-7 space-y-4">{plan.features.map((feature) => <li key={feature} className="flex gap-3"><span className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs ${plan.popular ? "bg-emerald-700" : "bg-emerald-100"}`}>✓</span><span>{feature}</span></li>)}</ul>
                <button type="button" disabled={active || saving !== null} onClick={() => choosePlan(plan.id)} className={`mt-auto rounded-full px-5 py-4 font-bold transition disabled:cursor-not-allowed disabled:opacity-70 ${plan.popular ? "bg-emerald-200 text-emerald-950 hover:bg-white" : "border border-emerald-950 hover:bg-emerald-950 hover:text-white"}`}>{saving === plan.id ? "Kaydediliyor…" : active ? "Mevcut paket" : "Bu paketi seç"}</button>
              </article>
            );
          })}
        </section>
        <section className="mt-10 rounded-[28px] border border-emerald-900/10 bg-emerald-50 p-7 text-center lg:p-10">
          <h2 className="text-2xl font-bold text-emerald-950">PDF tüm paketlerde açık</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-600">Diyetisyenin gönderdiği veya kendin oluşturduğun her programı Cihad Çoban Nutrition markasıyla PDF olarak kaydedebilirsin.</p>
          <Link href="/plans" className="button button-primary mt-6">Programlarıma git</Link>
        </section>
      </main>
    </>
  );
}
