import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { hasAdminPanelAccess } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export default async function ProfileLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/profile");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (hasAdminPanelAccess(profile?.role)) redirect("/admin");

  return children;
}
