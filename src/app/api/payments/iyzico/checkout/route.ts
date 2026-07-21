import { NextResponse } from "next/server";

import { hasAdminPanelAccess } from "@/lib/roles";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { initializeIyzicoCheckout, getIyzicoConfig } from "@/lib/payments/iyzico";
import { isMembershipTier, membershipPlans } from "@/lib/payments/plans";

export const runtime = "nodejs";

function splitName(value: string | null | undefined, email: string | undefined) {
  const fallback = email?.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "Kullanıcı";
  const parts = (value?.trim() || fallback).split(/\s+/).filter(Boolean);
  return {
    name: parts[0] || "Kullanıcı",
    surname: parts.slice(1).join(" ") || "Üye",
  };
}

function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Ödeme başlatmak için giriş yapmalısın." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { tier?: string };
  if (!isMembershipTier(body.tier)) {
    return NextResponse.json({ error: "Geçersiz üyelik paketi." }, { status: 400 });
  }

  if (!getIyzicoConfig()) {
    return NextResponse.json(
      { error: "Iyzico API anahtarları eksik. Vercel ortamına IYZICO_API_KEY ve IYZICO_SECRET_KEY eklenince bu buton gerçek ödeme sayfasını açacak." },
      { status: 503 },
    );
  }

  const admin = createAdminClient();
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("full_name, role, membership_tier")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) return NextResponse.json({ error: profileError.message }, { status: 500 });
  if (hasAdminPanelAccess(profile?.role)) {
    return NextResponse.json({ error: "Panel yetkili hesaplarında ödeme ile üyelik paketi değiştirilemez." }, { status: 403 });
  }
  if (profile?.membership_tier === body.tier) {
    return NextResponse.json({ error: "Bu paket zaten hesabında aktif." }, { status: 409 });
  }

  const plan = membershipPlans[body.tier];
  const buyer = splitName(profile?.full_name, user.email);
  const origin = new URL(request.url).origin;
  const callbackUrl = `${origin}/api/payments/iyzico/callback`;
  const conversationId = ["membership", body.tier, user.id, Date.now()].join(":");
  const result = await initializeIyzicoCheckout({
    buyer: {
      id: user.id,
      email: user.email || "uye@example.com",
      ip: clientIp(request),
      ...buyer,
    },
    callbackUrl,
    conversationId,
    plan,
  });

  if (result.status !== "success") {
    return NextResponse.json(
      { error: result.errorMessage || "Iyzico ödeme sayfası başlatılamadı." },
      { status: 502 },
    );
  }

  return NextResponse.json({
    checkoutFormContent: result.checkoutFormContent,
    paymentPageUrl: result.paymentPageUrl,
    token: result.token,
  });
}
