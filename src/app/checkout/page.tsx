import Link from "next/link";
import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { createClient } from "@/lib/supabase/server";

type Tier = "standard" | "pro" | "clinic";

const plans: Record<Tier, { name: string; price: number; description: string; features: string[] }> = {
  standard: {
    name: "Standart",
    price: 349,
    description: "Temel takip ve düzenli program kullanımı için.",
    features: ["Ayda 2 yeni program", "PDF indirme", "Öğün, kilo ve su takibi"],
  },
  pro: {
    name: "PRO",
    price: 699,
    description: "Daha sık plan oluşturan ve ayrıntılı analiz isteyenler için.",
    features: ["Ayda 20 yeni program", "Gelişmiş makro raporları", "Öncelikli destek"],
  },
  clinic: {
    name: "Klinik",
    price: 1299,
    description: "Diyetisyenle yoğun çalışan ve sınırsız kullanım isteyenler için.",
    features: ["Sınırsız program", "Özel program atama", "Öncelikli diyetisyen iletişimi"],
  },
};

type CheckoutPageProps = {
  searchParams: Promise<{ tier?: string }>;
};

function isTier(value: string | undefined): value is Tier {
  return value === "standard" || value === "pro" || value === "clinic";
}

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  if (!isTier(params.tier)) redirect("/pricing");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const next = `/checkout?tier=${params.tier}`;

  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);

  const plan = plans[params.tier];

  return (
    <>
      <SiteHeader variant="simple" />
      <main className="shell-wide py-12 lg:py-20">
        <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_.85fr] lg:items-start">
          <div>
            <p className="eyebrow"><span /> Güvenli ödeme</p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-emerald-950 lg:text-6xl">Ödeme tamamlanınca paketin açılır.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              {plan.name} paketi seçildi. Bu ekranda ödeme sağlayıcısı bağlanmadan üyelik hesabına tanımlanmaz.
            </p>
            <div className="mt-8 rounded-[28px] border border-amber-200 bg-amber-50 p-6 text-amber-950">
              <b className="text-lg">Ödeme entegrasyonu bekleniyor</b>
              <p className="mt-2 leading-7 text-amber-900">
                Iyzico API anahtarları tanımlanınca bu adım kullanıcıyı güvenli ödeme formuna yönlendirecek. Başarılı ödeme doğrulanmadan üyelik güncellenmeyecek.
              </p>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <button type="button" disabled className="button button-primary disabled:cursor-not-allowed disabled:opacity-60">
                Ödeme altyapısı hazırlanıyor
              </button>
              <Link href="/pricing" className="button button-secondary">Paketlere dön</Link>
            </div>
          </div>

          <aside className="rounded-[30px] border border-emerald-950/10 bg-white p-8 shadow-sm">
            <p className="text-sm font-bold uppercase tracking-[.18em] text-slate-500">Seçilen paket</p>
            <h2 className="mt-4 text-3xl font-bold text-emerald-950">{plan.name}</h2>
            <div className="mt-5 flex items-end gap-1 text-emerald-950">
              <b className="text-5xl">₺{plan.price}</b>
              <span className="text-slate-500">/ay</span>
            </div>
            <p className="mt-5 leading-7 text-slate-600">{plan.description}</p>
            <ul className="mt-7 space-y-4">
              {plan.features.map((feature) => (
                <li key={feature} className="flex gap-3 text-emerald-950">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs">✓</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </aside>
        </section>
      </main>
    </>
  );
}
