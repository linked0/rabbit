import { streamChat, type ChatMessage } from "@/lib/ai";
import { recommendSpaghettiRecipe, formatRecipe } from "@/lib/spaghetti";

// AI 챗 스트리밍 엔드포인트 (plan §5 + Task 4 MCP 토글) — 인증은 middleware가 보장
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let messages: ChatMessage[];
  let mcp = false;
  try {
    const body = await req.json();
    messages = body?.messages;
    mcp = body?.mcp === true; // 스파게티 MCP 토글
    if (!Array.isArray(messages) || messages.length === 0) throw new Error();
  } catch {
    return Response.json({ error: "messages 배열이 필요합니다." }, { status: 400 });
  }

  // MCP on → 스파게티 레시피 도구(spagetti)를 시스템 메시지로 주입.
  // (v1 wiring: lib/spaghetti가 MCP 서버와 동일 소스. off면 평범한 챗.)
  let outgoing = messages;
  if (mcp) {
    const lastUser = [...messages].reverse().find((m) => m.role === "user");
    const recipe = formatRecipe(recommendSpaghettiRecipe(lastUser?.content));
    const sys: ChatMessage = {
      role: "system",
      content:
        "너는 스파게티 레시피 MCP(spagetti)에 접근할 수 있다. 사용자가 스파게티·파스타·레시피를 물으면 " +
        "아래 추천을 활용해 답하라. 그 외 질문엔 평소대로 답하라.\n\n" +
        "[MCP recommend_spaghetti_recipe]\n" +
        recipe,
    };
    outgoing = [sys, ...messages];
  }

  try {
    const stream = await streamChat(outgoing);
    return new Response(stream, {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 502 });
  }
}
