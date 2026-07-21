import { NextResponse } from "next/server";

import { canManageUserRoles, hasAdminPanelAccess } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!hasAdminPanelAccess(me?.role)) return NextResponse.json({ error: "Yetkisiz." }, { status: 403 });
  const admin = createAdminClient();
  const [{ data: authData, error: authError }, { data: profiles }, { data: plans }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    admin.from("profiles").select("id,full_name,role,created_at,weight_kg,target_weight_kg"),
    admin.from("diet_plans").select("id,user_id,title,status,created_at,target_calories")
  ]);
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
  return NextResponse.json({
    currentUserId: user.id,
    canManageRoles: canManageUserRoles(me?.role),
    users: authData.users.map(u => ({
      id: u.id, email: u.email, createdAt: u.created_at,
      profile: profiles?.find(p => p.id === u.id) ?? null,
      plans: plans?.filter(p => p.user_id === u.id) ?? []
    })),
  });
}
