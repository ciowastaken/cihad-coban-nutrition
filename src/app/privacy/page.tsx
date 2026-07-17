import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Gizlilik" };

export default function PrivacyPage() {
  return (
    <PolicyPage
      title="Gizlilik"
      intro="Bu sayfa ürünün geliştirme aşamasındaki temel veri yaklaşımını açıklar."
      sections={[
        ["Toplanan bilgiler", "Profil oluştururken girilen yaş, boy, kilo, hedef ve aktivite bilgileri ile öğün kayıtları işlenebilir."],
        ["Mevcut prototip", "Şu an profil ve öğün verileri çoğunlukla kullanıcının tarayıcısındaki yerel depolama alanında tutulur."],
        ["Gelecek sürüm", "Hesap sistemi ve bulut veritabanı eklendiğinde KVKK aydınlatması, açık rıza süreçleri ve veri silme araçları ayrıca uygulanacaktır."],
        ["Üçüncü taraflar", "Besin araması için üçüncü taraf veri servisleri kullanılabilir. Hassas sağlık verileri gereksiz biçimde bu servislere gönderilmemelidir."],
      ]}
    />
  );
}

function PolicyPage({
  title,
  intro,
  sections,
}: {
  title: string;
  intro: string;
  sections: string[][];
}) {
  return (
    <main className="px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-emerald-700">
          ← Ana sayfaya dön
        </Link>
        <h1 className="mt-12 text-5xl font-bold">{title}</h1>
        <p className="mt-5 text-lg leading-8 text-zinc-600">{intro}</p>
        <div className="mt-10 space-y-5">
          {sections.map(([heading, text]) => (
            <section
              key={heading}
              className="rounded-3xl border border-zinc-200 bg-white p-7"
            >
              <h2 className="text-xl font-bold">{heading}</h2>
              <p className="mt-3 leading-7 text-zinc-600">{text}</p>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
