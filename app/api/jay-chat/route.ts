import type { ChatMessage } from "@/lib/ai";
import { buildAboutMeSystemMessage } from "@/lib/about-me";
import { streamJayChat, budgetExhausted, burstLimited } from "@/lib/jay-chat";

// Public, keyless "About Jay" persona endpoint — no login required (see middleware.ts
// PUBLIC_PATHS). Always answers as the About-Jay persona; never general-purpose chat,
// so a visitor can't repurpose this into a free ChatGPT proxy.
export const dynamic = "force-dynamic";

const MAX_MESSAGES = 20; // caps conversation length per request (cost + abuse guard)
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

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const outgoing = [buildAboutMeSystemMessage(lastUser?.content ?? ""), ...messages];

  try {
    const stream = await streamJayChat(outgoing);
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
