import type { ReactNode } from "react";
import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";

export default async function PlansLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/plans");

  return children;
}
