import type { Metadata } from "next";
import Link from "next/link";

import { BrandLogo } from "@/components/brand/BrandLogo";

import { updatePassword } from "./actions";

export const metadata: Metadata = {
  title: "Yeni Şifre Belirle",
};

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: Props) {
  const params = await searchParams;

  return (
    <main className="px-5 py-14 sm:px-8">
      <div className="mx-auto max-w-md">
        <div className="flex justify-center">
          <BrandLogo subtitle="Nutrition" />
        </div>

        <section className="mt-10 rounded-4xl border border-zinc-200 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Güvenli şifre
          </p>
          <h1 className="mt-3 text-3xl font-bold">Yeni şifreni belirle</h1>
          <p className="mt-3 leading-7 text-zinc-600">
            Hesabın için en az 8 karakterden oluşan yeni bir şifre oluştur.
          </p>

          {params.error && <Message>{params.error}</Message>}

          <form action={updatePassword} className="mt-7 space-y-5">
            <Field label="Yeni şifre">
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

            <Field label="Yeni şifreyi tekrar yaz">
              <input
                required
                minLength={8}
                name="passwordConfirmation"
                type="password"
                autoComplete="new-password"
                className={inputClass}
                placeholder="Şifreni tekrar yaz"
              />
            </Field>

            <button className="w-full rounded-2xl bg-emerald-600 px-6 py-4 font-semibold text-white transition hover:bg-emerald-700">
              Şifreyi güncelle
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500">
            Bağlantın geçersizse{" "}
            <Link
              href="/forgot-password"
              className="font-semibold text-emerald-700"
            >
              yeni bağlantı iste
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

function Message({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
      {children}
    </div>
  );
}
