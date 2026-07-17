import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sık Sorulan Sorular",
};

const questions = [
  ["Kalori değerleri kesin mi?", "Hayır. Tarif, marka, porsiyon ve kullanılan yağ miktarı sonucu değiştirebilir. Değerler tahmin olarak ele alınmalıdır."],
  ["Uygulama kişisel diyet hazırlar mı?", "Sağlıklı yetişkinler için başlangıç enerji ve makro hedefleri oluşturur. Tıbbi beslenme tedavisi yerine geçmez."],
  ["Veriler sayfa yenilenince silinir mi?", "Şu anki prototipte profil ve öğün kayıtları tarayıcının yerel depolama alanında saklanır."],
  ["Hastalık durumunda kullanılabilir mi?", "Diyabet, böbrek hastalığı, gebelik, yeme bozukluğu ve ilaç kullanımı gibi durumlarda uzman değerlendirmesi gereklidir."],
  ["Paketli ürün verileri nereden geliyor?", "Paketli ürün sonuçlarında üçüncü taraf besin veri kaynakları kullanılabilir ve sonuçla birlikte kaynak adı gösterilir."],
];

export default function FaqPage() {
  return (
    <main className="px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-emerald-700">
          ← Ana sayfaya dön
        </Link>
        <p className="mt-12 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
          Yardım
        </p>
        <h1 className="mt-4 text-5xl font-bold tracking-tight">
          Sık sorulan sorular
        </h1>

        <div className="mt-10 space-y-4">
          {questions.map(([question, answer]) => (
            <details
              key={question}
              className="group rounded-3xl border border-zinc-200 bg-white p-6"
            >
              <summary className="cursor-pointer list-none font-bold">
                {question}
              </summary>
              <p className="mt-4 leading-7 text-zinc-600">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}
