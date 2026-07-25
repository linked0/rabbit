"use client";

import { useRef, useState } from "react";
import { useLang } from "../LangContext";
import { pick } from "@/lib/i18n";

type Msg = { role: "user" | "assistant"; content: string };

export default function ChatClient() {
  const { lang } = useLang();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mcp, setMcp] = useState(false); // 🍝 스파게티 MCP on/off
  const [aboutMe, setAboutMe] = useState(false); // 👤 About-me RAG on/off
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
        body: JSON.stringify({ messages: history, mcp, aboutMe }),
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
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }}>
        <button
          type="button"
          className={aboutMe ? "" : "ghost"}
          onClick={() => setAboutMe((v) => !v)}
          title={pick(
            lang,
            "Hyunjae Lee에 대해 물어보는 모드 on/off (프로필·프로젝트 기반 RAG)",
            "Toggle 'Ask about Hyunjae Lee' mode (RAG over his profile & projects)"
          )}
        >
          👤 About Hyunjae: {aboutMe ? "on" : "off"}
        </button>
        <button
          type="button"
          className={mcp ? "" : "ghost"}
          onClick={() => setMcp((v) => !v)}
          title={pick(lang, "스파게티 레시피 MCP 도구 on/off", "Toggle the Spaghetti recipe MCP tool")}
        >
          🍝 Spaghetti MCP: {mcp ? "on" : "off"}
        </button>
        {aboutMe && (
          <span className="muted">
            {pick(
              lang,
              "Hyunjae Lee의 경력·프로젝트로 답합니다 — 예: “무슨 일을 하나요?”, “예측 시장 프로젝트가 뭐죠?”",
              "Answers from Hyunjae Lee's background — e.g. “What does he do?”, “Tell me about the prediction market project.”"
            )}
          </span>
        )}
        {mcp && (
          <span className="muted">
            {pick(
              lang,
              "레시피 도구가 붙었습니다 — 스파게티/파스타를 물어보세요.",
              "Recipe tool attached — ask about spaghetti/pasta."
            )}
          </span>
        )}
      </div>
      <div ref={logRef} className="chat-log">
        {messages.length === 0 && (
          <p className="muted">{pick(lang, "메시지를 입력해 대화를 시작하세요.", "Type a message to start the chat.")}</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="who">{m.role === "user" ? pick(lang, "나", "You") : "AI"}</div>
            <div className="bubble">
              {m.content ||
                (busy && i === messages.length - 1 ? pick(lang, "생각 중…", "Thinking…") : "")}
            </div>
          </div>
        ))}
      </div>
      {error && <p className="err">{error}</p>}
      <form onSubmit={send} style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={pick(lang, "질문을 입력하세요", "Type your question")}
          disabled={busy}
          autoFocus
        />
        <button type="submit" disabled={busy}>
          {busy ? pick(lang, "응답 중…", "Responding…") : pick(lang, "보내기", "Send")}
        </button>
      </form>
    </section>
  );
}
