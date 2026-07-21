"use server";

import { redirect } from "next/navigation";

import { hasAdminPanelAccess } from "@/lib/roles";
import { getAuthErrorMessage } from "@/lib/supabase/auth-errors";
import { createClient } from "@/lib/supabase/server";

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/dashboard");

  if (!email || !password) {
    redirect(`/login?error=${encodeMessage("E-posta ve şifre zorunludur.")}`);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("Supabase login error:", error);
    redirect(
      `/login?error=${encodeMessage(
        getAuthErrorMessage(
          error,
          "Giriş başarısız. E-posta adresini ve şifreni kontrol et.",
        ),
      )}`,
    );
  }

  const safeNextPath = nextPath.startsWith("/") && !nextPath.startsWith("//")
    ? nextPath
    : "/dashboard";

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (hasAdminPanelAccess(profile?.role)) {
      redirect(safeNextPath.startsWith("/admin") ? safeNextPath : "/admin");
    }
  }

  redirect(safeNextPath);
}
