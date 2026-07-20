"use client";

import { useState } from "react";

import type { MembershipTier } from "@/lib/payments/plans";

type CheckoutPaymentProps = {
  planName: string;
  price: number;
  tier: MembershipTier;
};

type CheckoutResponse = {
  checkoutFormContent?: string;
  error?: string;
  paymentPageUrl?: string;
};

export function CheckoutPayment({ planName, price, tier }: CheckoutPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkoutFormContent, setCheckoutFormContent] = useState("");

  async function startPayment() {
    setLoading(true);
    setError("");
    setCheckoutFormContent("");

    try {
      const response = await fetch("/api/payments/iyzico/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tier }),
      });
      const data = (await response.json().catch(() => ({}))) as CheckoutResponse;

      if (!response.ok) {
        setError(data.error || "Ödeme başlatılamadı.");
        return;
      }

      if (data.paymentPageUrl) {
        window.location.assign(data.paymentPageUrl);
        return;
      }

      if (data.checkoutFormContent) {
        setCheckoutFormContent(data.checkoutFormContent);
        return;
      }

      setError("Iyzico ödeme sayfası döndürmedi.");
    } catch {
      setError("Bağlantı hatası oluştu. Lütfen tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[30px] border border-emerald-950/10 bg-white p-6 shadow-sm lg:p-8">
      <p className="text-sm font-bold uppercase tracking-[.18em] text-slate-500">Ödeme yöntemi</p>
      <h2 className="mt-4 text-2xl font-bold text-emerald-950">iyzico güvenli ödeme</h2>
      <p className="mt-3 leading-7 text-slate-600">
        Kart bilgilerini Cihad Çoban Nutrition değil, iyzico güvenli ödeme ekranı alır. Ödeme başarılı dönmeden üyelik açılmaz.
      </p>

      <div className="mt-6 rounded-2xl border border-emerald-900/10 bg-emerald-50 p-4">
        <div className="flex items-center justify-between gap-4">
          <span className="font-bold text-emerald-950">{planName}</span>
          <b className="text-2xl text-emerald-950">₺{price}</b>
        </div>
        <p className="mt-1 text-sm text-slate-600">Aylık üyelik paketi</p>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      <button
        type="button"
        onClick={startPayment}
        disabled={loading}
        className="button button-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Ödeme sayfası hazırlanıyor..." : "iyzico ile ödemeye geç"}
      </button>

      {checkoutFormContent && (
        <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-900/10 bg-white p-4">
          <div dangerouslySetInnerHTML={{ __html: checkoutFormContent }} />
        </div>
      )}
    </section>
  );
}

