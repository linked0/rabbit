import { buildAboutMeSystemMessage } from "@/lib/about-me";
import { streamJayChat, budgetExhausted, burstLimited, type ChatMessage } from "@/lib/jay-chat";
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

export async function POST(req: Request) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (burstLimited(ip)) {
    return Response.json({ error: "너무 빠릅니다 — 잠시 후 다시 시도해주세요." }, { status: 429 });
  }
  if (budgetExhausted()) {
    return Response.json(
      { error: "이번 시간의 채팅 한도에 도달했습니다 — 잠시 후 다시 시도해주세요." },
      { status: 429 }
    );
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
  const outgoing = [buildAboutMeSystemMessage(lastUser?.content ?? ""), ...recent];

  try {
    const stream = await streamJayChat(outgoing);
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
