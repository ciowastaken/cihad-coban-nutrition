"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { createClient } from "@/lib/supabase/client";

type SiteHeaderProps = {
  variant?: "home" | "simple";
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
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setAuthenticated(false);
        setIsAdmin(false);
        setName("Hesabım");
        setEmail("");
        setReady(true);
        return;
      }

      setAuthenticated(true);
      setEmail(user.email ?? "");

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name,role")
        .eq("id", user.id)
        .maybeSingle();

      if (!active) return;

      setIsAdmin(profile?.role === "admin");
      setName(
        profile?.full_name ||
          user.user_metadata?.full_name ||
          user.email?.split("@")[0] ||
          "Hesabım",
      );
      setReady(true);
    }

    void syncUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      void syncUser();
    });

    function closeMenu(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
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
      <BrandLogo href={authenticated ? "/dashboard" : "/"} subtitle="Nutrition" />

      <nav className="site-nav" aria-label="Ana menü">
        <Link href="/#features">Özellikler</Link>
        <Link href="/#how-it-works">Nasıl çalışır?</Link>
        <Link href="/about">Hakkımızda</Link>
        <Link href="/appointment" className={pathname === "/appointment" ? "active" : ""}>
          Randevu
        </Link>
        {authenticated && <Link href="/dashboard">Kontrol merkezi</Link>}
        {isAdmin && <Link href="/admin" className={pathname === "/admin" ? "active" : ""}>Admin</Link>}
      </nav>

      <div className="header-actions">
        {!ready ? (
          <span className="header-auth-skeleton" aria-hidden="true" />
        ) : authenticated ? (
          <div className="public-account" ref={menuRef}>
            <button
              type="button"
              className="public-account-trigger"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
            >
              <span className="public-account-avatar">
                {name.slice(0, 1).toLocaleUpperCase("tr-TR")}
              </span>
              <span className="public-account-copy">
                <b>{name}</b>
                <small>{email || "Üye hesabı"}</small>
              </span>
              <span className="account-chevron">⌄</span>
            </button>

            {open && (
              <div className="public-account-menu">
                <Link href="/dashboard" onClick={() => setOpen(false)}>
                  Kontrol merkezi
                </Link>
                <Link href="/plans" onClick={() => setOpen(false)}>
                  Programlarım
                </Link>
                <Link href="/profile" onClick={() => setOpen(false)}>
                  Profilimi düzenle
                </Link>
                {isAdmin && (
                  <Link href="/admin" onClick={() => setOpen(false)}>
                    Admin paneli
                  </Link>
                )}
                <button type="button" onClick={logout} disabled={loggingOut}>
                  {loggingOut ? "Çıkılıyor…" : "Çıkış yap"}
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="button button-secondary button-small">
            Giriş yap
          </Link>
        )}

        <Link href="/appointment" className="button button-primary button-small header-appointment-button">
          Randevu al
        </Link>
      </div>
    </header>
  );
}
