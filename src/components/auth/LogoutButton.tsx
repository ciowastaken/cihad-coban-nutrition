"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "@/lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);

    const supabase = createClient();
    await supabase.auth.signOut();

    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={logout}
      disabled={loading}
      className="rounded-full border border-zinc-300 bg-white px-5 py-2.5 text-sm font-semibold transition hover:border-red-300 hover:text-red-600 disabled:opacity-50"
    >
      {loading ? "Çıkılıyor..." : "Çıkış yap"}
    </button>
  );
}
