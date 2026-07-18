import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Hakkımızda",
};

export default function AboutPage() {
  return (
    <main className="px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-semibold text-emerald-700">
          ← Ana sayfaya dön
        </Link>

        <div className="mt-12 rounded-4xl bg-zinc-950 p-8 text-white sm:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
            Hakkımızda
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Beslenme takibini daha anlaşılır ve sürdürülebilir hâle getiriyoruz.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-300">
            Cihad Çoban Nutrition; kullanıcıların hedeflerini oluşturmasını,
            öğünlerini kolayca takip etmesini ve besin bilgilerini kaynaklarıyla
            incelemesini amaçlayan dijital bir platformdur.
          </p>
        </div>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {[
            ["Misyon", "Karmaşık beslenme verilerini günlük yaşamda uygulanabilir hâle getirmek."],
            ["Yaklaşım", "Hesaplamaları deterministik kodla, açıklamaları şeffaf kaynaklarla sunmak."],
            ["Güvenlik", "Tıbbi durumlarda otomatik öneriyi sınırlandırmak ve uzman desteğini teşvik etmek."],
          ].map(([title, text]) => (
            <article
              key={title}
              className="rounded-3xl border border-zinc-200 bg-white p-7"
            >
              <h2 className="text-xl font-bold">{title}</h2>
              <p className="mt-3 leading-7 text-zinc-600">{text}</p>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
