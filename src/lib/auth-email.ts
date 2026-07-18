function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.AUTH_FROM_EMAIL ??
    process.env.APPOINTMENT_FROM_EMAIL ??
    "Cihad Çoban Nutrition <onboarding@resend.dev>";

  if (!apiKey) {
    throw new Error("RESEND_API_KEY eksik. Auth e-postası gönderilemedi.");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Resend e-posta hatası (${response.status}): ${detail}`);
  }
}

export async function sendSignupConfirmationEmail(input: {
  email: string;
  fullName: string;
  confirmationUrl: string;
}) {
  const safeName = escapeHtml(input.fullName || "Merhaba");
  const safeUrl = escapeHtml(input.confirmationUrl);

  await sendEmail({
    to: input.email,
    subject: "E-posta adresini doğrula",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#142018">
        <h2>Hoş geldin, ${safeName}</h2>
        <p>Hesabını etkinleştirmek için aşağıdaki düğmeye tıkla.</p>
        <p style="margin:28px 0">
          <a href="${safeUrl}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:700">Hesabımı doğrula</a>
        </p>
        <p style="font-size:13px;color:#667085">Bu işlemi sen başlatmadıysan e-postayı yok sayabilirsin.</p>
      </div>
    `,
  });
}

export async function sendPasswordRecoveryEmail(input: {
  email: string;
  recoveryUrl: string;
}) {
  const safeUrl = escapeHtml(input.recoveryUrl);

  await sendEmail({
    to: input.email,
    subject: "Şifreni yenile",
    html: `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#142018">
        <h2>Şifre yenileme isteği</h2>
        <p>Yeni bir şifre belirlemek için aşağıdaki düğmeye tıkla.</p>
        <p style="margin:28px 0">
          <a href="${safeUrl}" style="display:inline-block;background:#059669;color:#fff;text-decoration:none;padding:14px 22px;border-radius:12px;font-weight:700">Şifremi yenile</a>
        </p>
        <p style="font-size:13px;color:#667085">Bu isteği sen oluşturmadıysan e-postayı yok sayabilirsin.</p>
      </div>
    `,
  });
}
