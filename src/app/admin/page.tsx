"use client";

import { useEffect, useState } from "react";

import { AppNav } from "@/components/layout/AppNav";

type UserRow = {
  id: string;
  email: string;
  createdAt: string;
  profile: null | {
    full_name: string;
    role: string;
    weight_kg: number | null;
    target_weight_kg: number | null;
  };
  plans: {
    id: string;
    title: string;
    status: string;
    created_at: string;
    target_calories: number;
  }[];
};

type AppointmentStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed";

type Appointment = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  service_type: string;
  appointment_date: string;
  appointment_time: string;
  note: string | null;
  status: AppointmentStatus;
  created_at: string;
};

const statusLabels: Record<AppointmentStatus, string> = {
  pending: "Bekliyor",
  confirmed: "Onaylandı",
  cancelled: "İptal edildi",
  completed: "Tamamlandı",
};

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updatingAppointment, setUpdatingAppointment] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError("");

    const [usersResponse, appointmentsResponse] = await Promise.all([
      fetch("/api/admin/users", { cache: "no-store" }),
      fetch("/api/admin/appointments", { cache: "no-store" }),
    ]);

    const usersJson = await usersResponse.json().catch(() => ({}));
    const appointmentsJson = await appointmentsResponse.json().catch(() => ({}));

    if (!usersResponse.ok) {
      setError(usersJson.error || "Admin verileri alınamadı.");
    } else {
      setUsers(usersJson.users ?? []);
    }

    if (!appointmentsResponse.ok) {
      setError((current) => current || appointmentsJson.error || "Randevular alınamadı.");
    } else {
      setAppointments(appointmentsJson.appointments ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Bu kullanıcı ve tüm verileri kalıcı olarak silinsin mi?")) return;

    setDeleting(id);
    const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setDeleting(null);

    if (response.ok) {
      setUsers((current) => current.filter((user) => user.id !== id));
    } else {
      setError("Kullanıcı silinemedi.");
    }
  }

  async function updateAppointment(id: string, status: AppointmentStatus) {
    setUpdatingAppointment(id);
    const response = await fetch(`/api/admin/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setUpdatingAppointment(null);

    if (!response.ok) {
      setError("Randevu durumu güncellenemedi.");
      return;
    }

    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === id ? { ...appointment, status } : appointment,
      ),
    );
  }

  const pendingCount = appointments.filter(
    (appointment) => appointment.status === "pending",
  ).length;

  return (
    <>
      <AppNav />
      <main className="shell-wide py-10 lg:py-16">
        <div className="admin-heading">
          <div>
            <p className="eyebrow"><span /> Yönetim merkezi</p>
            <h1>Üyeler, programlar ve randevular</h1>
            <p>Kullanıcı hesaplarını, programları ve görüşme taleplerini tek panelden yönet.</p>
          </div>
          <div className="admin-stat-group">
            <div className="admin-stat"><b>{users.length}</b><span>toplam üye</span></div>
            <div className="admin-stat attention"><b>{pendingCount}</b><span>bekleyen randevu</span></div>
          </div>
        </div>

        {error && (
          <div className="admin-error">
            {error}
            <small>.env.local içindeki Supabase admin anahtarını ve admin rolünü kontrol et.</small>
          </div>
        )}

        <section className="admin-section-block">
          <div className="section-title-row">
            <div><p className="eyebrow"><span /> Randevu yönetimi</p><h2>Görüşme talepleri</h2></div>
            <span>{appointments.length} kayıt</span>
          </div>

          {loading ? (
            <div className="empty-state">Panel yükleniyor…</div>
          ) : appointments.length === 0 ? (
            <div className="empty-state"><b>Henüz randevu talebi yok</b><p>Yeni talepler burada listelenecek.</p></div>
          ) : (
            <div className="appointment-admin-list">
              {appointments.map((appointment) => (
                <article className="appointment-admin-card" key={appointment.id}>
                  <div className="appointment-admin-main">
                    <div className="appointment-date-box">
                      <b>{new Date(`${appointment.appointment_date}T00:00:00`).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}</b>
                      <span>{appointment.appointment_time.slice(0, 5)}</span>
                    </div>
                    <div>
                      <div className="appointment-admin-title">
                        <h3>{appointment.full_name}</h3>
                        <span className={`appointment-status ${appointment.status}`}>{statusLabels[appointment.status]}</span>
                      </div>
                      <p>{appointment.service_type}</p>
                      <small>{appointment.email} · {appointment.phone}</small>
                      {appointment.note && <blockquote>{appointment.note}</blockquote>}
                    </div>
                  </div>
                  <div className="appointment-admin-actions">
                    <select
                      value={appointment.status}
                      disabled={updatingAppointment === appointment.id}
                      onChange={(event) => void updateAppointment(appointment.id, event.target.value as AppointmentStatus)}
                    >
                      {Object.entries(statusLabels).map(([value, label]) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                    <a href={`mailto:${appointment.email}?subject=Randevu talebiniz hakkında`}>E-posta gönder</a>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="admin-section-block">
          <div className="section-title-row">
            <div><p className="eyebrow"><span /> Kullanıcı yönetimi</p><h2>Üyeler</h2></div>
            <span>{users.length} kayıt</span>
          </div>

          {loading ? (
            <div className="empty-state">Panel yükleniyor…</div>
          ) : (
            <div className="admin-grid">
              {users.map((user) => (
                <article className="admin-user-card" key={user.id}>
                  <div className="admin-user-top">
                    <span className="admin-avatar">{(user.profile?.full_name || user.email).slice(0, 1).toUpperCase()}</span>
                    <div><h2>{user.profile?.full_name || "İsimsiz kullanıcı"}</h2><p>{user.email}</p></div>
                    <span className={`role-badge ${user.profile?.role}`}>{user.profile?.role || "user"}</span>
                  </div>
                  <div className="admin-meta">
                    <div><small>Kayıt</small><b>{new Date(user.createdAt).toLocaleDateString("tr-TR")}</b></div>
                    <div><small>Kilo</small><b>{user.profile?.weight_kg ? `${user.profile.weight_kg} kg` : "—"}</b></div>
                    <div><small>Hedef</small><b>{user.profile?.target_weight_kg ? `${user.profile.target_weight_kg} kg` : "—"}</b></div>
                  </div>
                  <div className="admin-plans">
                    <div><b>Programlar</b><span>{user.plans.length}</span></div>
                    {user.plans.slice(0, 3).map((plan) => (
                      <p key={plan.id}><span>{plan.title}</span><small>{plan.status} · {plan.target_calories} kcal</small></p>
                    ))}
                    {!user.plans.length && <em>Henüz program yok</em>}
                  </div>
                  {user.profile?.role !== "admin" && (
                    <button className="danger-button w-full" onClick={() => remove(user.id)} disabled={deleting === user.id}>
                      {deleting === user.id ? "Siliniyor…" : "Kullanıcıyı sistemden sil"}
                    </button>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </>
  );
}
