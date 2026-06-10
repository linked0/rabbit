"use client";

import { useRef, useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatClient() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || busy) return;

    setError(null);
    setInput("");
    const history = [...messages, { role: "user" as const, content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }

      // 스트림을 읽으며 마지막(어시스턴트) 말풍선에 이어붙임
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((cur) => {
          const next = [...cur];
          const last = next[next.length - 1];
          next[next.length - 1] = {
            role: "assistant",
            content: last.content + chunk,
          };
          return next;
        });
        logRef.current?.scrollTo(0, logRef.current.scrollHeight);
      }
    } catch (e) {
      setError(String(e));
      setMessages(history); // 빈 어시스턴트 말풍선 제거
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="panel">
      <div ref={logRef} className="chat-log">
        {messages.length === 0 && (
          <p className="muted">메시지를 입력해 대화를 시작하세요.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="who">{m.role === "user" ? "나" : "AI"}</div>
            <div className="bubble">
              {m.content ||
                (busy && i === messages.length - 1 ? "생각 중…" : "")}
            </div>
          </div>
        ))}
      </div>
      {error && <p className="err">{error}</p>}
      <form onSubmit={send} style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="질문을 입력하세요"
          disabled={busy}
          autoFocus
        />
        <button type="submit" disabled={busy}>
          {busy ? "응답 중…" : "보내기"}
        </button>
      </form>
    </section>
  );
}
