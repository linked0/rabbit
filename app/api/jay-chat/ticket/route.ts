import { issueTicket, ticketCookie, TICKET_COOKIE, ticketsConfigured } from "@/lib/jay-chat-ticket";

// 입장권 발급 (T1 §1.9 item 2). 채팅 페이지가 떠올 때 한 번 부른다.
//
// **왜 미들웨어가 아니라 여기인가.** 미들웨어는 Edge 런타임에서 돌고, 거기엔
// `node:crypto` 의 `createHmac` 이 없다. Next 14 의 미들웨어는 Node 런타임으로
// 바꿀 수도 없다. 라우트 핸들러는 Node 라 서명이 그대로 된다.
//
// 이 엔드포인트도 같은 출처에서만 받는다 — 그러지 않으면 아무 사이트나 방문자의
// 브라우저로 입장권을 받아 갈 수 있다.
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  if (!ticketsConfigured()) {
    // 비밀값이 없으면 입장권 체계를 켤 수 없다. 조용히 넘어가면 API 쪽이 전부 403 이
    // 되므로, 그 상태를 분명히 돌려준다.
    return Response.json({ ok: false, reason: "no-secret" }, { status: 200 });
  }
  const site = req.headers.get("sec-fetch-site");
  const origin = req.headers.get("origin");
  const host = req.headers.get("host");
  const sameOrigin =
    site === "same-origin" || site === "same-site" || site === "none" ||
    (!site && (!origin || (() => { try { return new URL(origin).host === host; } catch { return false; } })()));
  if (!sameOrigin) return Response.json({ ok: false }, { status: 403 });

  const prev = req.headers.get("cookie")?.match(new RegExp(`${TICKET_COOKIE}=([^;]+)`))?.[1];
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": ticketCookie(issueTicket(prev)),
      "Cache-Control": "no-store",
    },
  });
}
