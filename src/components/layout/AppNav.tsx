"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { createClient } from "@/lib/supabase/client";

type AccountResponse = {
  authenticated?: boolean;
  role?: string | null;
  membershipTier?: "standard" | "pro" | "clinic" | null;
  fullName?: string | null;
  email?: string;
};

function accountLabel(isAdmin: boolean, tier?: AccountResponse["membershipTier"]) {
  if (isAdmin) return "Admin";
  if (tier === "clinic") return "Klinik";
  if (tier === "pro") return "PRO";
  return "Standart";
}

export function AppNav() {
  const pathname = usePathname();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("Hesabım");
  const [email, setEmail] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [membershipTier, setMembershipTier] = useState<AccountResponse["membershipTier"]>("standard");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/role", { cache: "no-store", credentials: "same-origin" })
      .then((response) => response.ok ? response.json() : {})
      .then((data: AccountResponse) => {
        if (!active || !data.authenticated) return;
        setName(data.fullName || data.email?.split("@")[0] || "Hesabım");
        setEmail(data.email || "");
        setIsAdmin(data.role === "admin");
        setMembershipTier(data.membershipTier || "standard");
      });

    const close = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => {
      active = false;
      document.removeEventListener("mousedown", close);
    };
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
        <BrandLogo href={isAdmin ? "/admin" : "/"} subtitle={isAdmin ? "Yönetim Paneli" : "Nutrition Platform"} />

        <nav className="app-nav-links" aria-label="Ana menü">
          {isAdmin ? (
            <Link href="/admin" className={pathname.startsWith("/admin") ? "active" : ""}>Yönetim merkezi</Link>
          ) : (
            <>
              <Link href="/#features">Özellikler</Link>
              <Link href="/#how-it-works">Nasıl çalışır?</Link>
              <Link href="/about" className={pathname === "/about" ? "active" : ""}>Hakkımızda</Link>
              <Link href="/pricing" className={pathname === "/pricing" ? "active" : ""}>Üyelikler</Link>
              <Link href="/appointment" className={pathname === "/appointment" ? "active" : ""}>Randevu</Link>
              <Link href="/dashboard" className={pathname.startsWith("/dashboard") ? "active" : ""}>Kontrol merkezi</Link>
            </>
          )}
        </nav>

        <div className="nav-account" ref={menuRef}>
          {!isAdmin && <Link href="/onboarding" className="button button-primary button-small nav-new-plan">Yeni hesaplama</Link>}
          <button type="button" className="account-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
            <span className="account-avatar">{name.slice(0, 1).toUpperCase()}</span>
            <span className="account-copy"><b>{name}</b><small>{accountLabel(isAdmin, membershipTier)} · {email || "Üye hesabı"}</small></span>
            <span>⌄</span>
          </button>

          {open && (
            <div className="account-menu">
              {isAdmin ? (
                <Link href="/admin" onClick={() => setOpen(false)}>Yönetim merkezi</Link>
              ) : (
                <>
                  <Link href="/profile" onClick={() => setOpen(false)}>Profili düzenle</Link>
                  <Link href="/plans" onClick={() => setOpen(false)}>Programlarım</Link>
                  <Link href="/pricing" onClick={() => setOpen(false)}>Üyeliğim: {accountLabel(false, membershipTier)}</Link>
                </>
              )}
              <button type="button" onClick={logout} disabled={loading}>{loading ? "Çıkılıyor…" : "Çıkış yap"}</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
