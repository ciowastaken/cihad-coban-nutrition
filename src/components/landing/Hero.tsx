import Link from "next/link";

export function Hero() {
  return (
    <section className="mx-auto grid min-h-[calc(100vh-100px)] w-full max-w-7xl items-center gap-14 px-6 py-16 lg:grid-cols-2 lg:px-10">
      <div>
        <div className="mb-6 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800">
          Yapay zekâ destekli kişisel beslenme
        </div>

        <h1 className="max-w-3xl text-5xl font-bold tracking-[-0.05em] sm:text-6xl lg:text-7xl">
          Sana özel,
          <span className="block text-emerald-600">
            bilimsel beslenme.
          </span>
        </h1>

        <p className="mt-7 max-w-xl text-lg leading-8 text-zinc-600">
          Hedeflerini, günlük yaşamını ve yemek tercihlerini anlayan kişisel
          beslenme asistanın. Planını oluştur, öğünlerini takip et ve ilerlemeni
          tek yerden yönet.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/onboarding"
            className="rounded-full bg-emerald-600 px-7 py-4 text-center font-semibold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700"
          >
            Ücretsiz planını oluştur
          </Link>

          <a
            href="#how-it-works"
            className="rounded-full border border-zinc-300 bg-white px-7 py-4 text-center font-semibold transition hover:border-zinc-400"
          >
            Nasıl çalıştığını gör
          </a>
        </div>

        <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-zinc-600">
          <span>✓ Kişiselleştirilmiş plan</span>
          <span>✓ Kalori ve makro takibi</span>
          <span>✓ Türkçe ve İngilizce</span>
        </div>
      </div>

      <div className="relative">
        <div className="absolute -left-10 -top-10 size-56 rounded-full bg-emerald-200/50 blur-3xl" />
        <div className="absolute -bottom-10 -right-10 size-56 rounded-full bg-lime-200/50 blur-3xl" />

        <div className="relative overflow-hidden rounded-4xl border border-white/70 bg-white/80 p-6 shadow-2xl shadow-emerald-950/10 backdrop-blur">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-500">Bugünkü durumun</p>
              <h2 className="mt-1 text-2xl font-bold">Günaydın, Cihad 👋</h2>
            </div>

            <div className="rounded-2xl bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
              Hedefte
            </div>
          </div>

          <div className="mt-7 rounded-3xl bg-zinc-950 p-6 text-white">
            <p className="text-sm text-zinc-400">Günlük kalori</p>

            <p className="mt-2 text-4xl font-bold">
              1.640
              <span className="ml-2 text-base font-normal text-zinc-400">
                / 2.150 kcal
              </span>
            </p>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-zinc-800">
              <div className="h-full w-3/4 rounded-full bg-emerald-400" />
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              ["Protein", "112 g"],
              ["Su", "2.1 L"],
              ["Adım", "7.820"],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-2xl border border-zinc-200 bg-white p-4"
              >
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="mt-2 font-bold">{value}</p>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-3xl bg-emerald-50 p-5">
            <p className="text-sm font-semibold text-emerald-900">AI önerin</p>

            <p className="mt-2 text-sm leading-6 text-emerald-900/70">
              Bugün protein hedefinin biraz altındasın. Akşam öğününe uygun bir
              protein kaynağı ekleyebilirsin.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}