"use server";

import { redirect } from "next/navigation";

import { getAuthErrorMessage } from "@/lib/supabase/auth-errors";
import { createClient } from "@/lib/supabase/server";

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

export async function updatePassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("passwordConfirmation") ?? "");

  if (password.length < 8) {
    redirect(`/reset-password?error=${encodeMessage("Yeni şifren en az 8 karakter olmalıdır.")}`);
  }

  if (password !== confirmation) {
    redirect(`/reset-password?error=${encodeMessage("Girdiğin şifreler eşleşmiyor.")}`);
  }

  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect(
      `/forgot-password?error=${encodeMessage(
        "Şifre yenileme bağlantısının süresi dolmuş veya bağlantı geçersiz. Lütfen yeniden bağlantı iste.",
      )}`,
    );
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    console.error("Supabase update password error:", error);
    redirect(
      `/reset-password?error=${encodeMessage(
        getAuthErrorMessage(
          error,
          "Şifre güncellenemedi. Lütfen farklı bir şifre deneyerek tekrar dene.",
        ),
      )}`,
    );
  }

  // Kurtarma oturumunu kapatıp kullanıcıyı yeni şifresiyle temiz bir girişe yönlendir.
  await supabase.auth.signOut();

  redirect(
    `/login?message=${encodeMessage(
      "Şifren başarıyla yenilendi. Yeni şifrenle giriş yapabilirsin.",
    )}`,
  );
}
