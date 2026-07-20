import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type SupportPostBody = {
  message?: unknown;
  threadId?: unknown;
  mode?: unknown;
};

function supportError(error: { code?: string | null; message: string }) {
  const missingTable =
    error.code === "PGRST205" ||
    error.code === "42P01" ||
    error.message.toLowerCase().includes("does not exist") ||
    error.message.toLowerCase().includes("could not find the table");

  return NextResponse.json(
    {
      error: missingTable
        ? "Canlı destek tabloları henüz kurulmamış. Supabase SQL Editor'da supabase/migrations/20260720_support_chat.sql dosyasını çalıştırın."
        : error.message,
      code: error.code ?? null,
    },
    { status: missingTable ? 503 : 500 },
  );
}

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role,full_name").eq("id", user.id).maybeSingle();
  return { user, role: profile?.role === "admin" ? "admin" : "user", fullName: profile?.full_name || user.email || "Kullanıcı" } as const;
}

async function getOrCreateThread(userId: string) {
  const admin = createAdminClient();
  const threadResult = await admin
    .from("support_threads")
    .select("id,status,updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (threadResult.error) return { thread: null, error: threadResult.error };
  if (threadResult.data) return { thread: threadResult.data, error: null };

  const created = await admin
    .from("support_threads")
    .insert({ user_id: userId })
    .select("id,status,updated_at")
    .single();

  return { thread: created.data ?? null, error: created.error };
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
        .select("id,user_id,status,updated_at,created_at")
        .order("updated_at", { ascending: false });
      if (error) return supportError(error);

      const userIds = Array.from(new Set((threads ?? []).map((thread) => thread.user_id)));
      const { data: profiles, error: profilesError } = userIds.length
        ? await admin.from("profiles").select("id,full_name").in("id", userIds)
        : { data: [], error: null };

      if (profilesError) return supportError(profilesError);

      const profilesById = new Map(
        (profiles ?? []).map((profile) => [
          profile.id,
          { full_name: profile.full_name },
        ]),
      );

      return NextResponse.json({
        threads: (threads ?? []).map((thread) => ({
          ...thread,
          profiles: profilesById.get(thread.user_id) ?? null,
        })),
      });
    }
    const { data: messages, error } = await admin.from("support_messages")
      .select("id,thread_id,sender_id,sender_role,body,read_at,created_at")
      .eq("thread_id", threadId).order("created_at", { ascending: true });
    if (error) return supportError(error);
    await admin.from("support_messages").update({ read_at: new Date().toISOString() }).eq("thread_id", threadId).eq("sender_role", "user").is("read_at", null);
    return NextResponse.json({ messages: messages ?? [] });
  }

  const threadResult = await admin.from("support_threads").select("id,status,updated_at").eq("user_id", auth.user.id).maybeSingle();
  if (threadResult.error) return supportError(threadResult.error);

  let thread = threadResult.data;
  if (!thread) {
    const created = await admin.from("support_threads").insert({ user_id: auth.user.id }).select("id,status,updated_at").single();
    if (created.error) return supportError(created.error);
    thread = created.data;
  }

  const { data: messages, error } = await admin.from("support_messages")
    .select("id,thread_id,sender_id,sender_role,body,read_at,created_at")
    .eq("thread_id", thread.id).order("created_at", { ascending: true });
  if (error) return supportError(error);
  await admin.from("support_messages").update({ read_at: new Date().toISOString() }).eq("thread_id", thread.id).eq("sender_role", "admin").is("read_at", null);
  return NextResponse.json({ thread, messages: messages ?? [] });
}

export async function POST(request: Request) {
  const auth = await currentUser();
  if (!auth) return NextResponse.json({ error: "Oturum gerekli." }, { status: 401 });
  const admin = createAdminClient();
  const body = (await request.json().catch(() => ({}))) as SupportPostBody;
  const text = String(body.message ?? "").trim().slice(0, 4000);
  if (!text) return NextResponse.json({ error: "Mesaj boş olamaz." }, { status: 400 });

  let threadId = String(body.threadId ?? "");
  let receiverId = "";

  if (auth.role === "admin" && body.mode === "test-user-message") {
    const { thread, error: threadError } = await getOrCreateThread(auth.user.id);
    if (threadError) return supportError(threadError);
    if (!thread) return NextResponse.json({ error: "Test konuşması oluşturulamadı." }, { status: 500 });

    const { data: message, error } = await admin.from("support_messages").insert({
      thread_id: thread.id,
      sender_id: auth.user.id,
      sender_role: "user",
      body: text,
    }).select("id,thread_id,sender_id,sender_role,body,read_at,created_at").single();

    if (error) return supportError(error);

    await admin
      .from("support_threads")
      .update({ updated_at: new Date().toISOString(), status: "open" })
      .eq("id", thread.id);

    return NextResponse.json({ message, thread, testMode: true }, { status: 201 });
  }

  if (auth.role === "admin") {
    if (!threadId) return NextResponse.json({ error: "Konuşma seçilmedi." }, { status: 400 });
    const { data: thread, error: threadError } = await admin.from("support_threads").select("user_id").eq("id", threadId).single();
    if (threadError) return supportError(threadError);
    if (!thread) return NextResponse.json({ error: "Konuşma bulunamadı." }, { status: 404 });
    receiverId = thread.user_id;
  } else {
    const threadResult = await admin.from("support_threads").select("id").eq("user_id", auth.user.id).maybeSingle();
    if (threadResult.error) return supportError(threadResult.error);
    let thread = threadResult.data;
    if (!thread) {
      const created = await admin.from("support_threads").insert({ user_id: auth.user.id }).select("id").single();
      if (created.error) return supportError(created.error);
      thread = created.data;
    }
    threadId = thread.id;
  }

  const { data: message, error } = await admin.from("support_messages").insert({
    thread_id: threadId, sender_id: auth.user.id, sender_role: auth.role, body: text,
  }).select("id,thread_id,sender_id,sender_role,body,read_at,created_at").single();
  if (error) return supportError(error);
  await admin.from("support_threads").update({ updated_at: new Date().toISOString(), status: "open" }).eq("id", threadId);

  if (auth.role === "admin" && receiverId) {
    await admin.from("notifications").insert({
      user_id: receiverId,
      title: "Yeni destek mesajın var",
      message: text.slice(0, 180),
      kind: "message",
      href: "/support",
    });
  }

  return NextResponse.json({ message }, { status: 201 });
}
