// Jay Chat — public, keyless "About Jay" persona chat (docs/features/ai-chat.md).
// 사이트의 유일한 챗 (2026-08-12): 오너 전용 일반 챗(/chat + lib/ai.ts)은 안 쓰여서 삭제됨.
// Always-on About-me persona (never general-purpose) + its own cost/abuse guardrails,
// since this endpoint is reachable by anyone with no login.

import type Anthropic from "@anthropic-ai/sdk";
import {
  aiProvider,
  classifyLimit,
  reportIfLimited,
  providerKind,
  claude,
  claudeModel,
  claudeFallbacks,
  classifyClaudeError,
  reportClaudeLimit,
} from "./ai-provider";

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
// 같은 450k 로 두면 악용 시 최악이 Opus ~$2,100/월, Sonnet ~$1,050/월이다. 그래서 모델별로
// 최악을 ~$280/월에 맞춘 기본값을 둔다: Opus/Fable 60k, Sonnet 120k, Haiku·OpenAI 450k.
// env 가 있으면 env 가 이긴다 (jay, 2026-10-28; current-plan §1.2).
function defaultHourlyBudget(): number {
  if (providerKind() !== "anthropic") return 450000;
  const m = claudeModel();
  if (/^claude-(opus|fable)-/.test(m)) return 60000;
  if (/^claude-sonnet-/.test(m)) return 120000;
  return 450000;
}
// `||`, not `??`: deploy.sh passes the var empty when .env has no value, and
// Number("") is 0 — which would refuse every chat as over budget.
const HOURLY_TOKEN_BUDGET = Number(
  process.env.JAY_CHAT_HOURLY_TOKEN_BUDGET ||
    defaultHourlyBudget(),
);
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
  if (providerKind() === "anthropic") return streamClaude(messages);
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

// --- 한도 점검 프로브 (jay, 2026-10-09) ---
// 위 스트림 경로의 reportIfLimited 는 **방문자가 이미 실패한 뒤에야** 울린다. 아무도
// 채팅하지 않는 동안 크레딧이 떨어지면, 첫 방문자가 깨진 채팅을 보는 순간까지 아무도
// 모른다. 그래서 Cloud Scheduler 가 매시간 이 함수를 불러 같은 키·엔드포인트·모델로
// 1토큰짜리 요청을 보낸다 — 한 번에 ~15토큰, 하루 ~360토큰이라 비용은 사실상 0이다.
// 한도(소진·스로틀)면 방문자 경로와 **같은** 텔레그램 알림이 나간다.
export type ProbeResult =
  | { ok: true; model: string; host: string; tokens: number }
  | { ok: false; model: string; host: string; status: number; limit: "quota" | "rate" | null; detail: string };

