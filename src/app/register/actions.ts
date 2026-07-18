"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { sendSignupConfirmationEmail } from "@/lib/auth-email";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthErrorMessage } from "@/lib/supabase/auth-errors";

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

export async function register(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");

  if (!name || !email || !password || !passwordConfirm) {
    redirect(`/register?error=${encodeMessage("Tüm alanları doldur.")}`);
  }

  if (password.length < 8) {
    redirect(`/register?error=${encodeMessage("Şifre en az 8 karakter olmalıdır.")}`);
  }

  if (password !== passwordConfirm) {
    redirect(`/register?error=${encodeMessage("Şifreler eşleşmiyor.")}`);
  }

  try {
    const admin = createAdminClient();
    const { data, error } = await admin.auth.admin.generateLink({
      type: "signup",
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (error) throw error;

    const tokenHash = data.properties?.hashed_token;
    if (!tokenHash) {
      throw new Error("Doğrulama anahtarı üretilemedi.");
    }

    const origin = await getSiteOrigin();
    const confirmationUrl = new URL("/auth/callback", origin);
    confirmationUrl.searchParams.set("token_hash", tokenHash);
    confirmationUrl.searchParams.set("type", "email");
    confirmationUrl.searchParams.set("next", "/onboarding");

    await sendSignupConfirmationEmail({
      email,
      fullName: name,
      confirmationUrl: confirmationUrl.toString(),
    });
  } catch (error) {
    console.error("Register error:", error);
    redirect(
      `/register?error=${encodeMessage(
        getAuthErrorMessage(
          error instanceof Error ? error : null,
          "Kayıt oluşturulamadı. E-posta adresi daha önce kullanılmış olabilir veya e-posta gönderilememiş olabilir.",
        ),
      )}`,
    );
  }

  redirect(
    `/login?message=${encodeMessage(
      "Hesabın oluşturuldu. E-postandaki doğrulama bağlantısına tıkla.",
    )}`,
  );
}
