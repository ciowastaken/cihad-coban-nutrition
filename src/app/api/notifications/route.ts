import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ notifications: [] });

  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,message,href,read_at,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) return NextResponse.json({ notifications: [] });
  return NextResponse.json({ notifications: data ?? [] });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  let query = supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id);
  if (body.id) query = query.eq("id", body.id);
  else query = query.is("read_at", null);

  const { error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
