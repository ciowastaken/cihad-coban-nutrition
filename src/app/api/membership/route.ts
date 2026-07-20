import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const tiers = ["standard", "pro", "clinic"] as const;
type Tier = (typeof tiers)[number];

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile, error } = await admin
    .from("profiles")
    .select("role, membership_tier")
    .eq("id", user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    tier: (profile?.membership_tier as Tier | null) ?? "standard",
    role: profile?.role ?? "user",
  });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { tier?: string };
  if (!body.tier || !tiers.includes(body.tier as Tier)) {
    return NextResponse.json({ error: "Geçersiz üyelik paketi." }, { status: 400 });
  }

  return NextResponse.json(
    { error: "Üyelik paketi ödeme tamamlanmadan değiştirilemez. Lütfen ödeme sayfasından devam et." },
    { status: 402 },
  );
}
