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

function formatTurkishPhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("90") && digits.length === 12) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 11) return `+90${digits.slice(1)}`;
  if (digits.length === 10) return `+90${digits}`;
  if (value.trim().startsWith("+") && digits.length >= 10) return `+${digits}`;
  throw new Error("Telefon numarası SMS gönderimine uygun değil.");
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

async function sendAppointmentEmail(input: {
  fullName: string;
  email: string;
  serviceType: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  message?: string;
  subjectPrefix?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.APPOINTMENT_FROM_EMAIL ?? "Cihad Çoban Nutrition <onboarding@resend.dev>";

  if (!apiKey) throw new Error("RESEND_API_KEY eksik.");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.email],
      subject: `${input.subjectPrefix ?? "Randevu durumunuz"}: ${statusLabels[input.status]}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#142018">
          <h2>Merhaba ${escapeHtml(input.fullName)},</h2>
          <p>Randevu talebinizin güncel durumu: <strong>${escapeHtml(statusLabels[input.status])}</strong></p>
          <p><strong>Görüşme:</strong> ${escapeHtml(input.serviceType)}</p>
          <p><strong>Tarih:</strong> ${escapeHtml(input.appointmentDate)}</p>
          <p><strong>Saat:</strong> ${escapeHtml(input.appointmentTime.slice(0, 5))}</p>
          ${input.message ? `<p><strong>Not:</strong> ${escapeHtml(input.message)}</p>` : ""}
          <p style="margin-top:28px;color:#667085;font-size:13px">Cihad Çoban Nutrition</p>
        </div>
      `,
    }),
  });

  const detail = await response.text();
  if (!response.ok) throw new Error(`Resend hatası (${response.status}): ${detail}`);
}

async function sendAppointmentSms(input: {
  fullName: string;
  phone: string;
  appointmentDate: string;
  appointmentTime: string;
}) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID;

  if (!accountSid || !authToken || (!fromNumber && !messagingServiceSid)) {
    throw new Error("SMS için Twilio ortam değişkenleri eksik.");
  }

  const form = new URLSearchParams({
    To: formatTurkishPhone(input.phone),
    Body: `Merhaba ${input.fullName}, ${input.appointmentDate} tarihinde saat ${input.appointmentTime.slice(0, 5)} için randevunuz onaylandı. Cihad Çoban Nutrition`,
  });

  if (messagingServiceSid) form.set("MessagingServiceSid", messagingServiceSid);
  else form.set("From", fromNumber!);

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form,
    },
  );

  const detail = await response.text();
  if (!response.ok) throw new Error(`Twilio hatası (${response.status}): ${detail}`);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const status = String(body.status ?? "") as AppointmentStatus;
  const appointmentDate = String(body.appointmentDate ?? "").trim();
  const appointmentTime = String(body.appointmentTime ?? "").trim();
  const message = String(body.message ?? "").trim().slice(0, 1200);

  if (!allowedStatuses.includes(status)) {
    return NextResponse.json({ error: "Geçersiz durum." }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(appointmentDate) || !/^\d{2}:\d{2}$/.test(appointmentTime)) {
    return NextResponse.json({ error: "Geçerli tarih ve saat seç." }, { status: 400 });
  }

  const selected = new Date(`${appointmentDate}T${appointmentTime}:00`);
  if (Number.isNaN(selected.getTime())) {
    return NextResponse.json({ error: "Geçersiz tarih veya saat." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: current, error: currentError } = await admin
    .from("appointments")
    .select("full_name,email,phone,service_type,appointment_date,appointment_time,status")
    .eq("id", id)
    .single();

  if (currentError || !current) {
    return NextResponse.json({ error: "Randevu bulunamadı." }, { status: 404 });
  }

  const { data: collision } = await admin
    .from("appointments")
    .select("id")
    .neq("id", id)
    .eq("appointment_date", appointmentDate)
    .eq("appointment_time", appointmentTime)
    .in("status", ["pending", "confirmed"])
    .maybeSingle();

  if (collision) {
    return NextResponse.json({ error: "Bu tarih ve saat başka bir randevu tarafından kullanılıyor." }, { status: 409 });
  }

  const changedTime = current.appointment_date !== appointmentDate || String(current.appointment_time).slice(0, 5) !== appointmentTime;
  const changedStatus = current.status !== status;

  const { error } = await admin
    .from("appointments")
    .update({
      status,
      appointment_date: appointmentDate,
      appointment_time: appointmentTime,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let emailSent = false;
  let emailWarning = "";
  let smsSent = false;
  let smsWarning = "";

  if (changedStatus || changedTime || message.length > 0) {
    try {
      await sendAppointmentEmail({
        fullName: current.full_name,
        email: current.email,
        serviceType: current.service_type,
        appointmentDate,
        appointmentTime,
        status,
        message,
        subjectPrefix: status === "confirmed" ? "Randevunuz onaylandı" : changedTime ? "Randevunuz güncellendi" : message ? "Randevunuz hakkında" : "Randevu durumunuz",
      });
      emailSent = true;
    } catch (mailError) {
      emailWarning = mailError instanceof Error ? mailError.message : "E-posta gönderilemedi.";
    }
  }

  if (changedStatus && status === "confirmed") {
    try {
      await sendAppointmentSms({
        fullName: current.full_name,
        phone: current.phone,
        appointmentDate,
        appointmentTime,
      });
      smsSent = true;
    } catch (smsError) {
      smsWarning = smsError instanceof Error ? smsError.message : "SMS gönderilemedi.";
    }
  }

  return NextResponse.json({ ok: true, emailSent, emailWarning, smsSent, smsWarning });
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

  if (!message) return NextResponse.json({ error: "Göndermek için bir mesaj yaz." }, { status: 400 });

  const admin = createAdminClient();
  const { data: appointment, error: appointmentError } = await admin
    .from("appointments")
    .select("full_name,email,service_type,appointment_date,appointment_time,status")
    .eq("id", id)
    .single();

  if (appointmentError || !appointment) {
    return NextResponse.json({ error: "Randevu bulunamadı." }, { status: 404 });
  }

  try {
    await sendAppointmentEmail({
      fullName: appointment.full_name,
      email: appointment.email,
      serviceType: appointment.service_type,
      appointmentDate: appointment.appointment_date,
      appointmentTime: String(appointment.appointment_time),
      status: appointment.status as AppointmentStatus,
      message,
      subjectPrefix: "Randevunuz hakkında",
    });
  } catch (mailError) {
    return NextResponse.json(
      { error: mailError instanceof Error ? mailError.message : "E-posta gönderilemedi." },
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

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
