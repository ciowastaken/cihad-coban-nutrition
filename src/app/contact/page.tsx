"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ContactPage() {
  const [sent, setSent] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
    event.currentTarget.reset();
  }

  return (
    <main className="px-6 py-14 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <Link href="/" className="text-sm font-semibold text-emerald-700">
          ← Ana sayfaya dön
        </Link>

        <div className="mt-12 grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
              İletişim
            </p>
            <h1 className="mt-4 text-5xl font-bold tracking-tight">
              Bize ulaş
            </h1>
            <p className="mt-6 leading-8 text-zinc-600">
              Görüş, öneri, hata bildirimi veya iş birliği taleplerini form
              üzerinden iletebilirsin.
            </p>
            <div className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6">
              <p className="font-bold">Not</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">
                Bu form şu anda arayüz prototipidir. E-posta servisi sonraki
                aşamada bağlanacaktır.
              </p>
            </div>
          </div>

          <form
            onSubmit={handleSubmit}
            className="rounded-4xl border border-zinc-200 bg-white p-6 shadow-xl shadow-emerald-950/5 sm:p-8"
          >
            <Field label="Ad soyad">
              <input required name="name" className={inputClass} />
            </Field>

            <Field label="E-posta">
              <input required type="email" name="email" className={inputClass} />
            </Field>

            <Field label="Konu">
              <input required name="subject" className={inputClass} />
            </Field>

            <Field label="Mesaj">
              <textarea
                required
                name="message"
                rows={6}
                className={`${inputClass} resize-y`}
              />
            </Field>

            {sent && (
              <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
                Mesaj arayüzde alındı. Gerçek gönderim servisi henüz bağlı değil.
              </div>
            )}

            <button className="w-full rounded-2xl bg-emerald-600 px-6 py-4 font-semibold text-white transition hover:bg-emerald-700">
              Mesajı gönder
            </button>
          </form>
        </div>
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
    <label className="mb-5 block">
      <span className="mb-2 block text-sm font-semibold">{label}</span>
      {children}
    </label>
  );
}
