import { redirect } from "next/navigation";

import { hasAdminPanelAccess } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin");

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!hasAdminPanelAccess(data?.role)) redirect("/dashboard");

  return children;
}
