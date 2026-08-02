// Jay Chat — public, keyless "About Jay" persona chat (docs/features/ai-chat.md).
// Separate from the private lib/ai.ts general chat: dedicated API key, always-on
// About-me persona (never general-purpose), and its own cost/abuse guardrails,
// since this endpoint is reachable by anyone with no login.

import type { ChatMessage } from "@/lib/ai";

const OPENAI_MODEL = "gpt-4o-mini";
const MAX_OUTPUT_TOKENS = 500; // caps cost per request even under abuse

// --- Hourly global token budget ---
// In-memory, resets every hour, shared across all visitors (not per-visitor — a
// deliberate v1 simplification since real traffic is rare right now; see
// docs/features/ai-chat.md for the tradeoff). This is a soft safety net, not the
// hard guarantee — the real backstop is the OpenAI account-level spending cap
// (set separately in the OpenAI dashboard for the dedicated key below).
// 150k/hour ≈ 60+ questions with the history trimming in the route (~2.3k tokens each).
// The old 30k died at ~question 11: the client resends the whole conversation every turn, so
// cost grew quadratically — question 20 cost 8× question 1 (measured, 2026-08-02).
const HOURLY_TOKEN_BUDGET = Number(process.env.JAY_CHAT_HOURLY_TOKEN_BUDGET ?? 150000);
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

// --- Dedicated OpenAI call (streaming, with usage capture) ---
// Separate API key from the private chat's AI_API_KEY, on purpose (see security
// discussion in docs/history) — if this key is ever abused, it can be revoked on
// its own without touching the owner's private chat.
export async function streamJayChat(
  messages: ChatMessage[]
): Promise<ReadableStream<Uint8Array>> {
  const key = process.env.JAY_CHAT_OPENAI_API_KEY;
  if (!key) throw new Error("JAY_CHAT_OPENAI_API_KEY가 설정되지 않았습니다.");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      max_tokens: MAX_OUTPUT_TOKENS,
      stream: true,
      stream_options: { include_usage: true },
    }),
  });
  if (!res.ok || !res.body) throw new Error(`OpenAI 오류: HTTP ${res.status}`);

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
