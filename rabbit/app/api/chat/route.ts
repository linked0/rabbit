import { streamChat, type ChatMessage } from "@/lib/ai";

// AI 챗 스트리밍 엔드포인트 (plan §5) — 인증은 middleware가 보장
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let messages: ChatMessage[];
  try {
    const body = await req.json();
    messages = body?.messages;
    if (!Array.isArray(messages) || messages.length === 0) throw new Error();
  } catch {
    return Response.json(
      { error: "messages 배열이 필요합니다." },
      { status: 400 }
    );
  }

  try {
    const stream = await streamChat(messages);
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
