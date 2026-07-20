import Link from "next/link";

import { SiteHeader } from "@/components/layout/SiteHeader";
import { isMembershipTier, membershipPlans } from "@/lib/payments/plans";

type CheckoutResultPageProps = {
  searchParams: Promise<{ status?: string; tier?: string }>;
};

export default async function CheckoutResultPage({ searchParams }: CheckoutResultPageProps) {
  const params = await searchParams;
  const success = params.status === "success";
  const plan = isMembershipTier(params.tier) ? membershipPlans[params.tier] : null;

  return (
    <>
      <SiteHeader variant="simple" />
      <main className="shell-wide py-12 lg:py-20">
        <section className="mx-auto max-w-2xl rounded-[30px] border border-emerald-950/10 bg-white p-8 text-center shadow-sm lg:p-12">
          <p className="eyebrow justify-center"><span /> Ödeme sonucu</p>
          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-emerald-950">
            {success ? "Ödeme başarılı." : "Ödeme tamamlanamadı."}
          </h1>
          <p className="mt-5 leading-8 text-slate-600">
            {success
              ? `${plan?.name || "Seçilen"} paketin hesabına tanımlandı.`
              : "Ödeme sağlayıcısından başarılı dönüş alınamadı. Üyeliğin değiştirilmedi."}
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href={success ? "/plans" : "/pricing"} className="button button-primary">
              {success ? "Programlarıma git" : "Paketlere dön"}
            </Link>
            <Link href="/dashboard" className="button button-secondary">Kontrol merkezi</Link>
          </div>
        </section>
      </main>
    </>
  );
}

