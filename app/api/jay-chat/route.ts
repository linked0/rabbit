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
const MAX_MESSAGE_CHARS = 2000; // caps a single message's size

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

  let messages: ChatMessage[];
  try {
    const body = await req.json();
    messages = body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) throw new Error();
    if (messages.length > MAX_MESSAGES) throw new Error();
    for (const m of messages) {
      if (typeof m?.content !== "string" || m.content.length > MAX_MESSAGE_CHARS) throw new Error();
    }
  } catch {
    return Response.json({ error: "messages 배열이 필요합니다." }, { status: 400 });
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
  const recent = messages.slice(-HISTORY_TURNS);
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
