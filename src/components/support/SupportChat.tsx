"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "./support.css";

type Message = {
  id: string;
  thread_id: string;
  sender_role: "user" | "admin";
  body: string;
  created_at: string;
};

type Thread = {
  id: string;
  user_id: string;
  status: string;
  updated_at: string;
  profiles?: { full_name?: string | null } | null;
};

type ApiError = {
  error?: string;
};

export function SupportChat({ admin = false }: { admin?: boolean }) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [threadId, setThreadId] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const messagesRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  function isNearBottom(element: HTMLDivElement) {
    return element.scrollHeight - element.scrollTop - element.clientHeight < 96;
  }

  const loadThreads = useCallback(async () => {
    if (!admin) return;

    const response = await fetch("/api/support", {
      cache: "no-store",
      credentials: "same-origin",
    }).catch(() => null);

    if (!response?.ok) {
      const data = (await response?.json().catch(() => ({}))) as ApiError;
      setError(data.error || "Canlı destek konuşmaları yüklenemedi.");
      return;
    }

    const data = (await response.json().catch(() => ({}))) as {
      threads?: Thread[];
    };
    const nextThreads = Array.isArray(data.threads) ? data.threads : [];

    setThreads(nextThreads);
    setThreadId((current) => {
      if (current && nextThreads.some((thread) => thread.id === current)) {
        return current;
      }

      return nextThreads[0]?.id ?? "";
    });
    setError("");
  }, [admin]);

  const loadMessages = useCallback(async () => {
    if (admin && !threadId) {
      setMessages([]);
      return;
    }

    const url =
      admin && threadId
        ? `/api/support?threadId=${encodeURIComponent(threadId)}`
        : "/api/support";

    const response = await fetch(url, {
      cache: "no-store",
      credentials: "same-origin",
    }).catch(() => null);

    if (!response?.ok) {
      const data = (await response?.json().catch(() => ({}))) as ApiError;
      setError(data.error || "Mesajlar yüklenemedi.");
      return;
    }

    const data = (await response.json().catch(() => ({}))) as {
      messages?: Message[];
      thread?: Thread;
    };

    setMessages(Array.isArray(data.messages) ? data.messages : []);
    if (!admin && data.thread?.id) setThreadId(data.thread.id);
    setError("");
  }, [admin, threadId]);

  useEffect(() => {
    if (!admin) return;

    const timer = window.setTimeout(() => {
      void loadThreads();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [admin, loadThreads]);

  useEffect(() => {
    const initialTimer = window.setTimeout(() => {
      void loadMessages();
    }, 0);

    const interval = window.setInterval(() => {
      void loadMessages();
      if (admin) void loadThreads();
    }, 2000);

    return () => {
      window.clearTimeout(initialTimer);
      window.clearInterval(interval);
    };
  }, [admin, loadMessages, loadThreads]);

  useEffect(() => {
    if (!shouldAutoScrollRef.current) return;

    const messagesElement = messagesRef.current;
    if (!messagesElement) return;

    messagesElement.scrollTo({
      top: messagesElement.scrollHeight,
      behavior: "auto",
    });
  }, [messages]);

  async function createTestConversation() {
    setSending(true);
    setError("");

    const response = await fetch("/api/support", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: "test-user-message",
        message:
          "Tek oturum test mesajı: Kullanıcı canlı destekten yazmış gibi görünsün.",
      }),
    }).catch(() => null);

    setSending(false);

    if (!response?.ok) {
      const data = (await response?.json().catch(() => ({}))) as ApiError;
      setError(data.error || "Test konuşması oluşturulamadı.");
      return;
    }

    const data = (await response.json().catch(() => ({}))) as {
      message?: Message;
    };

    if (data.message) {
      shouldAutoScrollRef.current = true;
      setThreadId(data.message.thread_id);
      setMessages([data.message]);
    }

    await loadThreads();
  }

  async function send() {
    const message = text.trim();
    if (!message) return;

    if (admin && !threadId) {
      setError("Yanıt göndermek için önce bir konuşma seç veya test konuşması başlat.");
      return;
    }

    setSending(true);
    setError("");

    const response = await fetch("/api/support", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, threadId: admin ? threadId : undefined }),
    }).catch(() => null);

    setSending(false);

    if (!response?.ok) {
      const data = (await response?.json().catch(() => ({}))) as ApiError;
      setError(data.error || "Mesaj gönderilemedi.");
      return;
    }

    setText("");
    shouldAutoScrollRef.current = true;
    await loadMessages();
    if (admin) await loadThreads();
  }

  const selectedThread = threads.find((thread) => thread.id === threadId);
  const canSend = !sending && text.trim().length > 0 && (!admin || Boolean(threadId));

  return (
    <div className={`support-shell ${admin ? "support-admin" : ""}`}>
      {admin && (
        <aside className="support-thread-list">
          <div className="support-list-head">
            <div>
              <b>Canlı destek</b>
              <span>{threads.length} konuşma</span>
            </div>
            <button
              type="button"
              className="support-test-button"
              onClick={() => void createTestConversation()}
              disabled={sending}
            >
              Test başlat
            </button>
          </div>

          {threads.map((thread) => (
            <button
              key={thread.id}
              type="button"
              className={threadId === thread.id ? "active" : ""}
              onClick={() => {
                shouldAutoScrollRef.current = true;
                setThreadId(thread.id);
              }}
            >
              <b>{thread.profiles?.full_name || "Kullanıcı"}</b>
              <small>{new Date(thread.updated_at).toLocaleString("tr-TR")}</small>
            </button>
          ))}

          {!threads.length && (
            <p className="support-empty">
              Henüz destek konuşması yok. Tek oturumda denemek için test konuşması başlat.
            </p>
          )}
        </aside>
      )}

      <section className="support-chat-panel">
        <header>
          <div>
            <b>{admin ? "Kullanıcıyla canlı görüşme" : "Canlı destek"}</b>
            <small>
              {admin && selectedThread
                ? `${selectedThread.profiles?.full_name || "Kullanıcı"} konuşması`
                : "Mesajlar yaklaşık 2 saniyede yenilenir"}
            </small>
          </div>
          <span className="support-online">● Çevrimiçi</span>
        </header>

        {error && <div className="support-error">{error}</div>}

        <div
          className="support-messages"
          ref={messagesRef}
          onScroll={(event) => {
            shouldAutoScrollRef.current = isNearBottom(event.currentTarget);
          }}
        >
          {messages.map((message) => (
            <div
              key={message.id}
              className={`support-message ${
                message.sender_role === (admin ? "admin" : "user") ? "mine" : "theirs"
              }`}
            >
              <p>{message.body}</p>
              <small>
                {new Date(message.created_at).toLocaleTimeString("tr-TR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </small>
            </div>
          ))}

          {!messages.length && (
            <div className="support-empty">
              {admin
                ? "Konuşma seç veya tek oturum test konuşması başlat."
                : "Mesaj yazarak konuşmayı başlat."}
            </div>
          )}
        </div>

        <div className="support-composer">
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void send();
              }
            }}
            placeholder={
              admin && !threadId
                ? "Önce konuşma seç veya test konuşması başlat."
                : "Mesajını yaz..."
            }
            maxLength={4000}
          />
          <button type="button" onClick={() => void send()} disabled={!canSend}>
            {sending ? "Gönderiliyor..." : "Gönder"}
          </button>
        </div>
      </section>
    </div>
  );
}
