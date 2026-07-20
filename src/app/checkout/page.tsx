import Link from "next/link";
import { redirect } from "next/navigation";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { membershipPlans, isMembershipTier } from "@/lib/payments/plans";
import { createClient } from "@/lib/supabase/server";
import { CheckoutPayment } from "./CheckoutPayment";

type CheckoutPageProps = {
  searchParams: Promise<{ tier?: string }>;
};

export default async function CheckoutPage({ searchParams }: CheckoutPageProps) {
  const params = await searchParams;
  if (!isMembershipTier(params.tier)) redirect("/pricing");

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const next = `/checkout?tier=${params.tier}`;

  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);

  const plan = membershipPlans[params.tier];

  return (
    <>
      <SiteHeader variant="simple" />
      <main className="shell-wide py-12 lg:py-20">
        <section className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[1fr_.85fr] lg:items-start">
          <div>
            <p className="eyebrow"><span /> Güvenli ödeme</p>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-emerald-950 lg:text-6xl">Ödeme tamamlanınca paketin açılır.</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              {plan.name} paketi seçildi. Devam ettiğinde iyzico güvenli ödeme sayfası açılır; başarılı ödeme doğrulanmadan üyelik hesabına tanımlanmaz.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-900/10 bg-white p-4"><b className="text-emerald-950">1</b><p className="mt-2 text-sm leading-6 text-slate-600">Paket seçilir.</p></div>
              <div className="rounded-2xl border border-emerald-900/10 bg-white p-4"><b className="text-emerald-950">2</b><p className="mt-2 text-sm leading-6 text-slate-600">iyzico ödeme ekranı açılır.</p></div>
              <div className="rounded-2xl border border-emerald-900/10 bg-white p-4"><b className="text-emerald-950">3</b><p className="mt-2 text-sm leading-6 text-slate-600">Başarılı ödeme sonrası paket aktif olur.</p></div>
            </div>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/pricing" className="button button-secondary">Paketlere dön</Link>
            </div>
          </div>

          <aside className="space-y-6">
          <div className="rounded-[30px] border border-emerald-950/10 bg-white p-8 shadow-sm">
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
          </div>
          <CheckoutPayment planName={plan.name} price={plan.price} tier={plan.tier} />
          </aside>
        </section>
      </main>
    </>
  );
}
