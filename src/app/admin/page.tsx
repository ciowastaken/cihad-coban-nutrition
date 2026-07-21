"use client";

import { useEffect, useMemo, useState } from "react";

import { AppNav } from "@/components/layout/AppNav";
import { normalizeRole, type UserRole } from "@/lib/roles";
import { UserPlanManager } from "./UserPlanManager";
import "./admin.css";

type Plan = { id: string; title: string; status: string; created_at: string; target_calories: number };
type UserRow = {
  id: string;
  email: string;
  createdAt: string;
  profile: null | { full_name: string; role: string; weight_kg: number | null; target_weight_kg: number | null };
  plans: Plan[];
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
const roleOptions: { value: UserRole; label: string; hint: string }[] = [
  { value: "user", label: "Kullanıcı", hint: "Normal üye alanı" },
  { value: "yetkili", label: "Yetkili", hint: "Admin panele giriş yapar" },
  { value: "admin", label: "Admin", hint: "Rank ve kullanıcı yönetir" },
];
const roleLabels: Record<UserRole, string> = {
  user: "Kullanıcı",
  yetkili: "Yetkili",
  admin: "Admin",
};
const slots = ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

export default function AdminPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [deletingUser, setDeletingUser] = useState<string | null>(null);
  const [updatingRole, setUpdatingRole] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [canManageRoles, setCanManageRoles] = useState(false);
  const [busyAppointment, setBusyAppointment] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | AppointmentStatus>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [emailId, setEmailId] = useState<string | null>(null);
  const [emailMessage, setEmailMessage] = useState("");
  const [draftDate, setDraftDate] = useState("");
  const [draftTime, setDraftTime] = useState("");
  const [draftStatus, setDraftStatus] = useState<AppointmentStatus>("pending");
  const [draftMessage, setDraftMessage] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    const [usersResponse, appointmentsResponse] = await Promise.all([
      fetch("/api/admin/users", { cache: "no-store" }),
      fetch("/api/admin/appointments", { cache: "no-store" }),
    ]);
    const usersJson = await usersResponse.json().catch(() => ({}));
    const appointmentsJson = await appointmentsResponse.json().catch(() => ({}));
    if (!usersResponse.ok) setError(usersJson.error || "Admin verileri alınamadı.");
    else {
      setUsers(usersJson.users ?? []);
      setCurrentUserId(usersJson.currentUserId ?? "");
      setCanManageRoles(usersJson.canManageRoles === true);
    }
    if (!appointmentsResponse.ok) setError((current) => current || appointmentsJson.error || "Randevular alınamadı.");
    else setAppointments(appointmentsJson.appointments ?? []);
    setLoading(false);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void load();
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  async function removeUser(id: string) {
    if (!confirm("Bu kullanıcı ve tüm verileri kalıcı olarak silinsin mi?")) return;
    setDeletingUser(id);
    const response = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
    setDeletingUser(null);
    if (response.ok) {
      setUsers((current) => current.filter((user) => user.id !== id));
      setNotice("Kullanıcı sistemden silindi.");
    } else setError("Kullanıcı silinemedi.");
  }

  function updateUserPlans(userId: string, plans: Plan[]) {
    setUsers((current) => current.map((user) => user.id === userId ? { ...user, plans } : user));
  }

  async function updateUserRole(userId: string, role: UserRole) {
    const label = roleLabels[role];
    if (!confirm(`Bu kullanıcının rankı "${label}" olarak değiştirilsin mi?`)) return;

    setUpdatingRole(userId);
    setError("");
    setNotice("");

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const json = await response.json().catch(() => ({}));
    setUpdatingRole(null);

    if (!response.ok) {
      setError(json.error || "Rank güncellenemedi.");
      return;
    }

    const nextRole = normalizeRole(json.profile?.role ?? role);
    setUsers((current) => current.map((user) => {
      if (user.id !== userId) return user;

      return {
        ...user,
        profile: {
          full_name: user.profile?.full_name ?? "",
          role: nextRole,
          weight_kg: user.profile?.weight_kg ?? null,
          target_weight_kg: user.profile?.target_weight_kg ?? null,
        },
      };
    }));
    setNotice(`Kullanıcı rankı ${roleLabels[nextRole]} olarak güncellendi.`);
  }

  function startEditing(appointment: Appointment) {
    setEditingId(appointment.id);
    setEmailId(null);
    setDraftDate(appointment.appointment_date);
    setDraftTime(appointment.appointment_time.slice(0, 5));
    setDraftStatus(appointment.status);
    setDraftMessage("");
    setError("");
    setNotice("");
  }

  function notificationResult(json: Record<string, unknown>, successText: string) {
    const warnings = [json.emailWarning, json.smsWarning].filter(Boolean).join(" ");
    if (warnings) setError(`${successText} Ancak: ${warnings}`);
    else if (json.emailSent && json.smsSent) setNotice(`${successText} Kullanıcıya e-posta ve SMS gönderildi.`);
    else if (json.emailSent) setNotice(`${successText} Kullanıcıya e-posta gönderildi. SMS servisi yapılandırılmadı.`);
    else setNotice(successText);
  }

  async function approveAppointment(appointment: Appointment) {
    if (!confirm(`${appointment.full_name} adlı kişinin randevusu onaylansın mı?`)) return;
    setBusyAppointment(appointment.id);
    setError("");
    setNotice("");

    const response = await fetch(`/api/admin/appointments/${appointment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: "confirmed",
        appointmentDate: appointment.appointment_date,
        appointmentTime: appointment.appointment_time.slice(0, 5),
        message: "Randevunuz onaylandı.",
      }),
    });
    const json = await response.json().catch(() => ({}));
    setBusyAppointment(null);

    if (!response.ok) {
      setError(json.error || "Randevu onaylanamadı.");
      return;
    }

    setAppointments((current) => current.map((item) => item.id === appointment.id ? { ...item, status: "confirmed" } : item));
    notificationResult(json, "Randevu onaylandı.");
  }

  async function saveAppointment(appointment: Appointment) {
    setBusyAppointment(appointment.id);
    setError("");
    setNotice("");
    const response = await fetch(`/api/admin/appointments/${appointment.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: draftStatus, appointmentDate: draftDate, appointmentTime: draftTime, message: draftMessage }),
    });
    const json = await response.json().catch(() => ({}));
    setBusyAppointment(null);
    if (!response.ok) {
      setError(json.error || "Randevu güncellenemedi.");
      return;
    }
    setAppointments((current) => current.map((item) => item.id === appointment.id ? { ...item, status: draftStatus, appointment_date: draftDate, appointment_time: draftTime } : item));
    setEditingId(null);
    setDraftMessage("");
    notificationResult(json, "Randevu güncellendi.");
  }

  async function sendAppointmentEmail(appointment: Appointment) {
    const message = emailMessage.trim();
    if (!message) {
      setError("E-posta göndermek için bir mesaj yaz.");
      return;
    }
    setBusyAppointment(appointment.id);
    setError("");
    setNotice("");
    const response = await fetch(`/api/admin/appointments/${appointment.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const json = await response.json().catch(() => ({}));
    setBusyAppointment(null);
    if (!response.ok) {
      setError(json.error || "Randevu e-postası gönderilemedi.");
      return;
    }
    setNotice(`${appointment.email} adresine e-posta gönderildi.`);
    setEmailId(null);
    setEmailMessage("");
  }

  async function deleteAppointment(appointment: Appointment) {
    if (!confirm(`${appointment.full_name} adlı kişinin bu randevusu kalıcı olarak silinsin mi?`)) return;
    setBusyAppointment(appointment.id);
    const response = await fetch(`/api/admin/appointments/${appointment.id}`, { method: "DELETE" });
    const json = await response.json().catch(() => ({}));
    setBusyAppointment(null);
    if (!response.ok) setError(json.error || "Randevu silinemedi.");
    else {
      setAppointments((current) => current.filter((item) => item.id !== appointment.id));
      setNotice("Randevu kalıcı olarak silindi.");
    }
  }

  const pendingCount = appointments.filter((appointment) => appointment.status === "pending").length;
  const todayCount = appointments.filter((appointment) => appointment.appointment_date === new Date().toISOString().slice(0, 10)).length;
  const completedCount = appointments.filter((appointment) => appointment.status === "completed").length;
  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("tr-TR");
    return appointments.filter((appointment) => {
      const matchesStatus = statusFilter === "all" || appointment.status === statusFilter;
      const matchesSearch = !query || [appointment.full_name, appointment.email, appointment.phone, appointment.service_type]
        .some((value) => value.toLocaleLowerCase("tr-TR").includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [appointments, search, statusFilter]);
  const matchingUser = (appointment: Appointment) => users.find((user) => user.email.toLocaleLowerCase("tr-TR") === appointment.email.toLocaleLowerCase("tr-TR"));

  return (
    <>
      <AppNav />
      <main className="shell-wide py-10 lg:py-16">
        <div className="admin-heading">
          <div><p className="eyebrow"><span /> Yönetim merkezi</p><h1>Üyeler, programlar ve randevular</h1><p>Kullanıcı hesaplarını, programları ve görüşme taleplerini tek panelden yönet.</p></div>
          <div className="admin-stat-group">
            <div className="admin-stat"><b>{users.length}</b><span>toplam üye</span></div>
            <div className="admin-stat attention"><b>{pendingCount}</b><span>bekleyen randevu</span></div>
            <div className="admin-stat"><b>{todayCount}</b><span>bugünkü randevu</span></div>
            <div className="admin-stat"><b>{completedCount}</b><span>tamamlanan</span></div>
          </div>
        </div>
        {error && <div className="admin-error">{error}</div>}
        {notice && <div className="appointment-alert success" role="status">{notice}</div>}

        <section className="admin-section-block">
          <div className="section-title-row"><div><p className="eyebrow"><span /> Randevu yönetimi</p><h2>Görüşme talepleri</h2></div><button className="button" onClick={() => void load()} disabled={loading}>{loading ? "Yenileniyor…" : "Listeyi yenile"}</button></div>
          <div className="appointment-admin-actions" style={{ marginBottom: 20, justifyContent: "flex-start", flexWrap: "wrap" }}>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Ad, e-posta, telefon veya görüşme ara" style={{ minWidth: 280 }} />
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as "all" | AppointmentStatus)}><option value="all">Tüm durumlar</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <span>{filteredAppointments.length} / {appointments.length} kayıt</span>
          </div>

          {loading ? <div className="empty-state">Panel yükleniyor…</div> : filteredAppointments.length === 0 ? <div className="empty-state"><b>Eşleşen randevu yok</b><p>Arama veya filtreyi değiştir.</p></div> : (
            <div className="appointment-admin-list">
              {filteredAppointments.map((appointment) => {
                const user = matchingUser(appointment);
                const previousCount = appointments.filter((item) => item.email === appointment.email).length;
                const isEditing = editingId === appointment.id;
                const showingDetails = detailId === appointment.id;
                const composingEmail = emailId === appointment.id;
                return (
                  <article className="appointment-admin-card admin-appointment-card" key={appointment.id}>
                    <div className="appointment-admin-main"><div className="appointment-date-box"><b>{new Date(`${appointment.appointment_date}T00:00:00`).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" })}</b><span>{appointment.appointment_time.slice(0, 5)}</span></div><div><div className="appointment-admin-title"><h3>{appointment.full_name}</h3><span className={`appointment-status ${appointment.status}`}>{statusLabels[appointment.status]}</span></div><p>{appointment.service_type}</p><small>{appointment.email} · {appointment.phone}</small>{appointment.note && <blockquote>{appointment.note}</blockquote>}</div></div>

                    {isEditing && <div className="admin-inline-panel"><strong>Randevuyu düzenle</strong><div className="admin-inline-fields"><input type="date" value={draftDate} onChange={(event) => setDraftDate(event.target.value)} /><select value={draftTime} onChange={(event) => setDraftTime(event.target.value)}>{slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}</select><select value={draftStatus} onChange={(event) => setDraftStatus(event.target.value as AppointmentStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div><textarea value={draftMessage} onChange={(event) => setDraftMessage(event.target.value)} placeholder="Değişiklikle birlikte kullanıcıya gönderilecek isteğe bağlı not" rows={3} maxLength={1200} /><p className="admin-email-hint">Tarih, saat veya durum değişirse e-posta otomatik gider. Onaylama işleminde SMS de gönderilir.</p><div className="admin-panel-actions"><button className="admin-action-button primary" onClick={() => void saveAppointment(appointment)} disabled={busyAppointment === appointment.id}>{busyAppointment === appointment.id ? "Gönderiliyor…" : "Kaydet ve bildir"}</button><button className="admin-action-button" onClick={() => setEditingId(null)}>Vazgeç</button></div></div>}
                    {showingDetails && <div className="admin-detail-box"><strong>Danışan özeti</strong><p>Toplam randevu: {previousCount}</p><p>Kilo: {user?.profile?.weight_kg ? `${user.profile.weight_kg} kg` : "—"} · Hedef: {user?.profile?.target_weight_kg ? `${user.profile.target_weight_kg} kg` : "—"}</p><p>Aktif programlar: {user?.plans.length ?? 0}</p>{user?.plans.slice(0, 3).map((plan) => <small key={plan.id} style={{ display: "block" }}>{plan.title} · {plan.status} · {plan.target_calories} kcal</small>)}</div>}
                    {composingEmail && <div className="admin-inline-panel"><strong>Kullanıcıya e-posta gönder</strong><p className="admin-email-hint">Alıcı: {appointment.email}</p><textarea value={emailMessage} onChange={(event) => setEmailMessage(event.target.value)} placeholder="Göndermek istediğin mesajı yaz…" rows={4} maxLength={1200} autoFocus /><div className="admin-panel-actions"><button className="admin-action-button primary" onClick={() => void sendAppointmentEmail(appointment)} disabled={busyAppointment === appointment.id}>{busyAppointment === appointment.id ? "Gönderiliyor…" : "E-postayı gönder"}</button><button className="admin-action-button" onClick={() => { setEmailId(null); setEmailMessage(""); }}>Vazgeç</button></div></div>}

                    <div className="admin-appointment-actions">
                      {appointment.status === "pending" && <button className="admin-action-button approve" onClick={() => void approveAppointment(appointment)} disabled={busyAppointment === appointment.id}>{busyAppointment === appointment.id ? "Onaylanıyor…" : "Randevuyu onayla"}</button>}
                      <button className="admin-action-button" onClick={() => startEditing(appointment)}>Düzenle</button>
                      <button className="admin-action-button" onClick={() => setDetailId(showingDetails ? null : appointment.id)}>{showingDetails ? "Detayı kapat" : "Danışan detayı"}</button>
                      <button className="admin-action-button primary" onClick={() => { setEmailId(composingEmail ? null : appointment.id); setEditingId(null); setEmailMessage(""); }}>{composingEmail ? "E-postayı kapat" : "Mesaj gönder"}</button>
                      <a className="admin-action-button primary" href={`https://wa.me/90${appointment.phone.replace(/\D/g, "").replace(/^0/, "")}?text=${encodeURIComponent(`Merhaba ${appointment.full_name}, randevunuz hakkında iletişime geçiyorum.`)}`} target="_blank" rel="noreferrer">WhatsApp</a>
                      <button className="admin-action-button danger" onClick={() => void deleteAppointment(appointment)} disabled={busyAppointment === appointment.id}>{busyAppointment === appointment.id ? "İşleniyor…" : "Randevuyu sil"}</button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        <section className="admin-section-block">
          <div className="section-title-row"><div><p className="eyebrow"><span /> Kullanıcı yönetimi</p><h2>Üyeler</h2></div><span>{users.length} kayıt</span></div>
          {loading ? <div className="empty-state">Panel yükleniyor…</div> : <div className="admin-grid">
            {users.map((user) => {
              const role = normalizeRole(user.profile?.role);
              const isSelf = user.id === currentUserId;

              return (
                <article className="admin-user-card" key={user.id}>
                  <div className="admin-user-top"><span className="admin-avatar">{(user.profile?.full_name || user.email).slice(0, 1).toUpperCase()}</span><div><h2>{user.profile?.full_name || "İsimsiz kullanıcı"}</h2><p>{user.email}</p></div><span className={`role-badge ${role}`}>{roleLabels[role]}</span></div>
                  <div className="admin-meta"><div><small>Kayıt</small><b>{new Date(user.createdAt).toLocaleDateString("tr-TR")}</b></div><div><small>Kilo</small><b>{user.profile?.weight_kg ? `${user.profile.weight_kg} kg` : "—"}</b></div><div><small>Hedef</small><b>{user.profile?.target_weight_kg ? `${user.profile.target_weight_kg} kg` : "—"}</b></div></div>
                  <div className="admin-role-editor">
                    <div><b>Kullanıcı rankı</b><small>{roleOptions.find((option) => option.value === role)?.hint}</small>{isSelf && <small>Kendi rankını güvenlik için buradan değiştiremezsin.</small>}</div>
                    <select
                      value={role}
                      onChange={(event) => void updateUserRole(user.id, event.target.value as UserRole)}
                      disabled={!canManageRoles || isSelf || updatingRole === user.id}
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>
                  <UserPlanManager userId={user.id} plans={user.plans} onChange={(plans) => updateUserPlans(user.id, plans)} onNotice={setNotice} onError={setError} />
                  {canManageRoles && !isSelf && role !== "admin" && <button className="danger-button w-full" onClick={() => void removeUser(user.id)} disabled={deletingUser === user.id}>{deletingUser === user.id ? "Siliniyor…" : "Kullanıcıyı sistemden sil"}</button>}
                </article>
              );
            })}
          </div>}
        </section>
      </main>
    </>
  );
}
