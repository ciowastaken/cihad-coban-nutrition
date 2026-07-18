"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { sendPasswordRecoveryEmail } from "@/lib/auth-email";
import { createAdminClient } from "@/lib/supabase/admin";

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

async function getSiteOrigin() {
  const requestHeaders = await headers();
  const forwardedHost = requestHeaders.get("x-forwarded-host");
  const host = forwardedHost ?? requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";

  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    requestHeaders.get("origin") ||
    (host ? `${protocol}://${host}` : "http://localhost:3000")
  );
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (!email) {
    redirect(`/forgot-password?error=${encodeMessage("E-posta adresini yazmalısın.")}`);
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "recovery",
      email,
    });

    if (!error) {
      const tokenHash = data.properties?.hashed_token;
      if (!tokenHash) throw new Error("Şifre yenileme anahtarı üretilemedi.");

      const origin = await getSiteOrigin();
      const recoveryUrl = new URL("/auth/callback", origin);
      recoveryUrl.searchParams.set("token_hash", tokenHash);
      recoveryUrl.searchParams.set("type", "recovery");
      recoveryUrl.searchParams.set("next", "/reset-password");

      await sendPasswordRecoveryEmail({
        email,
        recoveryUrl: recoveryUrl.toString(),
      });
    } else {
      // Hesap varlığını kullanıcıya belli etmemek için yalnızca sunucuya yaz.
      console.error("Password recovery link error:", error);
    }
  } catch (error) {
    console.error("Password recovery email error:", error);
    redirect(
      `/forgot-password?error=${encodeMessage(
        "Şifre yenileme e-postası gönderilemedi. RESEND_API_KEY ve gönderici e-posta ayarlarını kontrol et.",
      )}`,
    );
  }

  redirect(
    `/forgot-password?message=${encodeMessage(
      "Bu e-posta sistemde kayıtlıysa şifre yenileme bağlantısı gönderildi. Gelen kutunu ve spam klasörünü kontrol et.",
    )}`,
  );
}
