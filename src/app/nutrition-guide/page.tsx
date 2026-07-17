import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Beslenme Rehberi",
  description:
    "Kalori, makro besinler, porsiyon ölçümü ve besin değerlerinin nasıl yorumlanacağı hakkında temel rehber.",
};

const sections = [
  {
    title: "Kalori nedir?",
    text: "Kalori, yiyecek ve içeceklerden alınan enerjiyi ifade eder. Günlük ihtiyaç; yaş, boy, kilo, hareket düzeyi ve hedefe göre değişir.",
  },
  {
    title: "Protein",
    text: "Protein; kas dokusu, enzimler ve birçok vücut işlevi için önemlidir. İhtiyaç kişinin ağırlığına, aktivitesine ve hedeflerine göre farklılaşır.",
  },
  {
    title: "Karbonhidrat",
    text: "Karbonhidratlar temel enerji kaynaklarından biridir. Miktar kadar tam tahıl, baklagil, sebze ve meyve gibi kaynakların seçimi de önemlidir.",
  },
  {
    title: "Yağ",
    text: "Yağlar enerji sağlar ve bazı vitaminlerin emilimine yardım eder. Doymamış yağ kaynaklarına öncelik verilmesi genel olarak daha dengeli bir yaklaşımdır.",
  },
  {
    title: "Porsiyon neden önemlidir?",
    text: "Aynı yemeğin kalorisi kullanılan yağ, tarif ve porsiyon büyüklüğüne göre ciddi biçimde değişebilir. Bu nedenle uygulamadaki sonuçlar tahmini aralık olarak değerlendirilmelidir.",
  },
  {
    title: "Besin verileri nasıl kullanılıyor?",
    text: "Platform; yerel başlangıç verileri ve üçüncü taraf besin veri kaynaklarını kullanır. Kaynak ve porsiyon bilgisi sonuçla birlikte gösterilir.",
  },
];

export default function NutritionGuidePage() {
  return (
    <main className="px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <Link href="/" className="text-sm font-semibold text-emerald-700">
          ← Ana sayfaya dön
        </Link>

        <p className="mt-12 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
          Kaynaklar
        </p>
        <h1 className="mt-4 text-5xl font-bold tracking-tight">
          Temel beslenme rehberi
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-zinc-600">
          Uygulamadaki değerleri daha doğru yorumlamana yardımcı olacak temel
          kavramları sade biçimde öğren.
        </p>

        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-3xl border border-zinc-200 bg-white p-7"
            >
              <h2 className="text-xl font-bold">{section.title}</h2>
              <p className="mt-3 leading-7 text-zinc-600">{section.text}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <h2 className="font-bold">Önemli güvenlik notu</h2>
          <p className="mt-2 leading-7">
            Hastalık, gebelik, emzirme, düzenli ilaç kullanımı, ciddi alerji
            veya yeme bozukluğu gibi durumlarda otomatik önerilere dayanmak
            yerine hekim ve diyetisyen değerlendirmesi alınmalıdır.
          </p>
        </div>
      </div>
    </main>
  );
}
