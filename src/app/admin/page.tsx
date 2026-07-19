"use client";

import { useEffect, useMemo, useState } from "react";

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

type AppointmentStatus = "pending" | "confirmed" | "cancelled" | "completed";

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
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [updatingAppointment, setUpdatingAppointment] = useState<string | null>(null);
  const [sendingAppointment, setSendingAppointment] = useState<string | null>(null);
  const [deletingAppointment, setDeletingAppointment] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>("all");

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
      setNotice("Kullanıcı sistemden silindi.");
    } else {
      setError("Kullanıcı silinemedi.");
    }
  }

  async function updateAppointment(id: string, status: AppointmentStatus) {
    setUpdatingAppointment(id);
    setError("");
    setNotice("");

    const response = await fetch(`/api/admin/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await response.json().catch(() => ({}));
    setUpdatingAppointment(null);

    if (!response.ok) {
      setError(json.error || "Randevu durumu güncellenemedi.");
      return;
    }

    setAppointments((current) =>
      current.map((appointment) =>
        appointment.id === id ? { ...appointment, status } : appointment,
      ),
    );
    setNotice(`Randevu durumu “${statusLabels[status]}” olarak güncellendi.`);
  }

  async function sendAppointmentEmail(appointment: Appointment) {
    const message = prompt(
      "E-postaya eklenecek kısa notu yazabilirsin. Boş bırakırsan yalnızca randevu durumu gönderilir:",
      "",
    );
    if (message === null) return;

    setSendingAppointment(appointment.id);
    setError("");
    setNotice("");

    const response = await fetch(`/api/admin/appointments/${appointment.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const json = await response.json().catch(() => ({}));
    setSendingAppointment(null);

    if (!response.ok) {
      setError(json.error || "Randevu e-postası gönderilemedi.");
      return;
    }

    setNotice(`${appointment.email} adresine randevu e-postası gönderildi.`);
  }

  async function deleteAppointment(appointment: Appointment) {
    if (!confirm(`${appointment.full_name} adlı kişinin bu randevusu kalıcı olarak silinsin mi?`)) return;

    setDeletingAppointment(appointment.id);
    setError("");
    setNotice("");

    const response = await fetch(`/api/admin/appointments/${appointment.id}`, {
      method: "DELETE",
    });
    const json = await response.json().catch(() => ({}));
    setDeletingAppointment(null);

    if (!response.ok) {
      setError(json.error || "Randevu silinemedi.");
      return;
    }

    setAppointments((current) => current.filter((item) => item.id !== appointment.id));
    setNotice("Randevu kalıcı olarak silindi.");
  }

  const pendingCount = appointments.filter((appointment) => appointment.status === "pending").length;

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");

    return appointments.filter((appointment) => {
      const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
      const matchesSearch =
        !query ||
        [appointment.full_name, appointment.email, appointment.phone, appointment.service_type]
          .some((value) => value.toLocaleLowerCase("tr-TR").includes(query));

      return matchesStatus && matchesSearch;
    });
  }, [appointments, search, statusFilter]);

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

        {error && <div className="admin-error">{error}</div>}
        {notice && <div className="appointment-alert success" role="status">{notice}</div>}

        <section className="admin-section-block">
          <div className="section-title-row">
            <div><p className="eyebrow"><span /> Randevu yönetimi</p><h2>Görüşme talepleri</h2></div>
            <button className="button" onClick={() => void load()} disabled={loading}>
              {loading ? "Yenileniyor…" : "Listeyi yenile"}
            </button>
          </div>

          <div className="appointment-admin-actions" style={{ marginBottom: 20, justifyContent: "flex-start", flexWrap: "wrap" }}>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ad, e-posta, telefon veya görüşme ara"
              style={{ minWidth: 280 }}
            />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | AppointmentStatus)}>
              <option value="all">Tüm durumlar</option>
              {Object.entries(statusLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <span>{filteredAppointments.length} / {appointments.length} kayıt</span>
          </div>

          {loading ? (
            <div className="empty-state">Panel yükleniyor…</div>
          ) : filteredAppointments.length === 0 ? (
            <div className="empty-state"><b>Eşleşen randevu yok</b><p>Arama veya filtreyi değiştir.</p></div>
          ) : (
            <div className="appointment-admin-list">
              {filteredAppointments.map((appointment) => (
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
                    <button
                      className="button button-primary"
                      onClick={() => void sendAppointmentEmail(appointment)}
                      disabled={sendingAppointment === appointment.id}
                    >
                      {sendingAppointment === appointment.id ? "Gönderiliyor…" : "E-posta gönder"}
                    </button>
                    <button
                      className="danger-button"
                      onClick={() => void deleteAppointment(appointment)}
                      disabled={deletingAppointment === appointment.id}
                    >
                      {deletingAppointment === appointment.id ? "Siliniyor…" : "Randevuyu sil"}
                    </button>
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
