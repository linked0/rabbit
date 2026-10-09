import { probeJayChat } from "@/lib/jay-chat";
import { aiProvider } from "@/lib/ai-provider";
import { notifyJayChatDown } from "@/lib/visitor-notify";

// Jay Chat 한도 점검 — Cloud Scheduler 가 매시간 POST 한다 (jay, 2026-10-09).
// 크레딧 소진(quota)이나 스로틀(rate)이면 lib/visitor-notify 의 notifyAiLimit 이
// 텔레그램으로 알린다. 그 외 실패(키 오류 401, 제공자 장애 5xx, 네트워크)도 같은 날
// jay 요청으로 notifyJayChatDown 이 알린다 — 문구가 달라서 "돈을 넣을지, 키·제공자를
// 볼지"가 메시지만 보고 갈린다.
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
    // 한도(limit != null)는 probeJayChat 안에서 이미 알렸다 — 여기선 그 밖의 실패만.
    if (!r.ok && r.limit === null) await notifyJayChatDown(r);
    // 실패는 200 이 아닌 상태로 돌려준다 — Cloud Scheduler 콘솔의 실행 기록에서도 빨갛게 보이도록.
    return Response.json(r, { status: r.ok ? 200 : 502 });
  } catch (e) {
    // 네트워크 오류 등 — 제공자에 닿지도 못한 경우.
    const llm = aiProvider();
    await notifyJayChatDown({ host: llm.host, model: llm.model, status: 0, detail: String(e) });
    return Response.json({ ok: false, error: String(e) }, { status: 502 });
  }
}
