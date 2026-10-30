import { buildAboutMeSystemMessage } from "@/lib/about-me";
import {
  streamJayChat, acquire, burstLimited, estimateInputTokens, maxOutputTokens,
  anonSpentThisHour, noteAnonSpend, Overloaded, OverBudget, type ChatMessage, type Lease,
} from "@/lib/jay-chat";
import { admit, rollHour } from "@/lib/jay-chat-gate";
import { TICKET_COOKIE, verifyTicket, ticketsConfigured } from "@/lib/jay-chat-ticket";
import { worstCaseCost } from "@/lib/ai-provider";
import { auth } from "@/auth";
import { notifyChatStart, notifyChatMilestone } from "@/lib/visitor-notify";

// Public, keyless "About Jay" persona endpoint — no login required (see middleware.ts
// PUBLIC_PATHS). Always answers as the About-Jay persona; never general-purpose chat,
// so a visitor can't repurpose this into a free ChatGPT proxy.
export const dynamic = "force-dynamic";

// Each question adds 2 entries (question + answer), so N questions ⇒ 2N-1 messages. The old
// cap of 20 rejected the 11th question outright with a 400 — a hard wall dressed up as a
// validation error. Cost is bounded by HISTORY_TURNS below (only the tail is sent upstream),
// not by this, so this can be generous: 150 ⇒ ~75 questions.
const MAX_MESSAGES = 150;
// 2000자 제한은 **user 메시지에만** 건다 (2026-08-12). 원래는 모든 메시지에 걸었는데,
// 출력 상한을 1500토큰으로 올리자 어시스턴트 답변이 한국어 기준 2000자를 넘기 시작했고
// — 클라이언트가 매 턴 전체 히스토리를 재전송하므로 — 긴 답변 하나가 나오면 그 다음
// 질문부터 전부 400으로 거부되는 자충수가 됐다 (jay 스크린샷으로 발견).
const MAX_MESSAGE_CHARS = 2000; // caps a single USER message's size
// 어시스턴트 히스토리는 거부 대신 잘라서 통과 — 정상 답변은 이 안에 다 들어오고
// (1500토큰 ≈ 한국어 ~2000-3000자), 조작된 초대형 페이로드만 비용 없이 무력화된다.
const MAX_ASSISTANT_CHARS = 8000;
// 업스트림으로 나가는 **꼬리 전체**의 상한 (T1 §1.8, 2026-10-30). 지금까지 상한은 메시지
// 하나씩에만 있어서(user 2,000자 · assistant 8,000자), 꼬리 6개를 꽉 채우면 한 요청이
// 48,000자 ≈ 20k 토큰까지 갔다. 요청 하나의 최악 비용을 눌러야 예약(acquire)도 정확해진다.
const MAX_TOTAL_CHARS = 12000;

// X-Forwarded-For 는 프록시가 **뒤에 덧붙인다**. 그래서 맨 앞 값은 호출자가 마음대로 쓸 수
// 있고, 맨 뒤 값만 우리 앞단이 쓴 값이다. 예전엔 [0] 을 키로 써서, 매 요청 가짜 IP 를 넣는
// 스크립트는 분당 제한에 **한 번도** 걸리지 않았다 (T1 §1.8).
// 앞에 로드밸런서를 두게 되면 신뢰 홉이 하나 늘어난다 — 그때 TRUSTED_PROXY_HOPS=1.
// 다른 사이트가 방문자의 브라우저로 이 API 를 부르지 못하게 한다 (§1.9 item 2).
// Origin 이 아예 없는 요청(서버 간 호출, curl)은 막지 않는다 — 쿠키 검사가 그쪽을 맡는다.
function foreignOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return false;
  const host = req.headers.get("host");
  try {
    return new URL(origin).host !== host;
  } catch {
    return true;
  }
}

const TRUSTED_PROXY_HOPS = Number(process.env.TRUSTED_PROXY_HOPS || 0);
let loggedHops = false;

