"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { createClient } from "@/lib/supabase/client";

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Hesabım");
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      setEmail(data.user.email ?? "");
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,role")
        .eq("id", data.user.id)
        .single();
      setName(profile?.full_name || data.user.user_metadata?.full_name || "Hesabım");
      setIsAdmin(profile?.role === "admin");
    });

    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function logout() {
    setLoading(true);
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="app-nav-wrap">
      <div className="app-nav shell-wide">
        <BrandLogo href="/" subtitle="Nutrition Platform" />

        <nav className="app-nav-links" aria-label="Ana menü">
          <Link href="/#features">Özellikler</Link>
          <Link href="/#how-it-works">Nasıl çalışır?</Link>
          <Link href="/about" className={pathname === "/about" ? "active" : ""}>Hakkımızda</Link>
          <Link href="/appointment" className={pathname === "/appointment" ? "active" : ""}>Randevu</Link>
          <Link href="/dashboard" className={pathname.startsWith("/dashboard") ? "active" : ""}>Kontrol merkezi</Link>
          {isAdmin && (
            <Link href="/admin" className={pathname.startsWith("/admin") ? "active" : ""}>Admin</Link>
          )}
        </nav>

        <div className="nav-account" ref={menuRef}>
          <Link href="/onboarding" className="button button-primary button-small nav-new-plan">Yeni hesaplama</Link>
          <button type="button" className="account-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
            <span className="account-avatar">{name.slice(0, 1).toUpperCase()}</span>
            <span className="account-copy"><b>{name}</b><small>{email || "Üye hesabı"}</small></span>
            <span>⌄</span>
          </button>

          {open && (
            <div className="account-menu">
              <Link href="/profile" onClick={() => setOpen(false)}>Profili düzenle</Link>
              <Link href="/plans" onClick={() => setOpen(false)}>Programlarım</Link>
              {isAdmin && <Link href="/admin" onClick={() => setOpen(false)}>Admin paneli</Link>}
              <button type="button" onClick={logout} disabled={loading}>{loading ? "Çıkılıyor…" : "Çıkış yap"}</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
