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
  membershipTier?: "standard" | "pro" | "clinic" | null;
  fullName?: string | null;
  email?: string;
};

function membershipLabel(isAdmin: boolean, tier?: RoleResponse["membershipTier"]) {
  if (isAdmin) return "Admin";
  if (tier === "clinic") return "Klinik";
  if (tier === "pro") return "PRO";
  return "Standart";
}

function formatFallbackName(email?: string) {
  const value = email?.split("@")[0]?.replace(/[._-]+/g, " ").trim();
  if (!value) return "Kullanıcı";
  return value.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase("tr-TR"));
}

export function SiteHeader({ variant: _variant = "home" }: SiteHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  const [ready, setReady] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [membershipTier, setMembershipTier] = useState<RoleResponse["membershipTier"]>("standard");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Kullanıcı");
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
        setMembershipTier("standard");
        setName("Kullanıcı");
        setEmail("");
        setReady(true);
        return;
      }

      const data = (await response.json().catch(() => ({}))) as RoleResponse;
      const signedIn = data.authenticated === true;
      const admin = signedIn && data.role === "admin";

      setAuthenticated(signedIn);
      setIsAdmin(admin);
      setMembershipTier(data.membershipTier || "standard");
      setName(data.fullName?.trim() || formatFallbackName(data.email));
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
            <Link href="/admin" className={pathname.startsWith("/admin") ? "active" : ""}>Yönetim merkezi</Link>
          ) : (
            <>
              <Link href="/#features">Özellikler</Link>
              <Link href="/#how-it-works">Nasıl çalışır?</Link>
              <Link href="/about" className={pathname === "/about" ? "active" : ""}>Hakkımızda</Link>
              <Link href="/pricing" className={pathname === "/pricing" ? "active" : ""}>Üyelikler</Link>
              <Link href="/appointment" className={pathname === "/appointment" ? "active" : ""}>Randevu</Link>
              {authenticated && <Link href="/dashboard" className={pathname.startsWith("/dashboard") ? "active" : ""}>Kontrol merkezi</Link>}
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
              <span className="public-account-copy"><b>{name}</b><small>{membershipLabel(isAdmin, membershipTier)} · {email || "Üye hesabı"}</small></span>
              <span className="account-chevron">⌄</span>
            </button>

            {open && (
              <div className="public-account-menu">
                {isAdmin ? (
                  <Link href="/admin" onClick={() => setOpen(false)}>Yönetim merkezi</Link>
                ) : (
                  <>
                    <Link href="/dashboard" onClick={() => setOpen(false)}>Kontrol merkezi</Link>
                    <Link href="/plans" onClick={() => setOpen(false)}>Programlarım</Link>
                    <Link href="/profile" onClick={() => setOpen(false)}>Profilimi düzenle</Link>
                    <Link href="/onboarding" onClick={() => setOpen(false)}>Yeni hesaplama</Link>
                    <Link href="/pricing" onClick={() => setOpen(false)}>Üyeliğim: {membershipLabel(false, membershipTier)}</Link>
                  </>
                )}
                <button type="button" onClick={logout} disabled={loggingOut}>{loggingOut ? "Çıkılıyor…" : "Çıkış yap"}</button>
              </div>
            )}
          </div>
        ) : (
          <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="button button-secondary button-small">Giriş yap</Link>
        )}

        {ready && !isAdmin && (
          authenticated ? (
            <Link href="/onboarding" className="button button-primary button-small header-appointment-button">Yeni hesaplama</Link>
          ) : (
            <Link href="/appointment" className="button button-primary button-small header-appointment-button">Randevu al</Link>
          )
        )}
      </div>
    </header>
  );
}
