import { prisma } from "./db";

// J2 / R-D — LLM 확률 추정.
//
// **왜 LLM 인가.** 계획서의 fork #3: LLM 이 확률을 추정하고 **결정론적 규칙이
// 실행한다.** LLM 은 여기서 똑똑하려고 있는 게 아니라 **판단을 읽히게** 하려고
// 있다 — skip 행이 "edge 0.02 < 0.05"만 적혀 있으면 규칙이 보이지만,
// 근거 한 줄이 붙으면 *판단*이 보인다.
//
// **왜 뉴스인가.** 질문만 읽으면 LLM 의 `p` 는 학습 컷오프에 얼어붙은 사전확률이고,
// 그 이후 모든 것을 흡수한 라이브 호가와 경쟁한다 — 정의상 시장이 이긴다.
// 증거가 들어가야 `p` 가 아직 가격에 반영되지 않은 정보에 대한 지분을 갖는다.
//
// **그어둔 선.** 저장소에 들어가는 것은 **헤드라인(증거)**이지 **입장(조종)**이
// 아니다. "강세로 봐"를 넣을 수 있으면 에이전트는 스스로 견해를 형성하는 게
// 아니라 시킨 대로 하는 것이고, 화면에서는 둘을 구별할 수 없다.

const MODEL = "qwen-flash";
const ENDPOINT = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";

export type Estimate = {
  /// 0..1 확률
  p: number;
  rationale: string;
  /// 이 추정이 실제로 읽은 NewsItem id 들. 저널 행이 이걸 그대로 싣는다.
  citedNewsIds: string[];
};

const SYSTEM = [
  "You estimate the probability that a prediction-market question resolves YES.",
  "You are given the question, its resolution criteria, and zero or more news items.",
  "Return STRICT JSON only: {\"p\": <number 0..1>, \"rationale\": \"<one sentence>\"}.",
  "The rationale must say what moved you, and must name a source when one applies.",
  "If the news says nothing relevant, say so and stay near your prior — do not invent a reason.",
].join(" ");

/// 뉴스가 없으면 LLM 을 부르지 않는다. 부를 수는 있지만, 그때의 `p` 는 순수한
/// 사전확률이라 호가보다 나을 근거가 없다 — 돈을 내고 낡은 값을 사는 셈이다.
/// 그래서 "추정 없음"을 1급 판정으로 만들고(SKIP_NO_ESTIMATE) 이유를 남긴다.
export async function estimate(args: {
  marketSlug: string;
  question: string;
  resolutionCriteria?: string | null;
  /// 발행 기준 최근 N시간 이내만 본다 — O7 의 임시 답. 3주 전 헤드라인이 영원히
  /// p 를 움직여선 안 된다.
  withinHours?: number;
}): Promise<Estimate | null> {
  const key = process.env.AI_API_KEY;
  if (!key) throw new Error("AI_API_KEY is not set — the estimate step needs it");

  const since = args.withinHours
    ? new Date(Date.now() - args.withinHours * 3_600_000)
    : undefined;
  const news = await prisma.newsItem.findMany({
    where: { marketSlug: args.marketSlug, ...(since ? { publishedAt: { gte: since } } : {}) },
    orderBy: { publishedAt: "desc" },
    take: 20,
  });
  if (news.length === 0) return null;

  const evidence = news
    .map((n, i) => `[${i + 1}] ${n.publishedAt.toISOString()} ${n.source ?? "unknown"}: ${n.headline}${n.body ? ` — ${n.body}` : ""}`)
    .join("\n");

  const user = [
    `Question: ${args.question}`,
    args.resolutionCriteria ? `Resolution criteria: ${args.resolutionCriteria}` : "",
    "",
    "News:",
    evidence,
  ]
    .filter(Boolean)
    .join("\n");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 300,
      temperature: 0,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: user },
      ],
    }),
  });
  if (!res.ok) throw new Error(`estimate: model returned ${res.status}`);
  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = json.choices?.[0]?.message?.content ?? "";

  // 모델이 JSON 을 코드펜스로 감싸는 일이 흔하다. 실패는 삼키지 않고 던진다 —
  // 파싱 실패를 조용히 "추정 없음"으로 바꾸면 저널이 거짓말한다.
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) throw new Error(`estimate: model did not return JSON — ${text.slice(0, 120)}`);
  const parsed = JSON.parse(match[0]) as { p?: number; rationale?: string };
  if (typeof parsed.p !== "number" || !Number.isFinite(parsed.p) || parsed.p < 0 || parsed.p > 1) {
    throw new Error(`estimate: p is not a probability — ${JSON.stringify(parsed.p)}`);
  }

  return {
    p: parsed.p,
    rationale: (parsed.rationale ?? "").trim() || "(no rationale returned)",
    citedNewsIds: news.map((n) => n.id),
  };
}
