import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Oturum gerekli." }, { status: 401 }) };
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (me?.role !== "admin") return { error: NextResponse.json({ error: "Yetkisiz." }, { status: 403 }) };
  return { error: null };
}

export async function POST(request: Request,{ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id: userId } = await params;
  const body = await request.json().catch(() => ({}));
  const title = String(body.title ?? "").trim();
  const summary = String(body.summary ?? "").trim().slice(0, 1200);
  const targetCalories = Number(body.targetCalories);
  const status = body.status === "archived" ? "archived" : "active";
  if (title.length < 2) return NextResponse.json({ error: "Program adı en az 2 karakter olmalı." }, { status: 400 });
  if (!Number.isInteger(targetCalories) || targetCalories < 500 || targetCalories > 10000) return NextResponse.json({ error: "Kalori hedefi 500 ile 10000 arasında olmalı." }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin.from("diet_plans").insert({ user_id: userId, title, summary: summary || null, target_calories: targetCalories, meals: [], status }).select("id,title,status,created_at,target_calories").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("notifications").insert({
    user_id: userId,
    title: "Yeni beslenme programın hazır",
    body: `${title} hesabına diyetisyenin tarafından eklendi.`,
    type: "plan",
    href: "/plans",
  });

  return NextResponse.json({ ok: true, plan: data }, { status: 201 });
}

export async function DELETE(request: Request,{ params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;
  const { id: userId } = await params;
  const url = new URL(request.url);
  const planId = url.searchParams.get("planId");
  if (!planId) return NextResponse.json({ error: "Program kimliği eksik." }, { status: 400 });
  const admin = createAdminClient();
  const { error } = await admin.from("diet_plans").delete().eq("id", planId).eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}