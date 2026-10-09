import { probeJayChat } from "@/lib/jay-chat";
import { aiProvider } from "@/lib/ai-provider";
import { chainDef, readChain } from "@/lib/chains";
import { notifyDevnetDown, notifyJayChatDown } from "@/lib/visitor-notify";

// 매시간 상태 점검 — Cloud Scheduler 가 매시 정각 POST 한다 (jay, 2026-10-09).
// 경로 이름은 Jay Chat 이지만 같은 날 Devnet 점검도 여기에 붙었다. 스케줄러 작업
// 하나, 비밀 하나로 둘 다 본다 — 점검 대상마다 작업을 늘리면 배포만 무거워진다.
//
// ① Jay Chat (LLM): 크레딧 소진(quota)·스로틀(rate)이면 notifyAiLimit 이, 그 외
//    실패(키 오류 401, 제공자 장애 5xx, 네트워크)는 notifyJayChatDown 이 텔레그램으로
//    알린다. 문구가 달라서 "돈을 넣을지, 키·제공자를 볼지"가 메시지만 보고 갈린다.
// ② Jayverse Devnet: 닿지 않거나, 체인 ID 가 다르거나, 체인 시계가 10분 넘게
//    뒤처지면 notifyDevnetDown. 시계 지연은 재시작·멈춤의 흔적이다 — anvil 은
//    채굴하는 동안에만 시계가 가므로, 내려가 있던 시간만큼 그대로 뒤처진다.
//    (디스크 사용량은 RPC 로 보이지 않아 여기서 못 본다.)
//
// 미들웨어에선 공개 경로지만, 1토큰이라도 LLM 을 부르므로 아무나 두드리게 두지 않는다:
// deploy.sh 가 만든 rabbit-health-secret 값이 X-Health-Secret 헤더로 와야 한다.
// 시크릿이 없는 환경(로컬 등)에선 닫힌 채로 실패한다.
export const dynamic = "force-dynamic";

const MAX_DEVNET_SKEW_SEC = 10 * 60;

async function checkJayChat() {
  try {
    const r = await probeJayChat();
    // 한도(limit != null)는 probeJayChat 안에서 이미 알렸다 — 여기선 그 밖의 실패만.
    if (!r.ok && r.limit === null) await notifyJayChatDown(r);
    return r;
  } catch (e) {
    // 네트워크 오류 등 — 제공자에 닿지도 못한 경우.
    const llm = aiProvider();
    await notifyJayChatDown({ host: llm.host, model: llm.model, status: 0, detail: String(e) });
    return { ok: false as const, error: String(e) };
  }
}

async function checkDevnet() {
  const def = chainDef("devnet");
  const r = await readChain(def, 1); // 던지지 않는다 — 실패는 reachable=false 로 온다
  const problem = !r.reachable
    ? `unreachable — ${r.error?.split("\n")[0] ?? "no answer"}`
    : r.chainId !== def.chainId
      ? `wrong chain id ${r.chainId} (expected ${def.chainId})`
      : r.skew > MAX_DEVNET_SKEW_SEC
        ? `chain clock ${Math.round(r.skew / 60)} min behind real time — the node restarted or stalled`
        : null;
  if (problem) await notifyDevnetDown(problem, def.statusUrl ?? def.rpc);
  return { ok: !problem, head: r.head, skewSec: r.skew, problem };
}

export async function POST(req: Request) {
  const secret = process.env.HEALTH_CHECK_SECRET;
  if (!secret) return Response.json({ error: "HEALTH_CHECK_SECRET not set" }, { status: 503 });
  if (req.headers.get("x-health-secret") !== secret) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  const [jayChat, devnet] = await Promise.all([checkJayChat(), checkDevnet()]);
  const ok = jayChat.ok && devnet.ok;
  // 실패는 200 이 아닌 상태로 돌려준다 — Cloud Scheduler 콘솔의 실행 기록에서도 빨갛게 보이도록.
  return Response.json({ ok, jayChat, devnet }, { status: ok ? 200 : 502 });
}
