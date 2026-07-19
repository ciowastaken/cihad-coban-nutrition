"use client";

import { useState } from "react";

type Plan = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  target_calories: number;
};

type Props = {
  userId: string;
  plans: Plan[];
  onChange: (plans: Plan[]) => void;
  onNotice: (message: string) => void;
  onError: (message: string) => void;
};

export function UserPlanManager({ userId, plans, onChange, onNotice, onError }: Props) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [targetCalories, setTargetCalories] = useState("2000");
  const [status, setStatus] = useState<"active" | "archived">("active");

  async function createPlan() {
    if (!title.trim()) {
      onError("Program adı zorunlu.");
      return;
    }

    setBusy(true);
    onError("");
    onNotice("");

    const response = await fetch(`/api/admin/users/${userId}/plans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, summary, targetCalories: Number(targetCalories), status }),
    });
    const json = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      onError(json.error || "Program atanamadı.");
      return;
    }

    onChange([json.plan, ...plans]);
    setTitle("");
    setSummary("");
    setTargetCalories("2000");
    setStatus("active");
    setOpen(false);
    onNotice("Program kullanıcıya atandı.");
  }

  async function deletePlan(plan: Plan) {
    if (!confirm(`“${plan.title}” programı kalıcı olarak silinsin mi?`)) return;

    setBusy(true);
    onError("");
    onNotice("");

    const response = await fetch(
      `/api/admin/users/${userId}/plans?planId=${encodeURIComponent(plan.id)}`,
      { method: "DELETE" },
    );
    const json = await response.json().catch(() => ({}));
    setBusy(false);

    if (!response.ok) {
      onError(json.error || "Program silinemedi.");
      return;
    }

    onChange(plans.filter((item) => item.id !== plan.id));
    onNotice("Program silindi.");
  }

  return (
    <div className="admin-plan-manager">
      <div className="admin-plan-manager-head">
        <div className="admin-plan-title">
          <div>
            <b>Programlar</b>
            <small>Kullanıcıya atanmış beslenme planları</small>
          </div>
          <span>{plans.length}</span>
        </div>
        <button className="admin-action-button primary admin-plan-toggle" onClick={() => setOpen((value) => !value)}>
          {open ? "Vazgeç" : "+ Program ata"}
        </button>
      </div>

      {open && (
        <div className="admin-plan-form">
          <div className="admin-plan-form-head">
            <strong>Yeni program oluştur</strong>
            <p>Temel bilgileri gir; kullanıcı programını kendi hesabında görecek.</p>
          </div>

          <div className="admin-plan-fields">
            <label className="admin-plan-field admin-plan-field-wide">
              <span>Program adı</span>
              <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Örn. Yağ kaybı başlangıç programı" maxLength={120} />
            </label>

            <label className="admin-plan-field admin-plan-field-wide">
              <span>Kısa açıklama</span>
              <textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Programın amacı, süresi veya kısa not..." rows={4} maxLength={1200} />
            </label>

            <label className="admin-plan-field">
              <span>Günlük kalori</span>
              <input type="number" min="500" max="10000" value={targetCalories} onChange={(event) => setTargetCalories(event.target.value)} />
            </label>

            <label className="admin-plan-field">
              <span>Durum</span>
              <select value={status} onChange={(event) => setStatus(event.target.value as "active" | "archived")}>
                <option value="active">Aktif</option>
                <option value="archived">Arşivlenmiş</option>
              </select>
            </label>
          </div>

          <div className="admin-plan-form-actions">
            <button className="admin-action-button primary" disabled={busy} onClick={() => void createPlan()}>
              {busy ? "Atanıyor…" : "Programı kullanıcıya ata"}
            </button>
            <button className="admin-action-button" disabled={busy} onClick={() => setOpen(false)}>İptal</button>
          </div>
        </div>
      )}

      <div className="admin-plan-list">
        {plans.map((plan) => (
          <div className="admin-plan-row" key={plan.id}>
            <div>
              <b>{plan.title}</b>
              <small>{plan.status === "active" ? "Aktif" : "Arşivlenmiş"} · {plan.target_calories} kcal</small>
            </div>
            <button className="admin-action-button danger" disabled={busy} onClick={() => void deletePlan(plan)}>Sil</button>
          </div>
        ))}
        {!plans.length && <div className="admin-plan-empty">Henüz program atanmadı.</div>}
      </div>
    </div>
  );
}
