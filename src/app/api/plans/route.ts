import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const { data, error } = await supabase.from("diet_plans").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) {
    const missingTable = error.code === "PGRST205" || error.code === "42P01" || error.message.toLowerCase().includes("does not exist");
    return NextResponse.json({ error: missingTable ? "Veritabanı tabloları kurulmamış. Supabase SQL Editor'da supabase/schema.sql dosyasını çalıştırın." : error.message, code: error.code ?? null }, { status: missingTable ? 503 : 500 });
  }
  return NextResponse.json({ plans: data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("role,membership_tier").eq("id", user.id).maybeSingle();
  const tier = profile?.membership_tier || "standard";
  const isAdmin = profile?.role === "admin";
  const monthlyLimit = tier === "clinic" || isAdmin ? null : tier === "pro" ? 20 : 2;

  if (monthlyLimit !== null) {
    const start = new Date();
    start.setDate(1); start.setHours(0, 0, 0, 0);
    const { count } = await admin.from("diet_plans").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", start.toISOString());
    if ((count ?? 0) >= monthlyLimit) {
      return NextResponse.json({ error: `${tier === "pro" ? "PRO" : "Standart"} paketinde aylık ${monthlyLimit} program oluşturabilirsin. Daha yüksek paket için Üyelikler sayfasına geç.` }, { status: 403 });
    }
  }

  const body = await request.json();
  await supabase.from("diet_plans").update({ status: "archived" }).eq("user_id", user.id).eq("status", "active");
  const { data, error } = await supabase.from("diet_plans").insert({
    user_id: user.id, title: body.title, summary: body.summary,
    target_calories: body.targetCalories, meals: body.meals, status: "active"
  }).select().single();
  if (error) {
    const missingTable = error.code === "PGRST205" || error.code === "42P01" || error.message.toLowerCase().includes("does not exist");
    return NextResponse.json({ error: missingTable ? "Veritabanı tabloları kurulmamış. Supabase SQL Editor'da supabase/schema.sql dosyasını çalıştırın." : error.message, code: error.code ?? null }, { status: missingTable ? 503 : 500 });
  }
  return NextResponse.json({ plan: data }, { status: 201 });
}
