# Randevu Sistemi Kurulumu

1. Supabase Dashboard > SQL Editor bölümünde güncel `supabase/schema.sql` dosyasını çalıştır.
2. Table Editor içinde `appointments` tablosunun oluştuğunu doğrula.
3. `.env.local` içine Supabase admin anahtarını ekle:

```env
SUPABASE_SECRET_KEY=sb_secret_...
```

4. E-postaların danışmana düşmesi için Resend hesabından API anahtarı oluştur ve ekle:

```env
RESEND_API_KEY=re_...
APPOINTMENT_NOTIFICATION_EMAIL=seninmailin@example.com
APPOINTMENT_FROM_EMAIL=Cihad Çoban Nutrition <randevu@dogrulanmis-domainin.com>
```

`APPOINTMENT_FROM_EMAIL` için Resend üzerinde doğrulanmış domain önerilir. Test aşamasında `onboarding@resend.dev` kullanılabilir.

5. Geliştirme sunucusunu yeniden başlat:

```bash
npm run dev
```

- Randevu sayfası: `/appointment`
- Admin randevu yönetimi: `/admin`
