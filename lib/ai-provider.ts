import Anthropic from "@anthropic-ai/sdk";
import { notifyAiLimit } from "./visitor-notify";

// LLM 제공자 — 키 하나, 엔드포인트 하나, 모델 하나. 소비자 둘이 같은 것을 읽는다.
//
// **왜 하나로 두나** (jay, 2026-08-12 의 "키는 AI_API_KEY 하나로 통일" 을 이어받아
// 2026-08-28 에 엔드포인트와 모델까지 같은 이름 아래로). 소비자는 Jay Chat 과
// 에이전트 추정(R-D) 둘이고, 둘 다 OpenAI 호환 `chat/completions` 를 부른다.
// 키만 공유하고 엔드포인트를 각자 박아 두면 `AI_API_ENDPOINT` 가 **절반만 참인
// 이름**이 된다 — 바꿨는데 한쪽만 따라오는 설정이야말로 오늘 하루 종일 쫓아다닌
// 실패 형태다.
//
// **셋은 언제나 함께 움직인다.** 엔드포인트만 바꾸고 키를 두면 401 이 난다:
// DashScope 키를 OpenAI 는 모르고, 반대도 같다.
//
// 비워 두면 DashScope(Model Studio, 국제판) + qwen-flash — 지금까지의 동작 그대로다.
const DEFAULT_ENDPOINT = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";
const DEFAULT_MODEL = "qwen-flash";

export type AiProvider = {
  endpoint: string;
  model: string;
  key: string | undefined;
  /// 에러 메시지가 **실제로 부른 곳**을 말하게 하려고 뽑아 둔다. "DashScope 키가
  /// 아니다"를 하드코딩하면 OpenAI 로 바꾼 순간 그 문장이 거짓이 된다.
  host: string;
};

export function aiProvider(): AiProvider {
  const endpoint = process.env.AI_API_ENDPOINT || DEFAULT_ENDPOINT;
  let host = endpoint;
  try {
    host = new URL(endpoint).host;
  } catch {
    // 형식이 깨진 값이면 URL 을 그대로 보여준다 — 그 자체가 진단이다.
  }
  return {
    endpoint,
    model: process.env.AI_API_MODEL || DEFAULT_MODEL,
    key: process.env.AI_API_KEY,
    host,
  };
}

/// 응답이 "한도"인지 가른다. 제공자마다 문구가 달라 **상태 코드 하나로는 안 된다**:
/// OpenAI 는 소진도 스로틀도 429 로 오고 `code` 로만 갈린다. DashScope 는 연체를
/// `Arrearage`/`AllocationQuota` 로 부른다. 그래서 코드와 본문을 함께 본다.
///
/// null 이면 한도가 아니다 — 401(키 문제)이나 500(제공자 장애)은 여기서 걸러진다.
/// 그 둘까지 텔레그램으로 보내면 알림이 소음이 되고, 정작 돈을 넣어야 하는
/// 한 건이 묻힌다.
export function classifyLimit(status: number, body: string): "quota" | "rate" | null {
  const b = body.toLowerCase();
  const quotaWords = ["insufficient_quota", "exceeded your current quota", "billing", "arrearage", "allocationquota"];
  if (status === 402 || quotaWords.some((w) => b.includes(w))) return "quota";
  if (status === 429) return "rate";
  return null;
}

/// 실패 응답 하나를 보고, 한도라면 텔레그램으로 알린다. 던지지 않는다 —
/// 호출부는 원래의 에러를 그대로 던져야 하고, 알림 실패가 그것을 가리면 안 된다.
///
/// 프라미스를 돌려주지만 거부(reject)하지 않는다. 방문자 경로는 기다리지 않고,
/// 한도 점검 프로브(/api/jay-chat/health)는 텔레그램 전송이 끝날 때까지 기다린다.
export async function reportIfLimited(llm: AiProvider, status: number, body: string): Promise<void> {
  const kind = classifyLimit(status, body);
  if (!kind) return;
  try {
    await notifyAiLimit({ kind, host: llm.host, model: llm.model, status, detail: body });
  } catch (e) {
    console.error("ai-provider: limit notify failed", e);
  }
}

// ── Claude (T1, jay 2026-10-28) ───────────────────────────────────────
// `AI_PROVIDER=anthropic` 이면 세 소비자(Jay Chat · 헬스 프로브 · 에이전트 추정)가
// 위의 OpenAI 호환 경로 대신 Anthropic Messages API(@anthropic-ai/sdk)를 쓴다.
// **OpenAI 경로를 지우지 않는 이유:** jay 의 API 크레딧은 2026-11-05(UTC)에 만료되는
// $200 프로모션뿐이고 카드가 없다. 만료되면 env 하나(`AI_PROVIDER=openai`)로 코드 배포
// 없이 되돌아가야 한다 (docs/tasks/current-plan.md §1.4 0단계).
// 키는 `ANTHROPIC_API_KEY` — SDK 가 스스로 읽는다. OpenAI 키(`AI_API_KEY`)와 이름을
// 나누는 것도 같은 이유다: 전환 기간엔 두 키가 함께 살아 있어야 한다.
export type ProviderKind = "anthropic" | "openai";

