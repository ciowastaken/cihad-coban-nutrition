import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5">
      <div className="max-w-lg rounded-4xl border border-red-200 bg-white p-8 text-center">
        <h1 className="text-3xl font-bold">Doğrulama başarısız oldu</h1>
        <p className="mt-4 leading-7 text-zinc-600">
          Bağlantının süresi dolmuş veya bağlantı daha önce kullanılmış
          olabilir.
        </p>
        <Link
          href="/login"
          className="mt-7 inline-flex rounded-2xl bg-emerald-600 px-6 py-4 font-semibold text-white"
        >
          Giriş sayfasına dön
        </Link>
      </div>
    </main>
  );
}
