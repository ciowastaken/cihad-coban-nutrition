import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { AppNav } from "@/components/layout/AppNav";
import { hasAdminPanelAccess } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (hasAdminPanelAccess(profile?.role)) {
    redirect("/admin");
  }

  return (
    <>
      <AppNav />
      {children}
    </>
  );
}
