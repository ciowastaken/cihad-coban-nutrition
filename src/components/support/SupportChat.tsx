"use client";

import { useEffect, useRef, useState } from "react";

type Message = { id:string; sender_role:"user"|"admin"; body:string; created_at:string };
type Thread = { id:string; user_id:string; status:string; updated_at:string; profiles?: { full_name?: string|null } | null };

export function SupportChat({ admin = false }: { admin?: boolean }) {
  const [threads,setThreads]=useState<Thread[]>([]);
  const [threadId,setThreadId]=useState("");
  const [messages,setMessages]=useState<Message[]>([]);
  const [text,setText]=useState("");
  const [sending,setSending]=useState(false);
  const bottomRef=useRef<HTMLDivElement>(null);

  async function loadThreads(){
    if(!admin) return;
    const r=await fetch("/api/support",{cache:"no-store"});
    if(!r.ok) return;
    const j=await r.json();
    setThreads(j.threads||[]);
    if(!threadId && j.threads?.[0]?.id) setThreadId(j.threads[0].id);
  }
  async function loadMessages(){
    const url=admin && threadId ? `/api/support?threadId=${encodeURIComponent(threadId)}` : "/api/support";
    if(admin && !threadId) return;
    const r=await fetch(url,{cache:"no-store"});
    if(!r.ok) return;
    const j=await r.json();
    setMessages(j.messages||[]);
    if(!admin && j.thread?.id) setThreadId(j.thread.id);
  }
  useEffect(()=>{void loadThreads();},[admin]);
  useEffect(()=>{void loadMessages(); const timer=setInterval(()=>{void loadMessages(); if(admin) void loadThreads();},2000); return()=>clearInterval(timer);},[admin,threadId]);
  useEffect(()=>bottomRef.current?.scrollIntoView({behavior:"smooth"}),[messages]);

  async function send(){
    const message=text.trim(); if(!message) return;
    setSending(true);
    const r=await fetch("/api/support",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message,threadId:admin?threadId:undefined})});
    setSending(false);
    if(r.ok){setText(""); await loadMessages(); if(admin) await loadThreads();}
  }

  return <div className={`support-shell ${admin?"support-admin":""}`}>
    {admin && <aside className="support-thread-list">
      <div className="support-list-head"><b>Canlı destek</b><span>{threads.length} konuşma</span></div>
      {threads.map(t=><button key={t.id} className={threadId===t.id?"active":""} onClick={()=>setThreadId(t.id)}>
        <b>{t.profiles?.full_name || "Kullanıcı"}</b><small>{new Date(t.updated_at).toLocaleString("tr-TR")}</small>
      </button>)}
      {!threads.length && <p className="support-empty">Henüz destek konuşması yok.</p>}
    </aside>}
    <section className="support-chat-panel">
      <header><div><b>{admin?"Kullanıcıyla canlı görüşme":"Canlı destek"}</b><small>Mesajlar yaklaşık 2 saniyede yenilenir</small></div><span className="support-online">● Çevrimiçi</span></header>
      <div className="support-messages">
        {messages.map(m=><div key={m.id} className={`support-message ${m.sender_role===(admin?"admin":"user")?"mine":"theirs"}`}><p>{m.body}</p><small>{new Date(m.created_at).toLocaleTimeString("tr-TR",{hour:"2-digit",minute:"2-digit"})}</small></div>)}
        {!messages.length && <div className="support-empty">Mesaj yazarak konuşmayı başlat.</div>}
        <div ref={bottomRef}/>
      </div>
      <div className="support-composer"><textarea value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();void send();}}} placeholder="Mesajını yaz…" maxLength={4000}/><button onClick={()=>void send()} disabled={sending||!text.trim()}>{sending?"Gönderiliyor…":"Gönder"}</button></div>
    </section>
  </div>;
}