function clientIp(req: Request): string {
  const parts = (req.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
  if (!loggedHops) {
    // 배포 뒤 한 번만, **IP 는 빼고** 홉 개수만 남긴다 — 신뢰 홉 설정이 맞는지 확인용.
    loggedHops = true;
    console.log(`jay-chat: x-forwarded-for hops=${parts.length} trusted=${TRUSTED_PROXY_HOPS}`);
  }
  if (!parts.length) return "unknown";
  return parts[Math.max(0, parts.length - 1 - TRUSTED_PROXY_HOPS)] || "unknown";
}

export async function POST(req: Request) {
  const ip = clientIp(req);
  if (foreignOrigin(req)) {
    return Response.json({ error: "요청 출처가 올바르지 않습니다." }, { status: 403 });
  }
  if (burstLimited(ip)) {
    return Response.json({ error: "너무 빠릅니다 — 잠시 후 다시 시도해주세요." }, { status: 429 });
  }

  // 검증 실패는 원인별로 다른 메시지를 준다 — 예전엔 전부 "messages 배열이 필요합니다"로
  // 뭉뚱그려서, 길이 위반이 구조 오류로 위장해 디버깅을 막았다 (2026-08-12).
  let messages: ChatMessage[];
  try {
    const body = await req.json();
    messages = body?.messages;
  } catch {
    messages = undefined as never;
  }
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({ error: "messages 배열이 필요합니다." }, { status: 400 });
  }
  if (messages.length > MAX_MESSAGES) {
    return Response.json(
      { error: "대화가 너무 길어졌습니다 — 새로고침 후 새로 시작해주세요." },
      { status: 400 }
    );
  }
  for (const m of messages) {
    // system 역할은 거부 — outgoing 이 [페르소나 system, ...히스토리] 구조라, 클라이언트가
    // system 메시지를 끼워 넣으면 페르소나 지시를 덮어쓰는 프롬프트 주입 통로가 된다.
    if (typeof m?.content !== "string" || (m.role !== "user" && m.role !== "assistant")) {
      return Response.json({ error: "messages 형식이 올바르지 않습니다." }, { status: 400 });
    }
    if (m.role === "user" && m.content.length > MAX_MESSAGE_CHARS) {
      return Response.json(
        { error: `질문이 너무 깁니다 — 최대 ${MAX_MESSAGE_CHARS}자입니다.` },
        { status: 400 }
      );
    }
  }

  if (messages.length === 1) notifyChatStart(ip); // first message of a new conversation

  // Deep-engagement ping (jay, 2026-08-02): someone asking 10+ questions is a real signal.
  // Counts the visitor's own questions, and fires on the exact threshold turn only, so one
  // notification per conversation rather than one for every question past 10.
  const userTurns = messages.filter((m) => m.role === "user").length;
  if (userTurns === 10) notifyChatMilestone(userTurns, ip);

  const lastUser = [...messages].reverse().find((m) => m.role === "user");

  // Only send the tail of the conversation upstream. The client resends the FULL history every
  // turn, so without this the token cost grows quadratically — measured 2026-08-02: question 20
  // cost 8× question 1, and a 30k/hour budget ran out at ~question 11. Keeping the last few
  // turns preserves follow-up context ("그럼 그건 언제였죠?") while keeping per-question cost flat.
  // The RAG context is rebuilt from the latest question each time, so older turns matter less.
  const HISTORY_TURNS = 6; // messages, i.e. ~3 question/answer pairs
  const recent = messages.slice(-HISTORY_TURNS).map((m) =>
    m.role === "assistant" && m.content.length > MAX_ASSISTANT_CHARS
      ? { ...m, content: m.content.slice(0, MAX_ASSISTANT_CHARS) }
      : m
  );
  // 꼬리 전체가 MAX_TOTAL_CHARS 를 넘으면 **오래된 쪽부터** 떨군다. 마지막 질문은 언제나
  // 남는다 — 그게 없으면 답할 대상이 사라진다.
  const bounded: ChatMessage[] = [];
  let total = 0;
  for (let i = recent.length - 1; i >= 0; i--) {
    const len = recent[i].content.length;
    if (bounded.length && total + len > MAX_TOTAL_CHARS) break;
    bounded.unshift(recent[i]);
    total += len;
  }
  const outgoing = [buildAboutMeSystemMessage(lastUser?.content ?? ""), ...bounded];

  // ── 입장 판정 (T1 §1.9, §1.10) ────────────────────────────────────────
  // 신원: 쿠키(사람 단위) · IP 대역(돌려 쓰는 주소) · 로그인(jay). 셋이 각자 몫을 갖는다.
  const ticket = verifyTicket(req.headers.get("cookie")?.match(new RegExp(`${TICKET_COOKIE}=([^;]+)`))?.[1]);
  if (ticketsConfigured() && !ticket) {
    // 페이지를 거치지 않고 바로 부른 요청. 사람에게는 새로고침이면 풀린다.
    return Response.json({ error: "페이지를 새로고침한 뒤 다시 시도해주세요." }, { status: 403 });
  }
  const owner = Boolean((await auth())?.user);

  const estInput = estimateInputTokens(outgoing);
  const gate = await admit(
    { ip, cookieId: ticket?.id ?? null, returning: Boolean(ticket?.returning), owner },
    estInput
  );
  if (!gate.ok) return Response.json({ error: gate.message }, { status: gate.status });

  // 시간 상한(인메모리)은 그 안쪽 층이다 — 게이트를 통과한 뒤에 잡는다.
  const estCost = worstCaseCost(gate.model, estInput, gate.maxTokens);
  let hourLease: Lease;
  try {
    hourLease = acquire(estCost);
  } catch (e) {
    await gate.settle(0); // 게이트에서 잡은 예약을 돌려준다 — 안 그러면 거절된 요청이 남의 몫을 먹는다
    if (e instanceof Overloaded) {
      return Response.json({ error: "지금 처리 중인 요청이 많습니다 — 잠시 후 다시 시도해주세요." }, { status: 429 });
    }
    if (e instanceof OverBudget) {
      return Response.json({ error: "이번 시간의 채팅 한도에 도달했습니다 — 정각에 다시 열립니다." }, { status: 429 });
    }
    throw e;
  }

  // 한 번의 정산으로 네 층을 모두 닫는다.
  const anonymous = !owner && !ticket?.returning;
  const lease: Lease = {
    async settle(actualCost?: number) {
      const cost = actualCost && actualCost > 0 ? actualCost : estCost;
      hourLease.settle(cost);
      if (anonymous) noteAnonSpend(cost);
      rollHour(anonSpentThisHour()); // 시간이 바뀌었으면 공격 모드를 다시 센다
      // **기다린다.** 날려 보내면 Cloud Run 이 CPU 를 거둬 갈 때 쓰기가 유실되고,
      // 예약액(최악 추정)이 장부에 그대로 남아 하루 상한이 몇 배 일찍 닫힌다.
      await gate.settle(cost);
    },
  };

  try {
    const stream = await streamJayChat(outgoing, lease, { model: gate.model, maxTokens: gate.maxTokens });
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    lease.settle(); // 업스트림이 이미 과금했을 수 있다 — 추정치로 물고 자리를 돌려준다
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
