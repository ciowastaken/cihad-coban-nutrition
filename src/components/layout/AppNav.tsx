"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { BrandLogo } from "@/components/brand/BrandLogo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { hasAdminPanelAccess, normalizeRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";

type AccountResponse = {
  authenticated?: boolean;
  role?: string | null;
  membershipTier?: "standard" | "pro" | "clinic" | null;
  fullName?: string | null;
  email?: string;
};

function accountLabel(role: string | null, tier?: AccountResponse["membershipTier"]) {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === "admin") return "Admin";
  if (normalizedRole === "yetkili") return "Yetkili";
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
  const [role, setRole] = useState<string | null>(null);
  const [membershipTier, setMembershipTier] = useState<AccountResponse["membershipTier"]>("standard");
  const [loading, setLoading] = useState(false);
  const panelAccess = hasAdminPanelAccess(role);

  useEffect(() => {
    let active = true;

    fetch("/api/auth/role", { cache: "no-store", credentials: "same-origin" })
      .then((response) => response.ok ? response.json() : {})
      .then((data: AccountResponse) => {
        if (!active || !data.authenticated) return;
        setName(data.fullName || data.email?.split("@")[0] || "Hesabım");
        setEmail(data.email || "");
        setRole(data.role ?? null);
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
        <BrandLogo href={panelAccess ? "/admin" : "/"} subtitle={panelAccess ? "Yönetim Paneli" : "Nutrition Platform"} />
        <nav className="app-nav-links" aria-label="Ana menü">
          {panelAccess ? (
            <>
              <Link href="/admin" className={pathname === "/admin" ? "active" : ""}>Yönetim merkezi</Link>
              <Link href="/admin/support" className={pathname.startsWith("/admin/support") ? "active" : ""}>Canlı destek</Link>
            </>
          ) : (
            <>
              <Link href="/#features">Özellikler</Link>
              <Link href="/#how-it-works">Nasıl çalışır?</Link>
              <Link href="/about">Hakkımızda</Link>
              <Link href="/pricing">Üyelikler</Link>
              <Link href="/appointment">Randevu</Link>
              <Link href="/dashboard">Kontrol merkezi</Link>
            </>
          )}
        </nav>
        <div className="flex items-center gap-3">
          <NotificationBell />
          <div className="nav-account" ref={menuRef}>
            {!panelAccess && <Link href="/onboarding" className="button button-primary button-small nav-new-plan">Yeni hesaplama</Link>}
            <button type="button" className="account-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
              <span className="account-avatar">{name.slice(0, 1).toUpperCase()}</span>
              <span className="account-copy"><b>{name}</b><small>{accountLabel(role, membershipTier)} · {email || "Üye hesabı"}</small></span>
              <span>⌄</span>
            </button>
            {open && (
              <div className="account-menu">
                {panelAccess ? (
                  <>
                    <Link href="/admin" onClick={() => setOpen(false)}>Yönetim merkezi</Link>
                    <Link href="/admin/support" onClick={() => setOpen(false)}>Canlı destek</Link>
                  </>
                ) : (
                  <>
                    <Link href="/profile" onClick={() => setOpen(false)}>Profili düzenle</Link>
                    <Link href="/plans" onClick={() => setOpen(false)}>Programlarım</Link>
                    <Link href="/pricing" onClick={() => setOpen(false)}>Üyeliğim: {accountLabel(null, membershipTier)}</Link>
                  </>
                )}
                <button type="button" onClick={logout} disabled={loading}>{loading ? "Çıkılıyor…" : "Çıkış yap"}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
