const features = [
    {
      title: "Kişiye özel plan",
      description:
        "Hedeflerine, günlük rutinine ve beslenme tercihlerine göre oluşturulan programlar.",
    },
    {
      title: "Bilimsel kaynaklar",
      description:
        "Beslenme önerileri güvenilir veri kaynaklarıyla desteklenir.",
    },
    {
      title: "Akıllı takip",
      description:
        "Kalori, makro, su ve kilo gelişimini tek panelden takip et.",
    },
  ];
  
  export function Features() {
    return (
      <section
        id="features"
        className="border-t border-zinc-200 bg-white px-6 py-24 lg:px-10"
      >
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-600">
            Özellikler
          </p>
  
          <h2 className="mt-4 max-w-2xl text-4xl font-bold tracking-tight">
            Beslenme yolculuğunda ihtiyacın olan her şey
          </h2>
  
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-3xl border border-zinc-200 bg-[#fafcf9] p-7"
              >
                <div className="mb-6 flex size-12 items-center justify-center rounded-2xl bg-emerald-100 text-xl">
                  ✓
                </div>
  
                <h3 className="text-xl font-bold">{feature.title}</h3>
  
                <p className="mt-3 leading-7 text-zinc-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }