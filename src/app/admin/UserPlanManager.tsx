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
    <div className="admin-plans admin-plan-manager">
      <div className="admin-plan-manager-head">
        <div><b>Programlar</b><span>{plans.length}</span></div>
        <button className="admin-action-button primary" onClick={() => setOpen((value) => !value)}>
          {open ? "Formu kapat" : "Program ata"}
        </button>
      </div>

      {open && (
        <div className="admin-inline-panel admin-plan-form">
          <strong>Yeni program ata</strong>
          <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Program adı" maxLength={120} />
          <textarea value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Kısa açıklama (isteğe bağlı)" rows={3} maxLength={1200} />
          <div className="admin-inline-fields">
            <input type="number" min="500" max="10000" value={targetCalories} onChange={(event) => setTargetCalories(event.target.value)} placeholder="Kalori" />
            <select value={status} onChange={(event) => setStatus(event.target.value as "active" | "archived")}>
              <option value="active">Aktif</option>
              <option value="archived">Arşivlenmiş</option>
            </select>
          </div>
          <button className="admin-action-button primary" disabled={busy} onClick={() => void createPlan()}>
            {busy ? "Atanıyor…" : "Programı ata"}
          </button>
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
        {!plans.length && <em>Henüz program yok</em>}
      </div>
    </div>
  );
}
