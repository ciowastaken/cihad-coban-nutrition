"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  href?: string | null;
  read_at?: string | null;
  created_at: string;
};

export function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    const response = await fetch("/api/notifications", { cache: "no-store", credentials: "same-origin" }).catch(() => null);
    if (!response?.ok) return;
    const data = await response.json().catch(() => ({ notifications: [] }));
    setItems(data.notifications || []);
  }, []);

  useEffect(() => {
    void load();
    const timer = window.setInterval(load, 30000);
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("mousedown", close);
    };
  }, [load]);

  const unread = items.filter((item) => !item.read_at).length;

  async function markRead(id?: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(id ? { id } : { all: true }),
    }).catch(() => null);
    setItems((current) => current.map((item) => (!id || item.id === id ? { ...item, read_at: new Date().toISOString() } : item)));
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Bildirimler"
        onClick={() => setOpen((value) => !value)}
        className="relative flex size-11 items-center justify-center rounded-full border border-emerald-900/10 bg-white text-xl shadow-sm"
      >
        🔔
        {unread > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-red-500 px-1 text-center text-[11px] font-bold leading-5 text-white">{unread > 9 ? "9+" : unread}</span>}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-3 w-[360px] max-w-[90vw] overflow-hidden rounded-3xl border border-emerald-900/10 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b p-4">
            <b>Bildirimler</b>
            {unread > 0 && <button type="button" onClick={() => markRead()} className="text-xs font-bold text-emerald-700">Tümünü okundu yap</button>}
          </div>
          <div className="max-h-[420px] overflow-y-auto">
            {items.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">Henüz bildirimin yok.</p>
            ) : items.map((item) => {
              const body = (
                <div className={`border-b p-4 last:border-0 ${item.read_at ? "bg-white" : "bg-emerald-50"}`}>
                  <b className="block text-sm text-emerald-950">{item.title}</b>
                  <p className="mt-1 text-sm leading-5 text-slate-600">{item.message}</p>
                  <small className="mt-2 block text-slate-400">{new Date(item.created_at).toLocaleString("tr-TR")}</small>
                </div>
              );
              return item.href ? (
                <Link key={item.id} href={item.href} onClick={() => { void markRead(item.id); setOpen(false); }}>{body}</Link>
              ) : (
                <button key={item.id} type="button" className="block w-full text-left" onClick={() => markRead(item.id)}>{body}</button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