export function providerKind(): ProviderKind {
  return process.env.AI_PROVIDER === "anthropic" ? "anthropic" : "openai";
}

/// D1 결정 (jay, 2026-10-28): 기본값은 **Haiku 5.5**. 같은 날 Opus → Haiku → Sonnet → Haiku 로
/// 오간 끝에 정했다. 질문당 ~$0.001 (Sonnet ~$0.014, Opus ~$0.03), 답이 ~1–4초로 가장 빠르고,
/// 이력 기반 페르소나 답변에는 충분하다(세 모델 모두 스모크 테스트 통과).
/// 바꾸려면 `AI_MODEL=claude-sonnet-5-5` 또는 `claude-opus-5-5` 한 줄이면 된다 —
/// 시간당 예산 기본값은 모델에 따라 자동으로 달라진다(jay-chat.ts defaultHourlyBudget).
export function claudeModel(): string {
  return process.env.AI_MODEL || "claude-haiku-5-5";
}

let claudeClient: Anthropic | null = null;
export function claude(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY가 설정되지 않았습니다.");
  return (claudeClient ??= new Anthropic());
}

/// 서버 측 거절 폴백 — 정책 거절이 나면 같은 호출 안에서 다른 모델이 이어 받는다.
/// Opus/Fable/Sonnet 5.5 에만 있다(Haiku 5.5 는 서버 측 폴백이 없다).
export function claudeFallbacks(model: string): { betas?: Anthropic.Beta.AnthropicBeta[]; fallbacks?: "default" } {
  return /^claude-(opus|fable|sonnet)-/.test(model)
    ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" }
    : {};
}

/// Claude 실패를 "quota / rate / 그 외"로 가른다. 문구 대신 **SDK 의 오류 타입과
/// 상태 코드**를 본다: 429 `RateLimitError` = 스로틀(기다리면 풀림), 402
/// `billing_error` = 크레딧 소진(돈을 넣어야 풀림). 크레딧 소진이 402 가 아니라
/// 400 "credit balance" 문구로 올 가능성도 있어 그 문구도 quota 로 본다 —
/// 처음 실제로 소진될 때 어느 쪽인지 확인할 것 (current-plan §1.3).
export function classifyClaudeError(e: unknown): { kind: "quota" | "rate" | null; status: number; detail: string } {
  if (e instanceof Anthropic.APIError) {
    const status = e.status ?? 0;
    const detail = e.message ?? "";
    if (status === 402 || /credit balance|billing/i.test(detail)) return { kind: "quota", status, detail };
    if (e instanceof Anthropic.RateLimitError) return { kind: "rate", status, detail };
    return { kind: null, status, detail };
  }
  return { kind: null, status: 0, detail: String(e instanceof Error ? e.message : e) };
}

/// 한도면 텔레그램으로 알린다. 던지지 않는다 — reportIfLimited 와 같은 약속.
export async function reportClaudeLimit(e: unknown): Promise<void> {
  const c = classifyClaudeError(e);
  if (!c.kind) return;
  try {
    await notifyAiLimit({ kind: c.kind, host: "api.anthropic.com", model: claudeModel(), status: c.status, detail: c.detail });
  } catch (err) {
    console.error("ai-provider: limit notify failed", err);
  }
}

/// 지금 실제로 도는 모델의 사람용 이름 — Jay Chat 안내 문구에 쓴다. 하드코딩했던
/// "Qwen Flash"는 운영이 gpt-4o-mini 로 바뀐 뒤에도 남아 거짓말을 하고 있었다
/// (jay, 2026-10-28). 이제 설정에서 나오므로 모델을 바꾸면 문구도 따라간다.
export function aiModelLabel(): string {
  if (providerKind() === "anthropic") {
    const [, family, ...ver] = claudeModel().split("-");
    return family ? `Claude ${family[0].toUpperCase()}${family.slice(1)} ${ver.join(".")}`.trim() : claudeModel();
  }
  const m = aiProvider().model;
  const known: Record<string, string> = { "gpt-4o-mini": "GPT-4o mini", "qwen-flash": "Qwen Flash" };
  return known[m] ?? m;
}

/// 헬스 체크·알림이 "어디를 불렀는지" 말할 때 쓴다.
export function activeModelInfo(): { host: string; model: string } {
  return providerKind() === "anthropic"
    ? { host: "api.anthropic.com", model: claudeModel() }
    : { host: aiProvider().host, model: aiProvider().model };
}
