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
export function reportIfLimited(llm: AiProvider, status: number, body: string) {
  const kind = classifyLimit(status, body);
  if (!kind) return;
  try {
    notifyAiLimit({ kind, host: llm.host, model: llm.model, status, detail: body });
  } catch (e) {
    console.error("ai-provider: limit notify failed", e);
  }
}
