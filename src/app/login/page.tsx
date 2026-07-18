import type { Metadata } from "next";
import Link from "next/link";
import { BrandLogo } from "@/components/brand/BrandLogo";

import { login } from "./actions";

export const metadata: Metadata = {
  title: "Giriş Yap",
};

type Props = {
  searchParams: Promise<{
    error?: string;
    message?: string;
    next?: string;
  }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <main className="px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-md">
        <div className="flex justify-center"><BrandLogo subtitle="Nutrition" /></div>

        <section className="mt-10 rounded-4xl border border-zinc-200 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Tekrar hoş geldin
          </p>
          <h1 className="mt-3 text-3xl font-bold">Hesabına giriş yap</h1>
          <p className="mt-3 leading-7 text-zinc-600">
            Kişisel paneline ve kayıtlı öğünlerine devam et.
          </p>

          {params.error && (
            <Message type="error">{params.error}</Message>
          )}

          {params.message && (
            <Message type="success">{params.message}</Message>
          )}

          <form action={login} className="mt-7 space-y-5">
            <input
              type="hidden"
              name="next"
              value={params.next ?? "/dashboard"}
            />

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

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <span className="text-sm font-semibold">Şifre</span>
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
                >
                  Şifremi unuttum
                </Link>
              </div>
              <input
                required
                name="password"
                type="password"
                autoComplete="current-password"
                className={inputClass}
                placeholder="••••••••"
              />
            </div>

            <button className="w-full rounded-2xl bg-emerald-600 px-6 py-4 font-semibold text-white transition hover:bg-emerald-700">
              Giriş yap
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Hesabın yok mu?{" "}
            <Link
              href="/register"
              className="font-semibold text-emerald-700"
            >
              Ücretsiz kayıt ol
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

function Message({
  type,
  children,
}: {
  type: "error" | "success";
  children: React.ReactNode;
}) {
  const classes =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : "border-emerald-200 bg-emerald-50 text-emerald-800";

  return (
    <div
      className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-medium ${classes}`}
    >
      {children}
    </div>
  );
}
