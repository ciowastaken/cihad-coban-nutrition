import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const allowedStatuses = ["pending", "confirmed", "cancelled", "completed"] as const;
type AppointmentStatus = (typeof allowedStatuses)[number];

const statusLabels: Record<AppointmentStatus, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylandı",
  cancelled: "İptal edildi",
  completed: "Tamamlandı",
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: NextResponse.json({ error: "Oturum gerekli." }, { status: 401 }) };
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (me?.role !== "admin") {
    return { error: NextResponse.json({ error: "Yetkisiz." }, { status: 403 }) };
  }

  return { error: null };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const { status } = await request.json();

  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const message = String(body.message ?? "").trim().slice(0, 1200);

  const admin = createAdminClient();
  const { data: appointment, error: appointmentError } = await admin
    .from("appointments")
    .select("full_name,email,service_type,appointment_date,appointment_time,status")
    .eq("id", id)
    .single();

  if (appointmentError || !appointment) {
    return NextResponse.json({ error: "Randevu bulunamadı." }, { status: 404 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.APPOINTMENT_FROM_EMAIL ?? "Cihad Çoban Nutrition <onboarding@resend.dev>";

  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY eksik." }, { status: 500 });
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [appointment.email],
      subject: `Randevu durumunuz: ${statusLabels[appointment.status as AppointmentStatus]}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#142018">
          <h2>Merhaba ${escapeHtml(appointment.full_name)},</h2>
          <p>Randevu talebinizin güncel durumu: <strong>${escapeHtml(statusLabels[appointment.status as AppointmentStatus])}</strong></p>
          <p><strong>Görüşme:</strong> ${escapeHtml(appointment.service_type)}</p>
          <p><strong>Tarih:</strong> ${escapeHtml(appointment.appointment_date)}</p>
          <p><strong>Saat:</strong> ${escapeHtml(String(appointment.appointment_time).slice(0, 5))}</p>
          ${message ? `<p><strong>Not:</strong> ${escapeHtml(message)}</p>` : ""}
          <p style="margin-top:28px;color:#667085;font-size:13px">Cihad Çoban Nutrition</p>
        </div>
      `,
    }),
  });

  const detail = await response.text();
  if (!response.ok) {
    return NextResponse.json(
      { error: `Resend hatası (${response.status}): ${detail}` },
      { status: 502 },
    );
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const admin = createAdminClient();
  const { error } = await admin.from("appointments").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
