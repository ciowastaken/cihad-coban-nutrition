import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: authData, error: authError } = await supabase.auth.getUser();
    const { error: tableError } = await supabase.from("profiles").select("id").limit(1);

    return NextResponse.json({
      ok: !authError && !tableError,
      authenticated: Boolean(authData.user),
      authError: authError?.message ?? null,
      databaseReady: !tableError,
      databaseError: tableError?.message ?? null,
      hint: tableError
        ? "Supabase SQL Editor'da supabase/schema.sql dosyasını çalıştırın."
        : null,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Bilinmeyen bağlantı hatası",
      },
      { status: 500 },
    );
  }
}
