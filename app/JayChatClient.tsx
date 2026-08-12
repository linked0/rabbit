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
  // 7개 → 29개로 확장 (jay, 2026-08-12) — 한 번에 보이는 건 여전히 3개지만, 물을 때마다
  // 새 질문이 채워지므로 풀이 클수록 대화가 오래 신선하다. 질문은 코퍼스(이력서·프로젝트
  // 문서)가 답할 수 있는 범위로 고른다 — 학력(대학·전공·학번)과 블록체인 세부 경력 포함
  // (jay 요청, resume-career.md 에 이미 있는 내용).
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
          "Verex는 어떤 프로젝트인가요?",
          "스마트 컨트랙트 경험을 알려주세요",
          "합의 알고리즘을 개발한 적이 있나요?",
          "DAO 관련 작업을 했나요?",
          "NFT 마켓플레이스 경험이 있나요?",
          "보안 관련 경험은 어떤가요?",
          "zkSync 같은 L2도 다뤄봤나요?",
          "모바일·임베디드 경력도 있나요?",
          "어떤 프로그래밍 언어를 쓰나요?",
          "팀을 리드해본 적이 있나요?",
          "요즘은 무엇을 만들고 있나요?",
          "AI 관련 작업도 하나요?",
          "사이드 프로젝트는 뭐가 있나요?",
          "가장 자랑스러운 프로젝트는 뭔가요?",
          "협업 스타일은 어떤가요?",
          "이 사이트는 어떻게 만들어졌나요?",
          "어느 대학교를 나왔나요?",
          "전공이 뭐였나요?",
          "학번이 어떻게 되나요?",
          "Bosagora 메인넷에서 무슨 일을 했나요?",
          "BC카드 블록체인 프로젝트는 뭐였나요?",
          "Nostra는 어떤 프로젝트인가요?",
        ]
      : [
          "Summarize his career.",
          "Tell me about the prediction market project.",
          "How do I contact him?",
          "What technologies does he use?",
          "What is his greatest strength?",
          "When did he start working in blockchain?",
          "Where does he work now?",
          "What is Verex?",
          "Tell me about his smart contract experience.",
          "Has he built consensus algorithms?",
          "Has he worked on DAOs?",
          "Has he built an NFT marketplace?",
          "What about security experience?",
          "Has he worked with L2s like zkSync?",
          "Does he have mobile or embedded experience?",
          "What programming languages does he use?",
          "Has he led teams?",
          "What is he building these days?",
          "Does he also work with AI?",
          "What are his side projects?",
          "Which project is he most proud of?",
          "What is his working style like?",
          "How was this site built?",
          "Which university did he attend?",
          "What was his major?",
          "What year did he enter university?",
          "What did he do on the Bosagora mainnet?",
          "What was the BC Card blockchain project?",
          "What is Nostra?",
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
          "이현재에 대해 물어보세요 — Qwen Flash + 이력 기반 RAG. 대화는 저장되지 않습니다.",
          "Ask anything about Hyunjae Lee — Qwen Flash + RAG over his résumé. Nothing is stored."
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
