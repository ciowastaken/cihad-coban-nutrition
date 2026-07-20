"use client";

import { useEffect, useRef, useState } from "react";

type RoleResponse = {
  authenticated?: boolean;
  role?: string | null;
};

type Message = {
  id: string;
  sender_role: "user" | "admin";
  body: string;
  created_at: string;
};

export function SupportBubble() {
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  function isNearBottom(element: HTMLDivElement) {
    return element.scrollHeight - element.scrollTop - element.clientHeight < 96;
  }

  useEffect(() => {
    let active = true;

    async function checkSession() {
      const response = await fetch("/api/auth/role", {
        cache: "no-store",
        credentials: "same-origin",
      }).catch(() => null);

      if (!active) return;

      if (!response?.ok) {
        setVisible(false);
        setReady(true);
        return;
      }

      const data = (await response.json().catch(() => ({}))) as RoleResponse;
      setVisible(data.authenticated === true && data.role !== "admin");
      setReady(true);
    }

    void checkSession();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!visible || !open) return;

    let active = true;

    async function loadMessages() {
      const response = await fetch("/api/support", {
        cache: "no-store",
        credentials: "same-origin",
      }).catch(() => null);

      if (!active || !response) return;

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error || "Canlı destek şu anda yüklenemiyor.");
        return;
      }

      const data = await response.json().catch(() => ({}));
      setMessages(Array.isArray(data.messages) ? data.messages : []);
      setError("");
    }

    void loadMessages();
    const timer = window.setInterval(() => {
      void loadMessages();
    }, 3000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [visible, open]);

  useEffect(() => {
    if (!open || !shouldAutoScrollRef.current) return;

    const messagesElement = messagesRef.current;
    if (!messagesElement) return;

    messagesElement.scrollTo({
      top: messagesElement.scrollHeight,
      behavior: "auto",
    });
  }, [messages, open]);

  async function sendMessage() {
    const message = text.trim();
    if (!message || sending) return;

    setSending(true);
    setError("");

    const response = await fetch("/api/support", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    }).catch(() => null);

    setSending(false);

    if (!response?.ok) {
      const data = await response?.json().catch(() => ({}));
      setError(data?.error || "Mesaj gönderilemedi.");
      return;
    }

    const data = await response.json().catch(() => ({}));
    if (data.message) {
      shouldAutoScrollRef.current = true;
      setMessages((current) => [...current, data.message]);
    }
    setText("");
  }

  if (!ready || !visible) return null;

  return (
    <div className="support-bubble-root">
      {open && (
        <section className="support-bubble-panel" aria-label="Canlı destek">
          <header className="support-bubble-header">
            <div>
              <b>Nasıl yardımcı olabiliriz?</b>
              <span>Mesajını yaz, en kısa sürede yanıtlayalım.</span>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Canlı desteği kapat">×</button>
          </header>

          <div
            className="support-bubble-messages"
            ref={messagesRef}
            onScroll={(event) => {
              shouldAutoScrollRef.current = isNearBottom(event.currentTarget);
            }}
          >
            {messages.length === 0 && !error && (
              <div className="support-bubble-welcome">
                <span>👋</span>
                <b>Merhaba!</b>
                <p>Beslenme programın, randevun veya hesabınla ilgili bize yazabilirsin.</p>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`support-bubble-message ${message.sender_role === "user" ? "mine" : "theirs"}`}
              >
                <p>{message.body}</p>
                <small>{new Date(message.created_at).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}</small>
              </div>
            ))}

            {error && <div className="support-bubble-error">{error}</div>}
          </div>

          <div className="support-bubble-composer">
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage();
                }
              }}
              placeholder="Mesajını yaz…"
              rows={2}
              maxLength={4000}
            />
            <button type="button" onClick={() => void sendMessage()} disabled={sending || !text.trim()}>
              {sending ? "…" : "➤"}
            </button>
          </div>
        </section>
      )}

      {!open && (
        <div className="support-bubble-prompt">Nasıl yardımcı olabiliriz?</div>
      )}

      <button
        type="button"
        className="support-bubble-button"
        onClick={() => {
          shouldAutoScrollRef.current = true;
          setOpen((value) => !value);
        }}
        aria-label="Canlı desteği aç"
      >
        {open ? "×" : "💬"}
      </button>
    </div>
  );
}
