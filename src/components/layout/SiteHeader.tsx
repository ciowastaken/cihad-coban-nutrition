"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { createClient } from "@/lib/supabase/client";

type SiteHeaderProps = {
  variant?: "home" | "simple";
};

type RoleResponse = {
  authenticated?: boolean;
  role?: string | null;
  fullName?: string | null;
  email?: string;
};

export function SiteHeader({ variant: _variant = "home" }: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Hesabım");
  const [email, setEmail] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function syncUser() {
      setReady(false);
      const response = await fetch("/api/auth/role", {
        cache: "no-store",
        credentials: "same-origin",
      }).catch(() => null);

      if (!active) return;

      if (!response?.ok) {
        setAuthenticated(false);
        setIsAdmin(false);
        setName("Hesabım");
        setEmail("");
        setReady(true);
        return;
      }

      const data = (await response.json().catch(() => ({}))) as RoleResponse;
      const signedIn = data.authenticated === true;
      setAuthenticated(signedIn);
      setIsAdmin(signedIn && data.role === "admin");
      setName(data.fullName || data.email?.split("@")[0] || "Hesabım");
      setEmail(data.email || "");
      setReady(true);
    }

    void syncUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      void syncUser();
    });

    function closeMenu(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    }

    document.addEventListener("mousedown", closeMenu);
    return () => {
      active = false;
      subscription.unsubscribe();
      document.removeEventListener("mousedown", closeMenu);
    };
  }, []);

  async function logout() {
    setLoggingOut(true);
    await createClient().auth.signOut();
    setOpen(false);
    setAuthenticated(false);
    setIsAdmin(false);
    router.replace("/");
    router.refresh();
    setLoggingOut(false);
  }

  return (
    <header className="site-header shell-wide shared-header">
      <BrandLogo
        href={isAdmin ? "/admin" : authenticated ? "/dashboard" : "/"}
        subtitle={isAdmin ? "Yönetim Paneli" : "Nutrition"}
      />

      {ready ? (
        <nav className="site-nav" aria-label="Ana menü">
          {isAdmin ? (
            <>
              <Link href="/admin" className={pathname.startsWith("/admin") ? "active" : ""}>Yönetim merkezi</Link>
              <Link href="/" className={pathname === "/" ? "active" : ""}>Siteyi görüntüle</Link>
            </>
          ) : (
            <>
              <Link href="/#features">Özellikler</Link>
              <Link href="/#how-it-works">Nasıl çalışır?</Link>
              <Link href="/about">Hakkımızda</Link>
              <Link href="/appointment" className={pathname === "/appointment" ? "active" : ""}>Randevu</Link>
              {authenticated && <Link href="/dashboard">Kontrol merkezi</Link>}
            </>
          )}
        </nav>
      ) : (
        <span className="header-nav-skeleton" aria-hidden="true" />
      )}

      <div className="header-actions">
        {!ready ? (
          <span className="header-auth-skeleton" aria-hidden="true" />
        ) : authenticated ? (
          <div className="public-account" ref={menuRef}>
            <button type="button" className="public-account-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
              <span className="public-account-avatar">{name.slice(0, 1).toLocaleUpperCase("tr-TR")}</span>
              <span className="public-account-copy"><b>{name}</b><small>{email || "Üye hesabı"}</small></span>
              <span className="account-chevron">⌄</span>
            </button>

            {open && (
              <div className="public-account-menu">
                {isAdmin ? (
                  <>
                    <Link href="/admin" onClick={() => setOpen(false)}>Yönetim merkezi</Link>
                    <Link href="/" onClick={() => setOpen(false)}>Siteyi görüntüle</Link>
                  </>
                ) : (
                  <>
                    <Link href="/dashboard" onClick={() => setOpen(false)}>Kontrol merkezi</Link>
                    <Link href="/plans" onClick={() => setOpen(false)}>Programlarım</Link>
                    <Link href="/profile" onClick={() => setOpen(false)}>Profilimi düzenle</Link>
                  </>
                )}
                <button type="button" onClick={logout} disabled={loggingOut}>{loggingOut ? "Çıkılıyor…" : "Çıkış yap"}</button>
              </div>
            )}
          </div>
        ) : (
          <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="button button-secondary button-small">Giriş yap</Link>
        )}

        {ready && !isAdmin && <Link href="/appointment" className="button button-primary button-small header-appointment-button">Randevu al</Link>}
      </div>
    </header>
  );
}
