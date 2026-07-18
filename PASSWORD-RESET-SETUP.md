# Şifre Yenileme Kurulumu

Şifremi unuttum akışının canlı ortamda çalışması için Supabase panelinde aşağıdaki adresleri ekleyin:

1. Supabase Dashboard > Authentication > URL Configuration
2. Site URL:
   - Yerel geliştirme: `http://localhost:3000`
   - Canlı ortam: `https://alanadiniz.com`
3. Redirect URLs listesine ekleyin:
   - `http://localhost:3000/auth/callback`
   - `https://alanadiniz.com/auth/callback`

Vercel ortam değişkenlerine canlı site adresini eklemek önerilir:

```env
NEXT_PUBLIC_SITE_URL=https://alanadiniz.com
```

Akış:

- Kullanıcı giriş ekranındaki **Şifremi unuttum** bağlantısına basar.
- E-posta adresini girer.
- Supabase güvenli yenileme e-postasını gönderir.
- E-postadaki bağlantı `/auth/callback` üzerinden oturum oluşturur.
- Kullanıcı `/reset-password` sayfasında yeni şifresini belirler.