export async function probeJayChat(): Promise<ProbeResult> {
  if (providerKind() === "anthropic") return probeClaude();
  const llm = aiProvider();
  if (!llm.key) {
    return { ok: false, model: llm.model, host: llm.host, status: 0, limit: null, detail: "AI_API_KEY 없음" };
  }
  const res = await fetch(llm.endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${llm.key}` },
    body: JSON.stringify({
      model: llm.model,
      messages: [{ role: "user", content: "ping" }],
      max_tokens: 1,
    }),
  });
  const body = await res.text().catch(() => "");
  if (!res.ok) {
    await reportIfLimited(llm, res.status, body);
    return {
      ok: false,
      model: llm.model,
      host: llm.host,
      status: res.status,
      limit: classifyLimit(res.status, body),
      detail: body.slice(0, 300),
    };
  }
  let tokens = 0;
  try {
    tokens = JSON.parse(body)?.usage?.total_tokens ?? 0;
  } catch {
    // 200 인데 JSON 이 아니면 토큰 수만 모른다 — 프로브는 성공이다.
  }
  if (tokens) recordTokenUsage(tokens);
  return { ok: true, model: llm.model, host: llm.host, tokens };
}

// --- Claude 경로 (T1, 2026-10-28) ---
// 라우트와 JayChatClient 가 기대하는 계약은 그대로다: 평문 텍스트 스트림.

// Opus 5.5 는 생각(thinking)을 끌 수 없고, 생각 토큰도 max_tokens 안에서 쓴다.
// 1,500 은 생각 + 답에 빠듯해서 Claude 경로만 넉넉히 둔다 — 비용 상한은 어차피
// 시간당 예산이 잡는다.
const CLAUDE_MAX_TOKENS = 4000;

/// 시스템 프롬프트를 [고정 페르소나 | 질문마다 바뀌는 RAG 컨텍스트]로 자른다.
/// 앞쪽만 cache_control 을 달아 두 번째 질문부터 캐시에서 읽게 한다.
function claudeSystem(messages: ChatMessage[]): Anthropic.TextBlockParam[] {
  const sys = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const cut = sys.indexOf("[Context about");
  if (cut <= 0) return [{ type: "text", text: sys }];
  return [
    { type: "text", text: sys.slice(0, cut), cache_control: { type: "ephemeral" } },
    { type: "text", text: sys.slice(cut) },
  ];
}

/// Claude 는 첫 메시지가 user 여야 한다. 라우트가 히스토리 꼬리(6개)만 보내서
/// assistant 로 시작할 수 있으므로, 앞쪽의 assistant 를 떼어 낸다.
function claudeTurns(messages: ChatMessage[]): Anthropic.MessageParam[] {
  const turns = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));
  while (turns.length && turns[0].role !== "user") turns.shift();
  return turns;
}

async function streamClaude(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
  const model = claudeModel();
  let events: AsyncIterable<Anthropic.Beta.BetaRawMessageStreamEvent>;
  try {
    // `stream: true` 로 부르면 HTTP 오류가 여기서(스트림 시작 전에) 던져진다 — 그래야
    // 라우트가 502 를 돌려줄 수 있다. 스트림 도중에 터지면 방문자는 빈 말풍선만 본다.
    events = await claude().beta.messages.create({
      model,
      max_tokens: CLAUDE_MAX_TOKENS,
      system: claudeSystem(messages),
      messages: claudeTurns(messages),
      output_config: { effort: "low" },
      stream: true,
      ...claudeFallbacks(model),
    });
  } catch (e) {
    await reportClaudeLimit(e);
    const c = classifyClaudeError(e);
    throw new Error(`${model} 오류: HTTP ${c.status} (api.anthropic.com)`);
  }

  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      let tokens = 0;
      try {
        for await (const ev of events) {
          if (ev.type === "content_block_delta" && ev.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(ev.delta.text));
          } else if (ev.type === "message_start") {
            const u = ev.message.usage;
            tokens += (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0);
          } else if (ev.type === "message_delta") {
            tokens += ev.usage.output_tokens ?? 0;
            if (ev.delta.stop_reason === "refusal") {
              controller.enqueue(encoder.encode("\n\n(이 질문에는 답할 수 없습니다. / I can't answer that one.)"));
            }
          }
        }
      } catch (e) {
        await reportClaudeLimit(e);
        console.error("jay-chat: claude stream failed", e);
      } finally {
        if (tokens) recordTokenUsage(tokens);
        controller.close();
      }
    },
  });
}

async function probeClaude(): Promise<ProbeResult> {
  const model = claudeModel();
  try {
    const r = await claude().beta.messages.create({
      model,
      max_tokens: 16,
      messages: [{ role: "user", content: "ping" }],
      output_config: { effort: "low" },
      ...claudeFallbacks(model),
    });
    const tokens = (r.usage.input_tokens ?? 0) + (r.usage.output_tokens ?? 0);
    if (tokens) recordTokenUsage(tokens);
    return { ok: true, model, host: "api.anthropic.com", tokens };
  } catch (e) {
    await reportClaudeLimit(e);
    const c = classifyClaudeError(e);
    return { ok: false, model, host: "api.anthropic.com", status: c.status, limit: c.kind, detail: c.detail.slice(0, 300) };
  }
}
