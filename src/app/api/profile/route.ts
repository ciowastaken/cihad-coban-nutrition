import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) {
    const missingTable = error.code === "PGRST205" || error.code === "42P01" || error.message.toLowerCase().includes("does not exist");
    return NextResponse.json(
      {
        error: missingTable
          ? "Veritabanı tabloları kurulmamış. Supabase SQL Editor'da supabase/schema.sql dosyasını çalıştırın."
          : error.message,
        code: error.code ?? null,
      },
      { status: missingTable ? 503 : 500 },
    );
  }
  return NextResponse.json({ profile: data });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const body = await request.json();
  const form = body.formData ?? {};
  const payload = {
    id: user.id,
    full_name: form.name || null,
    age: Number(form.age) || null,
    gender: form.gender || null,
    height_cm: Number(form.heightCm) || null,
    weight_kg: Number(form.weightKg) || null,
    target_weight_kg: Number(body.targetWeightKg) || null,
    goal: form.goal || null,
    activity_level: form.activityLevel || null,
    dietary_preference: body.dietaryPreference || null,
    allergies: body.allergies || null,
    disliked_foods: body.dislikedFoods || null,
    meal_routine: body.mealRoutine || null,
    skipped_meals: body.skippedMeals || [],
    budget: body.budget || null,
    cooking_time: body.cookingTime || null,
    nutrition_result: body.result || null,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase.from("profiles").upsert(payload).select().single();
  if (error) {
    const missingTable = error.code === "PGRST205" || error.code === "42P01" || error.message.toLowerCase().includes("does not exist");
    return NextResponse.json(
      {
        error: missingTable
          ? "Veritabanı tabloları kurulmamış. Supabase SQL Editor'da supabase/schema.sql dosyasını çalıştırın."
          : error.message,
        code: error.code ?? null,
      },
      { status: missingTable ? 503 : 500 },
    );
  }
  if (payload.weight_kg) await supabase.from("weight_entries").insert({ user_id: user.id, weight_kg: payload.weight_kg });
  return NextResponse.json({ profile: data });
}
