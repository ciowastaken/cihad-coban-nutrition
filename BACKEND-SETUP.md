# Supabase backend kurulumu

Bu proje yalnızca Supabase projesi oluşturularak çalışmaz. Veritabanı tablolarını da bir kez kurmanız gerekir.

## 1) Veritabanını kur

1. Supabase Dashboard'da projenizi açın.
2. Sol menüden **SQL Editor** bölümüne girin.
3. **New query** seçeneğine basın.
4. Projedeki `supabase/schema.sql` dosyasının tamamını yapıştırın.
5. Sağ alttan **Run** düğmesine basın.
6. Sol menüde **Table Editor** açıldığında şu tablolar görünmelidir:
   - `profiles`
   - `diet_plans`
   - `meal_entries`
   - `weight_entries`

## 2) Ortam değişkenleri

`.env.local` dosyasında şunlar bulunmalı:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJE-REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
```

Yeni Supabase anahtarlarında sunucu tarafı için `SUPABASE_SECRET_KEY` kullanılır. Eski projelerde bunun yerine aşağıdaki değer de desteklenir:

```env
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Admin/secret anahtarını `NEXT_PUBLIC_` ile başlatmayın ve GitHub'a yüklemeyin.

Değişiklikten sonra terminali kapatıp tekrar çalıştırın:

```bash
npm run dev
```

## 3) Kullanıcıları nerede görürüm?

Supabase Dashboard → **Authentication** → **Users**

Burada kayıtlı e-posta hesaplarını görebilir ve silebilirsiniz.

Uygulamanın profil ve program verileri:

Supabase Dashboard → **Table Editor**

- `profiles`: kullanıcı profilleri
- `diet_plans`: kullanıcıların oluşturduğu programlar
- `meal_entries`: günlük öğünler
- `weight_entries`: kilo geçmişi

## 4) Kendini admin yap

Önce **Authentication → Users** bölümünden kendi kullanıcı UUID'nizi kopyalayın. Ardından SQL Editor'da çalıştırın:

```sql
update public.profiles
set role = 'admin'
where id = 'KULLANICI_UUID';
```

Sonra çıkış yapıp tekrar giriş yapın. `/admin` sayfası açılacaktır.

## 5) Kontrol

Tarayıcıda şu adresi açın:

```text
http://localhost:3000/api/health
```

`databaseReady: true` görmelisiniz. `false` ise SQL şeması henüz kurulmamıştır veya yanlış Supabase projesine bağlanılmıştır.
