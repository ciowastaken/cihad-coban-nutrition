import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { PlanExportCenter } from "@/components/plans/PlanExportCenter";
import { hasAdminPanelAccess } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export default async function PlansLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/plans");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (hasAdminPanelAccess(profile?.role)) redirect("/admin");

  return (
    <>
      {children}
      <PlanExportCenter />
      <div className="h-12" />
    </>
  );
}
