import Link from "next/link";

const productLinks = [
  { label: "Özellikler", href: "/#features" },
  { label: "Plan oluştur", href: "/onboarding" },
  { label: "Kişisel panel", href: "/dashboard" },
];

const resourceLinks = [
  { label: "Beslenme rehberi", href: "/nutrition-guide" },
  { label: "Sık sorulan sorular", href: "/faq" },
];

const companyLinks = [
  { label: "Hakkımızda", href: "/about" },
  { label: "İletişim", href: "/contact" },
  { label: "Gizlilik", href: "/privacy" },
  { label: "Kullanım şartları", href: "/terms" },
];

export function SiteFooter() {
  return (
    <footer className="mt-20 border-t border-zinc-200 bg-white text-zinc-950">
      <section className="border-b border-zinc-200 bg-zinc-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-7 px-6 py-14 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Kişisel beslenme yolculuğun
            </p>
            <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
              Sana uygun başlangıç hedeflerini birkaç dakikada oluştur.
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-zinc-400">
              Günlük kalori ve makro hedeflerini hesapla, öğünlerini takip et
              ve ilerlemeni tek panelden yönet.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/onboarding"
              className="rounded-2xl bg-emerald-500 px-6 py-4 text-center font-semibold text-zinc-950 transition hover:bg-emerald-400"
            >
              Planımı oluştur
            </Link>
            <Link
              href="/dashboard"
              className="rounded-2xl border border-white/20 px-6 py-4 text-center font-semibold transition hover:bg-white/10"
            >
              Panele git
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.7fr_0.8fr_0.8fr] lg:px-10">
        <div>
          <Link href="/" className="inline-flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-600 font-bold text-white">
              CC
            </div>
            <div>
              <p className="font-bold leading-none">Cihad Çoban</p>
              <p className="mt-1 text-xs text-zinc-500">Nutrition</p>
            </div>
          </Link>

          <p className="mt-5 max-w-sm text-sm leading-7 text-zinc-500">
            Kişiselleştirilmiş hedefler, günlük öğün takibi ve kaynakları
            belirtilen beslenme bilgileri sunan dijital beslenme platformu.
          </p>

          <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
            Platform genel bilgilendirme amaçlıdır. Tanı, tedavi veya kişisel
            tıbbi değerlendirme yerine geçmez.
          </div>
        </div>

        <FooterColumn title="Ürün" links={productLinks} />
        <FooterColumn title="Kaynaklar" links={resourceLinks} />
        <FooterColumn title="Şirket" links={companyLinks} />
      </div>

      <div className="border-t border-zinc-200">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-5 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <p>© {new Date().getFullYear()} Cihad Çoban Nutrition</p>
          <p>Bilimsel doğruluk, şeffaf kaynak ve kullanıcı güvenliği odaklı.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: Array<{ label: string; href: string }>;
}) {
  return (
    <div>
      <p className="font-bold">{title}</p>
      <div className="mt-5 space-y-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="block text-sm text-zinc-500 transition hover:text-emerald-700"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
