"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/brand/BrandLogo";

const links = [
  { href: "/dashboard", label: "Kontrol merkezi" },
  { href: "/plans", label: "Programım" },
  { href: "/profile", label: "Profil" },
  { href: "/appointment", label: "Randevu" },
];

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
      const { data: profile } = await supabase.from("profiles").select("full_name,role").eq("id", data.user.id).single();
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
        <BrandLogo href="/dashboard" subtitle="Nutrition Platform" />
        <nav className="app-nav-links" aria-label="Uygulama menüsü">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className={pathname === link.href ? "active" : ""}>{link.label}</Link>
          ))}
          {isAdmin && <Link href="/admin" className={pathname.startsWith("/admin") ? "active" : ""}>Admin</Link>}
        </nav>
        <div className="nav-account" ref={menuRef}>
          <Link href="/onboarding" className="button button-primary button-small nav-new-plan">Yeni hesaplama</Link>
          <button type="button" className="account-trigger" onClick={() => setOpen(v => !v)} aria-expanded={open}>
            <span className="account-avatar">{name.slice(0,1).toUpperCase()}</span>
            <span className="account-copy"><b>{name}</b><small>{email || "Üye hesabı"}</small></span>
            <span>⌄</span>
          </button>
          {open && <div className="account-menu">
            <Link href="/profile">Profili düzenle</Link>
            <Link href="/plans">Programlarım</Link>
            {isAdmin && <Link href="/admin">Admin paneli</Link>}
            <button type="button" onClick={logout} disabled={loading}>{loading ? "Çıkılıyor…" : "Çıkış yap"}</button>
          </div>}
        </div>
      </div>
    </header>
  );
}
