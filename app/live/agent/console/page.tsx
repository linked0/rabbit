import Nav from "../../../Nav";
import BackLink from "../../../BackLink";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import Console from "./Console";
import { appMode } from "@/lib/mode";

// J2 — 자율 거래 에이전트 조작판 (R-A · R-I · R-E).
//
// 목업(`/live/agent`)을 덮어쓰지 않고 옆에 둔 이유는 둘이 서로 다른 일을 하기
// 때문이다. 저쪽은 어디서나 열리는 **논증**이고(체인도 지갑도 없이 화면의 모양을
// 두고 다투기 위한 것), 이쪽은 anvil 과 verex API 가 도는 기계 앞에서만 열리는
// **조작판**이다. 배포된 사이트에서 이 페이지를 PoC 카드에 링크하면 방문자는
// 연결 오류만 보게 된다 — 그래서 카드는 여전히 목업을 가리킨다.
export default function AgentConsolePage() {
  const lang = getLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);
  // cloud 에서는 백엔드가 설정된 경우에만 조작판을 렌더한다 (jay, 2026-09-04).
  // VEREX_API_URL 이 있으면 라이브 콘솔이다: verex prod API + 진짜 Sepolia RPC +
  // Secret Manager 의 에이전트 키로 동작한다. 없으면 예전처럼 안내 한 장으로 대신한다.
  // 설명 배너(무엇을 보아야 하나 / 증명하지 않는 것)는 문서로서 그대로 둔다.
  const isCloud = appMode() === "cloud";
  const liveBackend = Boolean(process.env.VEREX_API_URL);
  const showConsole = !isCloud || liveBackend;

  return (
    <>
      <Nav />
      <main>
        <BackLink lang={lang} href="/live/agent" ko="자율 거래 에이전트" en="Autonomous trading agent" />
        <h1>{t("에이전트 조작판", "Agent console")}</h1>
        <p className="sub">
          {t(
            "위임을 부여하고, 증거를 넣고, 틱을 돌리고, 저널을 읽습니다 — 상한과 만료는 로컬 체인의 컨트랙트가 강제합니다.",
            "Grant the mandate, file the evidence, run a tick, read the journal — with the cap and the deadline enforced by contracts on the local chain.",
          )}
        </p>

        <div
          className="panel"
          style={{ marginTop: 16, borderColor: "#0ea5e9", borderWidth: 2, borderStyle: "solid" }}
        >
          <strong style={{ color: "#075985" }}>
            {t("로컬 전용 — 이 페이지는 당신의 기계에서만 동작합니다", "Local only — this page works on your machine")}
          </strong>
          <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
            {t(
              !isCloud
                ? "anvil, verex API(:4000), 그리고 배포된 위임 프레임워크가 필요합니다. 아래 프리플라이트가 셋 중 무엇이 빠졌는지 말해 줍니다. 화면의 모양을 두고 이야기하려는 것이라면 "
                : liveBackend
                  ? "이 배포본은 verex prod API 와 진짜 Sepolia 를 바라봅니다 — 위임은 MetaMask 의 정본 프레임워크, 거래는 verex prod 오더북입니다. 한 가지 한계: 스케줄러는 요청이 없으면 CPU 가 잠드는 Cloud Run 특성상 탭을 닫으면 멈출 수 있습니다. 화면의 모양을 두고 이야기하려는 것이라면 "
                  : "anvil, verex API(:4000), 그리고 배포된 위임 프레임워크가 필요합니다 — 이 배포본에는 설정돼 있지 않아 아래 조작판은 숨겨져 있습니다. 화면의 모양을 두고 이야기하려는 것이라면 ",
              !isCloud
                ? "It needs anvil, the verex API on :4000, and the deployed delegation framework. The preflight below tells you which of the three is missing. If you came to argue about the shape of the screen, the "
                : liveBackend
                  ? "This deployment talks to the verex prod API and real Sepolia — the mandate uses MetaMask's canonical framework, trades hit the verex prod book. One limit: Cloud Run throttles CPU between requests, so the scheduler can stall once every tab is closed. If you came to argue about the shape of the screen, the "
                  : "It needs anvil, the verex API on :4000, and the deployed delegation framework — not configured on this deployment, so the console below is hidden. If you came to argue about the shape of the screen, the ",
            )}
            <a href="/live/agent">{t("목업 페이지", "mock page")}</a>
            {t("가 그 용도입니다.", " is the one for that.")}
          </p>
        </div>

        <div className="panel" style={{ marginTop: 16 }}>
          <strong>{t("무엇을 보아야 하나", "What to look for")}</strong>
          <ol className="sub" style={{ marginTop: 8, paddingLeft: 20, fontSize: 13.5 }}>
            <li>
              {t(
                "저널의 대부분이 행동하지 않는 틱이라는 것 — 거래만 보여주는 화면이었다면 이건 그냥 능력 데모다.",
                "That most journal rows are ticks that did nothing — a screen showing only trades would just be the capability demo again.",
              )}
            </li>
            <li>
              {t(
                "여섯 가지 거절이 서로 다르게 보인다는 것. 특히 예산 소진과 만료는 다른 경계가 작동한 것이다.",
                "That the six refusals look different from each other. Exhausted and expired are two different boundaries closing.",
              )}
            </li>
            <li>
              {t(
                "만료 이후의 틱 — 아무도 취소하지 않았는데 체인이 거절하고, 저널에는 enforcer 가 낸 실제 사유가 적힌다.",
                "A tick after expiry — nobody revoked anything, the chain refuses, and the journal carries the enforcer's own reason.",
              )}
            </li>
            <li>
              {t(
                "각 행이 인용한 증거가 헤드라인과 출처로 되돌아간다는 것. 삭제된 항목은 조용히 빠지지 않고 「삭제된 항목」으로 남는다.",
                "That each row's cited evidence resolves back to a headline and a source — and a deleted item stays visible as “deleted”, rather than quietly vanishing.",
              )}
            </li>
          </ol>
        </div>

        {!showConsole ? (
          <div className="panel" style={{ marginTop: 16 }}>
            <strong>{t("조작판은 로컬에서만", "The console runs locally only")}</strong>
            <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
              {t(
                "이 배포된 사이트에는 anvil(로컬 체인)도 verex API 도 없어 모든 패널이 연결 오류를 냅니다. 그래서 여기서는 조작판을 숨깁니다. 실제로 돌리려면 이 저장소를 로컬에서 실행하세요: anvil + verex API + node scripts/deploy-delegation.mjs. 화면의 흐름만 보려면 위의 ",
                "This deployed site has no anvil (local chain) and no verex API, so every panel would fail with a connection error — the console is hidden here. To actually run it, start this repo locally: anvil + the verex API + node scripts/deploy-delegation.mjs. To see the flow, the ",
              )}
              <a href="/live/agent">{t("목업 페이지", "mock page")}</a>
              {t("를 쓰세요.", " walks through it.")}
            </p>
          </div>
        ) : (
          <Console />
        )}

        <div className="panel" style={{ marginTop: 24 }}>
          <strong>{t("이 조작판이 증명하지 않는 것", "What this console does not prove")}</strong>
          <ul className="sub" style={{ marginTop: 8, paddingLeft: 20, fontSize: 13.5 }}>
            <li>
              {t(
                "뉴스를 스스로 발견하지 않는다 — 저장소는 사람이 채운다. 자동 수집이 붙는 날 `origin` 필드만 바뀐다.",
                "It does not discover news — a human fills the store. When a feed is wired, only the `origin` field changes.",
              )}
            </li>
            <li>
              {t(
                "운영 수준의 키 보관이 아니다 — 에이전트 키는 서버에 있다. 안전 주장은 키가 아니라 금액에 있다.",
                "Not production custody — the agent key lives on the server. The safety claim rests on the amount, not on custody.",
              )}
            </li>
            <li>
              {t(
                "무인 운영이 아직 아니다 — 틱을 누르는 것은 사람이다. 스케줄러(R-F)가 붙어야 그 주장이 성립한다.",
                "Not unattended yet — a human presses the tick. That claim needs the scheduler (R-F).",
              )}
            </li>
            <li>
              {t(
                "만료 판정은 벽시계가 아니라 블록 시간 기준이다. anvil 에서는 둘이 어긋날 수 있고, 저널이 그 경우를 그대로 적는다.",
                "Expiry is judged by block time, not your wall clock. On anvil the two can drift, and the journal says so when they do.",
              )}
            </li>
          </ul>
        </div>
      </main>
    </>
  );
}
