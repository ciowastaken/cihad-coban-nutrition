"use client";

import { FormEvent, useMemo, useState } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";

const slots = [
  "09:00",
  "10:00",
  "11:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
];

const services = [
  "İlk beslenme görüşmesi",
  "Kontrol ve program güncelleme",
  "Online beslenme danışmanlığı",
  "Sporcu beslenmesi görüşmesi",
];

export default function AppointmentPage() {
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const payload = Object.fromEntries(form.entries());

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        setSuccess("");
        setError(
          typeof json.error === "string"
            ? json.error
            : "Randevu talebi oluşturulamadı.",
        );
        return;
      }

      formElement.reset();

      if (json.emailSent === false) {
        setSuccess("");
        setError(
          typeof json.warning === "string"
            ? json.warning
            : "Randevu kaydedildi fakat e-posta bildirimi gönderilemedi.",
        );
        return;
      }

      setError("");
      setSuccess("Randevu talebin alındı ve bildirim e-postası gönderildi.");
    } catch (requestError) {
      console.error("Randevu gönderme hatası:", requestError);
      setSuccess("");
      setError("Bağlantı hatası oluştu. Lütfen tekrar dene.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="appointment-page">
      <SiteHeader variant="simple" />

      <section className="appointment-shell shell-wide">
        <div className="appointment-copy">
          <div className="eyebrow"><span /> Beslenme danışmanlığı</div>
          <h1>Uygun zamanı seç, görüşme talebini gönder.</h1>
          <p>
            Bu alan tıbbi acil durumlar için değildir. Beslenme hedeflerin,
            mevcut düzenin ve program güncelleme ihtiyaçların için görüşme
            talebi oluşturabilirsin.
          </p>
          <div className="appointment-benefits">
            <div><b>01</b><span>Talebin güvenli biçimde kaydedilir.</span></div>
            <div><b>02</b><span>Yeni randevu bildirimi danışmana e-posta ile gider.</span></div>
            <div><b>03</b><span>Onay veya değişiklik bilgisi sana iletilir.</span></div>
          </div>
        </div>

        <form className="appointment-form" onSubmit={submit}>
          <div className="appointment-form-head">
            <span>✦</span>
            <div>
              <small>Randevu talebi</small>
              <h2>Bilgilerini doldur</h2>
            </div>
          </div>

          <label>
            Ad soyad
            <input name="fullName" required minLength={2} placeholder="Adın ve soyadın" />
          </label>

          <div className="appointment-form-grid">
            <label>
              E-posta
              <input name="email" type="email" required placeholder="ornek@mail.com" />
            </label>
            <label>
              Telefon
              <input name="phone" type="tel" required placeholder="05xx xxx xx xx" />
            </label>
          </div>

          <label>
            Görüşme türü
            <select name="serviceType" required defaultValue="">
              <option value="" disabled>Bir görüşme türü seç</option>
              {services.map((service) => <option key={service}>{service}</option>)}
            </select>
          </label>

          <div className="appointment-form-grid">
            <label>
              Tarih
              <input name="appointmentDate" type="date" min={today} required />
            </label>
            <label>
              Saat
              <select name="appointmentTime" required defaultValue="">
                <option value="" disabled>Saat seç</option>
                {slots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
              </select>
            </label>
          </div>

          <label>
            Kısa not
            <textarea
              name="note"
              rows={4}
              maxLength={800}
              placeholder="Görüşmede konuşmak istediğin konu veya hedefin..."
            />
          </label>

          {error && <div className="appointment-alert error" role="alert">{error}</div>}
          {success && <div className="appointment-alert success" role="status">{success}</div>}

          <button className="button button-primary w-full" disabled={loading}>
            {loading ? "Talep gönderiliyor…" : "Randevu talebi gönder →"}
          </button>

          <p className="appointment-note">
            Gönderim yaparak bilgilerin randevu iletişimi amacıyla işlenmesini kabul edersin.
          </p>
        </form>
      </section>
    </main>
  );
}
