import { probeJayChat } from "@/lib/jay-chat";

// Jay Chat 한도 점검 — Cloud Scheduler 가 매시간 POST 한다 (jay, 2026-10-09).
// 크레딧 소진(quota)이나 스로틀(rate)이면 lib/visitor-notify 의 notifyAiLimit 이
// 텔레그램으로 알린다. 그 외 실패(401·500 등)는 응답 JSON 에만 남긴다 — 알림은
// "돈을 넣어야 하나, 기다리면 되나" 둘만 말한다 (ai-provider.ts 의 classifyLimit 참고).
//
// 미들웨어에선 공개 경로지만, 1토큰이라도 LLM 을 부르므로 아무나 두드리게 두지 않는다:
// deploy.sh 가 만든 rabbit-health-secret 값이 X-Health-Secret 헤더로 와야 한다.
// 시크릿이 없는 환경(로컬 등)에선 닫힌 채로 실패한다.
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const secret = process.env.HEALTH_CHECK_SECRET;
  if (!secret) return Response.json({ error: "HEALTH_CHECK_SECRET not set" }, { status: 503 });
  if (req.headers.get("x-health-secret") !== secret) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const r = await probeJayChat();
    // 실패는 200 이 아닌 상태로 돌려준다 — Cloud Scheduler 콘솔의 실행 기록에서도 빨갛게 보이도록.
    return Response.json(r, { status: r.ok ? 200 : 502 });
  } catch (e) {
    // 네트워크 오류 등 — 제공자에 닿지도 못한 경우.
    return Response.json({ ok: false, error: String(e) }, { status: 502 });
  }
}
