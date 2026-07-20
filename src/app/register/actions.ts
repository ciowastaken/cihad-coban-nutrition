"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { getAuthErrorMessage } from "@/lib/supabase/auth-errors";

function encodeMessage(message: string) {
  return encodeURIComponent(message);
}

function isAlreadyRegisteredError(error: Error) {
  const message = error.message.toLowerCase();
  return (
    message.includes("already registered") ||
    message.includes("already exists") ||
    message.includes("already been registered") ||
    message.includes("user already")
  );
}

async function findUserByEmail(
  admin: ReturnType<typeof createAdminClient>,
  email: string,
) {
  const perPage = 200;

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) throw error;

    const user = data.users.find(
      (item) => item.email?.toLowerCase() === email,
    );

    if (user) return user;
    if (data.users.length < perPage) return null;
  }

  return null;
}

async function upsertProfile(
  admin: ReturnType<typeof createAdminClient>,
  userId: string,
  fullName: string,
) {
  const { error } = await admin
    .from("profiles")
    .upsert({ id: userId, full_name: fullName }, { onConflict: "id" });

  if (error) throw error;
}

export async function register(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const passwordConfirm = String(formData.get("passwordConfirm") ?? "");
  let successMessage =
    "Hesabın oluşturuldu. Şimdi e-posta ve şifrenle giriş yapabilirsin.";

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

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (error) {
      if (!isAlreadyRegisteredError(error)) throw error;

      const existingUser = await findUserByEmail(admin, email);

      if (!existingUser) throw error;

      if (existingUser.email_confirmed_at) {
        successMessage =
          "Bu e-posta zaten kayıtlı. Şifrenle giriş yapabilirsin.";
      } else {
        const { error: updateError } = await admin.auth.admin.updateUserById(
          existingUser.id,
          {
            password,
            email_confirm: true,
            user_metadata: {
              ...existingUser.user_metadata,
              full_name: name,
            },
          },
        );

        if (updateError) throw updateError;
        await upsertProfile(admin, existingUser.id, name);
        successMessage =
          "Hesabın doğrulandı. Şimdi e-posta ve şifrenle giriş yapabilirsin.";
      }
    } else if (data.user) {
      await upsertProfile(admin, data.user.id, name);
    } else {
      throw new Error("Kullanıcı oluşturulamadı.");
    }
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

  redirect(`/login?message=${encodeMessage(successMessage)}`);
}
