import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role,full_name").eq("id", user.id).maybeSingle();
  return { user, role: profile?.role === "admin" ? "admin" : "user", fullName: profile?.full_name || user.email || "Kullanıcı" } as const;
}

export async function GET(request: Request) {
  const auth = await currentUser();
  if (!auth) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const admin = createAdminClient();
  const url = new URL(request.url);

  if (auth.role === "admin") {
    const threadId = url.searchParams.get("threadId");
    if (!threadId) {
      const { data: threads, error } = await admin.from("support_threads")
        .select("id,user_id,status,updated_at,created_at,profiles:user_id(full_name)")
        .order("updated_at", { ascending: false });
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ threads: threads ?? [] });
    }
    const { data: messages, error } = await admin.from("support_messages")
      .select("id,thread_id,sender_id,sender_role,body,read_at,created_at")
      .eq("thread_id", threadId).order("created_at", { ascending: true });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin.from("support_messages").update({ read_at: new Date().toISOString() }).eq("thread_id", threadId).eq("sender_role", "user").is("read_at", null);
    return NextResponse.json({ messages: messages ?? [] });
  }

  let { data: thread } = await admin.from("support_threads").select("id,status,updated_at").eq("user_id", auth.user.id).maybeSingle();
  if (!thread) {
    const created = await admin.from("support_threads").insert({ user_id: auth.user.id }).select("id,status,updated_at").single();
    if (created.error) return NextResponse.json({ error: created.error.message }, { status: 500 });
    thread = created.data;
  }
  const { data: messages, error } = await admin.from("support_messages")
    .select("id,thread_id,sender_id,sender_role,body,read_at,created_at")
    .eq("thread_id", thread.id).order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await admin.from("support_messages").update({ read_at: new Date().toISOString() }).eq("thread_id", thread.id).eq("sender_role", "admin").is("read_at", null);
  return NextResponse.json({ thread, messages: messages ?? [] });
}

export async function POST(request: Request) {
  const auth = await currentUser();
  if (!auth) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const admin = createAdminClient();
  const body = await request.json().catch(() => ({}));
  const text = String(body.message ?? "").trim().slice(0, 4000);
  if (!text) return NextResponse.json({ error: "Mesaj boş olamaz." }, { status: 400 });

  let threadId = String(body.threadId ?? "");
  let receiverId = "";
  if (auth.role === "admin") {
    if (!threadId) return NextResponse.json({ error: "Konuşma seçilmedi." }, { status: 400 });
    const { data: thread } = await admin.from("support_threads").select("user_id").eq("id", threadId).single();
    if (!thread) return NextResponse.json({ error: "Konuşma bulunamadı." }, { status: 404 });
    receiverId = thread.user_id;
  } else {
    let { data: thread } = await admin.from("support_threads").select("id").eq("user_id", auth.user.id).maybeSingle();
    if (!thread) {
      const created = await admin.from("support_threads").insert({ user_id: auth.user.id }).select("id").single();
      if (created.error) return NextResponse.json({ error: created.error.message }, { status: 500 });
      thread = created.data;
    }
    threadId = thread.id;
  }

  const { data: message, error } = await admin.from("support_messages").insert({
    thread_id: threadId, sender_id: auth.user.id, sender_role: auth.role, body: text,
  }).select("id,thread_id,sender_id,sender_role,body,read_at,created_at").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  await admin.from("support_threads").update({ updated_at: new Date().toISOString(), status: "open" }).eq("id", threadId);

  if (auth.role === "admin" && receiverId) {
    await admin.from("notifications").insert({
      user_id: receiverId,
      title: "Yeni destek mesajın var",
      body: text.slice(0, 180),
      type: "message",
      href: "/support",
    });
  }

  return NextResponse.json({ message }, { status: 201 });
}