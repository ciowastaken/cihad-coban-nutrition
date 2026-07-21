import { NextResponse } from "next/server";

import { canManageUserRoles, isUserRole } from "@/lib/roles";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireRoleManager(targetId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Oturum gerekli." }, { status: 401 }) };
  const { data: me } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!canManageUserRoles(me?.role) || targetId === user.id) {
    return { error: NextResponse.json({ error: "Bu işlem yapılamaz." }, { status: 403 }) };
  }

  return { error: null };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireRoleManager(id);
  if (auth.error) return auth.error;

  const body = await request.json().catch(() => ({}));
  const role = String(body.role ?? "").trim();
  if (!isUserRole(role)) return NextResponse.json({ error: "Geçersiz rank seçildi." }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", id)
    .select("id,role")
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (data) return NextResponse.json({ ok: true, profile: data });

  const created = await admin
    .from("profiles")
    .upsert({ id, role })
    .select("id,role")
    .single();

  if (created.error) return NextResponse.json({ error: created.error.message }, { status: 500 });
  return NextResponse.json({ ok: true, profile: created.data });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireRoleManager(id);
  if (auth.error) return auth.error;

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
