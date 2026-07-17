import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Kullanım Şartları" };

export default function TermsPage() {
  return (
    <main className="px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-emerald-700">
          ← Ana sayfaya dön
        </Link>
        <h1 className="mt-12 text-5xl font-bold">Kullanım şartları</h1>
        <p className="mt-5 text-lg leading-8 text-zinc-600">
          Bu metin geliştirme aşamasındaki ürün için başlangıç niteliğindedir;
          ticari yayın öncesinde hukuk uzmanı tarafından gözden geçirilmelidir.
        </p>

        <div className="mt-10 space-y-5">
          {[
            ["Genel bilgilendirme", "Platformdaki hesaplamalar ve öneriler genel bilgilendirme amaçlıdır; tanı veya tedavi oluşturmaz."],
            ["Kullanıcı sorumluluğu", "Kullanıcı girdiği bilgilerin doğruluğundan ve sağlık durumuna uygun profesyonel destek almaktan sorumludur."],
            ["Besin değerleri", "Besin değerleri tarif, marka, pişirme ve porsiyon farklılıklarından etkilenebilir."],
            ["Hizmet değişiklikleri", "Geliştirme sürecinde özellikler, veri kaynakları ve arayüzler değiştirilebilir."],
          ].map(([title, text]) => (
            <section
              key={title}
              className="rounded-3xl border border-zinc-200 bg-white p-7"
            >
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="mt-3 leading-7 text-zinc-600">{text}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
