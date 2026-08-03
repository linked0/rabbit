"use client";

import { useRef, useState } from "react";
import { useLang } from "./LangContext";
import { pick } from "@/lib/i18n";

type Msg = { role: "user" | "assistant"; content: string };

export default function JayChatClient() {
  const { lang } = useLang();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [asked, setAsked] = useState<string[]>([]); // prompts already used, hidden from the list
  const logRef = useRef<HTMLDivElement>(null);

  // 예시 질문 버튼은 입력창을 채우는 대신 곧바로 전송한다 (2026-08-01, jay) —
  // 그래서 전송할 문장을 인자로 받는다. 폼 제출은 입력창 값을 넘긴다.
  async function send(raw: string) {
    const text = raw.trim();
    if (!text || busy) return;
    setAsked((prev) => (prev.includes(text) ? prev : [...prev, text]));

    setError(null);
    setInput("");
    const history = [...messages, { role: "user" as const, content: text }];
    setMessages([...history, { role: "assistant", content: "" }]);
    setBusy(true);

    try {
      const res = await fetch("/api/jay-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setMessages((cur) => {
          const next = [...cur];
          const last = next[next.length - 1];
          next[next.length - 1] = { role: "assistant", content: last.content + chunk };
          return next;
        });
        logRef.current?.scrollTo(0, logRef.current.scrollHeight);
      }
    } catch (e) {
      setError(String(e));
      setMessages(history);
    } finally {
      setBusy(false);
    }
  }

  // A pool rather than a fixed trio: once a question has been asked it drops out and the next
  // one from the pool takes its place, so the suggestions stay useful for the whole
  // conversation instead of going stale (2026-08-03, jay).
  const PROMPT_POOL =
    lang === "ko"
      ? [
          "주요 경력을 요약해주세요",
          "예측 시장 프로젝트가 뭐죠?",
          "어떻게 연락하나요?",
          "어떤 기술을 주로 쓰나요?",
          "가장 큰 강점은 뭔가요?",
          "블록체인은 언제부터 했나요?",
          "지금은 어디서 일하나요?",
        ]
      : [
          "Summarize his career.",
          "Tell me about the prediction market project.",
          "How do I contact him?",
          "What technologies does he use?",
          "What is his greatest strength?",
          "When did he start working in blockchain?",
          "Where does he work now?",
        ];
  const VISIBLE_PROMPTS = 3;
  const examplePrompts = PROMPT_POOL.filter((p) => !asked.includes(p)).slice(0, VISIBLE_PROMPTS);

  return (
    <section className="panel">
      <p className="muted" style={{ marginBottom: 12 }}>
        {/* 실제로 쓰는 모델만 적는다 — 현재 Jay Chat 은 OpenAI 만 호출한다(lib/jay-chat.ts).
            로컬 LLM 은 아직 연결돼 있지 않으므로 붙이지 않는다 (2026-08-01, jay와 확인). */}
        {pick(
          lang,
          "이현재에 대해 물어보세요 — ChatGPT(gpt-4o-mini) + 이력 기반 RAG. 대화는 저장되지 않습니다.",
          "Ask anything about Hyunjae Lee — ChatGPT (gpt-4o-mini) + RAG over his résumé. Nothing is stored."
        )}
      </p>
      {examplePrompts.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {examplePrompts.map((p) => (
            <button key={p} type="button" className="ghost" disabled={busy} onClick={() => void send(p)}>
              {p}
            </button>
          ))}
        </div>
      )}
      <div ref={logRef} className="chat-log">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role}`}>
            <div className="who">{m.role === "user" ? pick(lang, "나", "You") : "Jay Chat"}</div>
            <div className="bubble">
              {m.content ||
                (busy && i === messages.length - 1 ? pick(lang, "생각 중…", "Thinking…") : "")}
            </div>
          </div>
        ))}
      </div>
      {error && <p className="err">{error}</p>}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void send(input);
        }}
        style={{ display: "flex", gap: 8, marginTop: 12 }}
      >
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
