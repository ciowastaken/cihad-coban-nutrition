import Link from "next/link";

export function Header() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 lg:px-10">
      <Link href="/" className="flex items-center gap-3">
        <div className="flex size-11 items-center justify-center rounded-2xl bg-emerald-600 font-bold text-white">
          CC
        </div>

        <div>
          <p className="font-semibold leading-none">Cihad Çoban</p>
          <p className="mt-1 text-xs text-zinc-500">Nutrition</p>
        </div>
      </Link>

      <nav className="hidden items-center gap-8 text-sm font-medium text-zinc-600 md:flex">
        <a href="#features" className="transition hover:text-emerald-700">
          Özellikler
        </a>

        <a href="#how-it-works" className="transition hover:text-emerald-700">
          Nasıl çalışır?
        </a>

        <a href="#about" className="transition hover:text-emerald-700">
          Hakkımızda
        </a>
      </nav>

      <Link
        href="/login"
        className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold transition hover:border-emerald-600 hover:text-emerald-700"
      >
        Giriş yap
      </Link>
    </header>
  );
}