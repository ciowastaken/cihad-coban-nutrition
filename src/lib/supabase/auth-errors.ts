import type { AuthError } from "@supabase/supabase-js";

export function getAuthErrorMessage(
  error: AuthError | Error | null | undefined,
  fallback = "İşlem tamamlanamadı. Lütfen tekrar dene.",
) {
  if (!error) return fallback;

  const message = error.message.toLowerCase();
  const code = "code" in error ? String(error.code ?? "") : "";

  if (
    code === "over_email_send_rate_limit" ||
    message.includes("email rate limit") ||
    message.includes("rate limit")
  ) {
    return "Çok kısa sürede fazla e-posta isteği gönderildi. Birkaç dakika bekleyip tekrar dene.";
  }

  if (
    code === "user_already_exists" ||
    message.includes("already registered") ||
    message.includes("already exists")
  ) {
    return "Bu e-posta adresiyle daha önce hesap oluşturulmuş. Giriş yapabilir veya şifreni yenileyebilirsin.";
  }

  if (message.includes("invalid login credentials")) {
    return "E-posta adresi veya şifre hatalı.";
  }

  if (message.includes("email not confirmed")) {
    return "E-posta adresin henüz doğrulanmamış. Gelen kutundaki doğrulama bağlantısını kullan.";
  }

  if (message.includes("password should be at least")) {
    return "Şifre en az 8 karakter olmalıdır.";
  }

  if (message.includes("invalid email")) {
    return "Geçerli bir e-posta adresi yazmalısın.";
  }

  if (message.includes("signup is disabled")) {
    return "Yeni kullanıcı kaydı şu anda kapalı. Lütfen site yöneticisiyle iletişime geç.";
  }

  if (
    message.includes("smtp") ||
    message.includes("sending confirmation email") ||
    message.includes("error sending")
  ) {
    return "Doğrulama e-postası gönderilemedi. E-posta ayarlarını kontrol edip tekrar dene.";
  }

  if (message.includes("same password")) {
    return "Yeni şifren mevcut şifrenden farklı olmalıdır.";
  }

  if (message.includes("session") || message.includes("jwt")) {
    return "Oturumun geçersiz veya süresi dolmuş. Lütfen işlemi yeniden başlat.";
  }

  return fallback;
}
