# Auth düzeltmeleri (v5.3)

Bu sürümde kayıt, giriş, e-posta doğrulama ve şifre yenileme akışları tek callback rotasında sağlamlaştırıldı.

## Supabase ayarı
Authentication > URL Configuration bölümünde:

- Site URL (lokal): `http://localhost:3000`
- Redirect URL: `http://localhost:3000/auth/callback`
- Geliştirme için isteğe bağlı: `http://localhost:3000/**`

Canlıya geçtiğinde aynı adreslerin domainli hâlini de ekle:

- `https://alanadiniz.com/auth/callback`
- `https://alanadiniz.com/**`

`.env.local` içinde lokal geliştirme için:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Canlı ortamda Vercel değişkenini gerçek domainle değiştir.

## Not
Supabase'in varsayılan e-posta servisi kısa sürede çok sayıda doğrulama/şifre yenileme e-postasında hız sınırına takılabilir. Bu durumda uygulama artık anlaşılır Türkçe hata gösterir. Ticari kullanımda özel SMTP bağlanması önerilir.
