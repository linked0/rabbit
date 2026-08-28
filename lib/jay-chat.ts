// Jay Chat — public, keyless "About Jay" persona chat (docs/features/ai-chat.md).
// 사이트의 유일한 챗 (2026-08-12): 오너 전용 일반 챗(/chat + lib/ai.ts)은 안 쓰여서 삭제됨.
// Always-on About-me persona (never general-purpose) + its own cost/abuse guardrails,
// since this endpoint is reachable by anyone with no login.

import { aiProvider, reportIfLimited } from "./ai-provider";

export type ChatMessage = {
  role: "user" | "assistant" | "system";
  content: string;
};

// Qwen Flash via DashScope's OpenAI-compatible endpoint (2026-08-12, was gpt-4o-mini).
// Same wire format as OpenAI, ~45% cheaper per typical turn ($0.05/$0.40 vs $0.15/$0.60
// per 1M in/out) — which is what pays for the 3× budget raise below. International
// endpoint (Singapore); the mainland variant is dashscope.aliyuncs.com.
// 모델·엔드포인트·키는 `lib/ai-provider.ts` 한 곳에서 온다 (2026-08-28). 기본값은
// 여기 있던 값 그대로라 설정이 비면 동작이 바뀌지 않는다.
// 500 → 1000 → 1500 (jay, 2026-08-12): 한국어는 1–1.5자당 1토큰이라 경력 요약 같은 목록형
// 답변이 500에서 단어 중간에 잘렸다. Qwen Flash 출력 단가($0.40/M)에선 1500토큰이 $0.0006 —
// 비용 방어는 어차피 시간당 예산이 하고, 이 값은 요청 하나의 상한만 잡으면 된다.
const MAX_OUTPUT_TOKENS = 1500;

// --- Hourly global token budget ---
// In-memory, resets every hour, shared across all visitors (not per-visitor — a
// deliberate v1 simplification since real traffic is rare right now; see
// docs/features/ai-chat.md for the tradeoff). This is a soft safety net, not the
// hard guarantee — the real backstop is the provider-side spending limit
// (set in the Alibaba Cloud Model Studio console for the dedicated key below).
// 450k/hour ≈ 190+ questions with the history trimming in the route (~2.3k tokens each).
// Raised 3× from 150k on the Qwen switch (2026-08-12): the cheaper per-token price keeps
// the absolute worst-case monthly ceiling near what 150k cost on gpt-4o-mini (~$40 vs ~$27).
// History: the original 30k died at ~question 11 — the client resends the whole conversation
// every turn, so cost grew quadratically; question 20 cost 8× question 1 (measured, 2026-08-02).
const HOURLY_TOKEN_BUDGET = Number(process.env.JAY_CHAT_HOURLY_TOKEN_BUDGET ?? 450000);
let windowStart = Date.now();
let tokensUsedThisHour = 0;

function currentHourWindow() {
  const now = Date.now();
  if (now - windowStart >= 60 * 60 * 1000) {
    windowStart = now;
    tokensUsedThisHour = 0;
  }
  return { tokensUsedThisHour, remaining: HOURLY_TOKEN_BUDGET - tokensUsedThisHour };
}

export function budgetExhausted(): boolean {
  return currentHourWindow().remaining <= 0;
}

function recordTokenUsage(tokens: number) {
  currentHourWindow(); // roll the window first if needed
  tokensUsedThisHour += tokens;
}

// --- Per-IP burst guard ---
// Not a cost control (the token budget above already bounds cost regardless of
// request speed) — this is purely to stop one script hammering the server with
// simultaneous requests. Generous enough that a real human typing never hits it.
const BURST_LIMIT_PER_MINUTE = 15;
const burstMap = new Map<string, { windowStart: number; count: number }>();

export function burstLimited(ip: string): boolean {
  const now = Date.now();
  const entry = burstMap.get(ip);
  if (!entry || now - entry.windowStart >= 60 * 1000) {
    burstMap.set(ip, { windowStart: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > BURST_LIMIT_PER_MINUTE;
}

// --- Qwen call (streaming, with usage capture) ---
// 키는 AI_API_KEY 하나로 통일 (jay, 2026-08-12) — 원래는 공개 엔드포인트 전용 키를 따로
// 뒀지만(남용 시 단독 폐기), 유일하게 남은 다른 소비자였던 오너 전용 챗을 삭제하면서
// 격리로 얻는 게 없어졌다. 이제 이 키를 쓰는 곳은 Jay Chat 뿐이라 폐기해도 다른 기능이
// 죽지 않는다. 값은 DashScope(Model Studio) API 키.
export async function streamJayChat(
  messages: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
  const llm = aiProvider();
  if (!llm.key) throw new Error("AI_API_KEY가 설정되지 않았습니다.");

  const res = await fetch(llm.endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${llm.key}`,
    },
    body: JSON.stringify({
      model: llm.model,
      messages,
      max_tokens: MAX_OUTPUT_TOKENS,
      stream: true,
      stream_options: { include_usage: true },
    }),
  });
  if (!res.ok || !res.body) {
    // 실패 본문을 **읽고** 나서 던진다 (2026-08-28). 상태 코드만으로는 소진과
    // 스로틀이 구별되지 않는다 — OpenAI 는 둘 다 429 로 보내고 `code` 로만 갈린다.
    // 공개 엔드포인트라 이 실패는 방문자에게 그대로 보이므로, 원인이 크레딧이면
    // jay 가 로그를 뒤지기 전에 알아야 한다.
    const detail = res.body ? await res.text().catch(() => "") : "";
    reportIfLimited(llm, res.status, detail);
    throw new Error(`${llm.model} 오류: HTTP ${res.status} (${llm.host})`);
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buf = "";

  return res.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buf += decoder.decode(chunk, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") continue;
          try {
            const evt = JSON.parse(payload);
            const text = evt?.choices?.[0]?.delta?.content ?? "";
            if (text) controller.enqueue(encoder.encode(text));
            // Final usage chunk (choices is [] there) — record actual cost.
            if (evt?.usage?.total_tokens) recordTokenUsage(evt.usage.total_tokens);
          } catch {
            // keep-alive / partial line — ignore
          }
        }
      },
    })
  );
}
