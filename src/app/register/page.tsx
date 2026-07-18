import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

import { register } from "./actions";

export const metadata: Metadata = {
  title: "Kayıt Ol",
};

type Props = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function RegisterPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <main className="px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-md">
        <div className="flex justify-center"><BrandLogo subtitle="Nutrition" /></div>

        <section className="mt-10 rounded-4xl border border-zinc-200 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Ücretsiz başlangıç
          </p>
          <h1 className="mt-3 text-3xl font-bold">Hesabını oluştur</h1>
          <p className="mt-3 leading-7 text-zinc-600">
            Hedeflerini ve öğün kayıtlarını hesabına bağla.
          </p>

          {params.error && (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {params.error}
            </div>
          )}

          <form action={register} className="mt-7 space-y-5">
            <Field label="Ad soyad">
              <input
                required
                name="name"
                autoComplete="name"
                className={inputClass}
                placeholder="Cihad Çoban"
              />
            </Field>

            <Field label="E-posta">
              <input
                required
                name="email"
                type="email"
                autoComplete="email"
                className={inputClass}
                placeholder="ornek@email.com"
              />
            </Field>

            <Field label="Şifre">
              <input
                required
                minLength={8}
                name="password"
                type="password"
                autoComplete="new-password"
                className={inputClass}
                placeholder="En az 8 karakter"
              />
            </Field>

            <Field label="Şifreyi tekrar yaz">
              <input
                required
                minLength={8}
                name="passwordConfirm"
                type="password"
                autoComplete="new-password"
                className={inputClass}
                placeholder="••••••••"
              />
            </Field>

            <button className="w-full rounded-2xl bg-emerald-600 px-6 py-4 font-semibold text-white transition hover:bg-emerald-700">
              Hesap oluştur
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Zaten hesabın var mı?{" "}
            <Link
              href="/login"
              className="font-semibold text-emerald-700"
            >
              Giriş yap
            </Link>
          </p>
        </section>
      </div>
    </main>
  );
}

const inputClass =
  "w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 outline-none transition focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10";

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
