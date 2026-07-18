import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendAppointmentEmail(data: {
  fullName: string;
  email: string;
  phone: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
  note: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.APPOINTMENT_NOTIFICATION_EMAIL;
  const from = process.env.APPOINTMENT_FROM_EMAIL ?? "Randevu <onboarding@resend.dev>";

  if (!apiKey || !recipient) return;

  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [recipient],
      reply_to: data.email,
      subject: `Yeni randevu talebi: ${data.fullName}`,
      html: `
        <h2>Yeni beslenme danışmanlığı randevusu</h2>
        <p><strong>Ad soyad:</strong> ${escapeHtml(data.fullName)}</p>
        <p><strong>E-posta:</strong> ${escapeHtml(data.email)}</p>
        <p><strong>Telefon:</strong> ${escapeHtml(data.phone)}</p>
        <p><strong>Görüşme:</strong> ${escapeHtml(data.serviceType)}</p>
        <p><strong>Tarih:</strong> ${escapeHtml(data.appointmentDate)}</p>
        <p><strong>Saat:</strong> ${escapeHtml(data.appointmentTime)}</p>
        <p><strong>Not:</strong> ${escapeHtml(data.note || "—")}</p>
      `,
    }),
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const fullName = String(body.fullName ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const phone = String(body.phone ?? "").trim();
    const serviceType = String(body.serviceType ?? "").trim();
    const appointmentDate = String(body.appointmentDate ?? "").trim();
    const appointmentTime = String(body.appointmentTime ?? "").trim();
    const note = String(body.note ?? "").trim().slice(0, 800);

    if (
      fullName.length < 2 ||
      !emailPattern.test(email) ||
      phone.length < 10 ||
      !serviceType ||
      !/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate) ||
      !/^\d{2}:\d{2}$/.test(appointmentTime)
    ) {
      return NextResponse.json(
        { error: "Lütfen zorunlu alanları geçerli biçimde doldur." },
        { status: 400 },
      );
    }

    const selected = new Date(`${appointmentDate}T${appointmentTime}:00`);
    if (Number.isNaN(selected.getTime()) || selected.getTime() < Date.now()) {
      return NextResponse.json(
        { error: "Geçmiş bir tarih veya saat seçilemez." },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const admin = createAdminClient();

    const { data: collision } = await admin
      .from("appointments")
      .select("id")
      .eq("appointment_date", appointmentDate)
      .eq("appointment_time", appointmentTime)
      .in("status", ["pending", "confirmed"])
      .maybeSingle();

    if (collision) {
      return NextResponse.json(
        { error: "Bu saat kısa süre önce doldu. Lütfen başka bir saat seç." },
        { status: 409 },
      );
    }

    const { data, error } = await admin
      .from("appointments")
      .insert({
        user_id: user?.id ?? null,
        full_name: fullName,
        email,
        phone,
        service_type: serviceType,
        appointment_date: appointmentDate,
        appointment_time: appointmentTime,
        note: note || null,
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    try {
      await sendAppointmentEmail({
        fullName,
        email,
        phone,
        serviceType,
        appointmentDate,
        appointmentTime,
        note,
      });
    } catch (mailError) {
      console.error("Randevu e-postası gönderilemedi:", mailError);
    }

    return NextResponse.json({ ok: true, id: data.id }, { status: 201 });
  } catch (error) {
    console.error("Randevu oluşturma hatası:", error);
    return NextResponse.json(
      { error: "Randevu talebi oluşturulurken beklenmeyen hata oluştu." },
      { status: 500 },
    );
  }
}
