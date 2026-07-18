# Auth kurulumu

Bu sürüm kayıt doğrulama ve şifre yenileme e-postalarını Supabase'in saatlik deneme e-posta limiti yerine Resend üzerinden gönderir.

`.env.local` içinde şunlar bulunmalıdır:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SECRET_KEY=...
RESEND_API_KEY=...
AUTH_FROM_EMAIL=Cihad Çoban Nutrition <onboarding@resend.dev>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Yerel testte `onboarding@resend.dev` kullanılabilir. Resend test modunda çoğunlukla yalnızca Resend hesabının sahibine ait e-posta adresine gönderim yapılabilir. Canlıda doğrulanmış alan adından bir adres kullan.

Supabase > Authentication > URL Configuration bölümünde Site URL olarak `http://localhost:3000` kalabilir. Bu sürümde e-postadaki bağlantı doğrudan uygulamanın `/auth/callback` rotasına gittiği için özel email template değişikliği gerekmez.
