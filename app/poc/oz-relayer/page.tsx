import Nav from "../../Nav";
import BackLink from "../../BackLink";
import TechNotes from "../../TechNotes";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { POC_CARDS } from "@/lib/poc-cards";
import SettlementQueueMock from "./SettlementQueueMock";

const CARD = POC_CARDS.find((c) => c.key === "oz-relayer")!;

// OpenZeppelin Relayer · Monitor — 논의용 목업 (jay 요청, 2026-08-11).
// 서비스 탐방 42/113에서 넘어왔고, 원본 회차 요약은 저장소에 없다(대화가 출처).
//
// 아직 구현이 아니다. Relayer도 Monitor도 배포되어 있지 않고, 큐 화면의 숫자는
// SettlementQueueMock.tsx의 각본이다. 이 페이지의 목적은 "이 서비스를 쓰자"가 아니라
// 내일 사고 실험의 대상을 눈앞에 세워 두는 것 — verex가 이미 손으로 짜 놓은 릴레이어를
// 진짜 릴레이어로 바꿀 때 무엇이 지워지고, 무엇이 남아야 하고, 무엇이 깨지는가.
export default function OzRelayerMockPage() {
  const lang = getLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);

  return (
    <>
      <Nav />
      <main>
        <BackLink lang={lang} />
        <h1>{t("OpenZeppelin Relayer · Monitor", "OpenZeppelin Relayer & Monitor")}</h1>
        <p className="sub">
          {t(
            "서비스는 죽고, 도구는 열렸다 — 관리형 SaaS가 종료되며 오픈소스로 넘긴 트랜잭션 배관과 온체인 감시.",
            "The managed service shut down; the tools were opened — self-hosted transaction plumbing and on-chain alerting."
          )}
        </p>

        <div
          className="panel"
          style={{ marginTop: 16, borderColor: "#f59e0b", borderWidth: 2, borderStyle: "solid" }}
        >
          <strong style={{ color: "#b45309" }}>
            {t("목업 — 아직 아무것도 실제로 돌지 않습니다", "Mock — nothing here is running yet")}
          </strong>
          <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
            {t(
              "Relayer도 Monitor도 배포되어 있지 않습니다. 아래 큐 화면의 숫자는 전부 손으로 적은 각본이고, 「다음 블록」 버튼이 그것을 한 칸씩 보여줄 뿐입니다. 도입 여부를 정하기 전에, 무엇을 바꾸게 되는지를 눈앞에 두고 이야기하기 위한 페이지입니다.",
              "Neither Relayer nor Monitor is deployed. Every number in the queue below is a hand-written script, and the “next block” button just advances it. This page exists so the trade can be argued about before anything is adopted."
            )}
          </p>
        </div>

        {/* Defender 종료가 이 카드의 절반이다 — 나머지 절반(배관)만 다루면 그냥 도구 소개가 된다. */}
        <div className="panel" style={{ marginTop: 24 }}>
          <strong>{t("먼저, 이 항목이 여기 있는 이유", "First — why this is in the catalogue at all")}</strong>
          <p className="sub" style={{ marginTop: 8, fontSize: 13.5 }}>
            {t(
              "Defender는 컨트랙트 운영의 3종 세트(트랜잭션 릴레이·온체인 모니터링·운영 자동화)를 팔던 관리형 SaaS였고, 2025-06-30 신규 가입 중단 → 2026-07-01 완전 종료됐습니다. OpenZeppelin은 같은 기능을 프로덕션 레디 오픈소스로 다시 내놨습니다. 그래서 이 항목의 질문은 「이 서비스를 쓸까」가 아닙니다 — 대부분의 인프라 결정에 빠져 있는 기준 하나에 대한 사례 연구입니다: ",
              "Defender was a managed SaaS selling the three staples of contract operations — transaction relaying, on-chain monitoring, operational automation. Sign-ups closed on 2025-06-30; it shut down entirely on 2026-07-01, and OpenZeppelin re-released the same functionality as production-ready open source. So the question here is not “should we use this service.” It is a case study in a criterion missing from most infrastructure decisions: "
            )}
            <strong>{t("벤더가 떠날 때 무엇이 남는가.", "what remains when the vendor leaves.")}</strong>
          </p>
          <p className="sub" style={{ marginTop: 8, fontSize: 13.5 }}>
            {t(
              "Defender는 잘 떠났습니다 — 1년 예고, 마이그레이션 가이드, 오픈소스 후계자. 그래서 오히려 좋은 기준점이 됩니다. 대부분의 벤더는 이렇게 나가주지 않고, 그때 남는 건 「우리가 그 위에 무엇을 얹었는가」뿐입니다.",
              "Defender left well: a year's notice, a migration guide, an open-source successor. That makes it a good yardstick precisely because most vendors will not leave that politely — and when they don't, what remains is only whatever you built on top."
            )}
          </p>
        </div>

        {/* 사고 실험의 대상. 남의 코드가 아니라 verex라서 세 질문이 전부 검증 가능하다. */}
        <div className="panel" style={{ marginTop: 24 }}>
          <strong>{t("사고 실험의 대상 — verex는 이미 릴레이어를 손으로 짰다", "The subject — verex already wrote a relayer by hand")}</strong>
          <p className="sub" style={{ marginTop: 8, fontSize: 13.5 }}>
            {t(
              "verex의 ChainJob 워커(packages/api/src/worker.ts)는 엄격히 직렬로 실행되고, 그 이유가 파일 헤더에 그대로 적혀 있습니다 — ",
              "verex's ChainJob worker (packages/api/src/worker.ts) executes strictly serially, and its own header says why — "
            )}
            <em>
              {t(
                "「모든 tx를 오퍼레이터나 서버 보관 키가 보내므로, 단일 레인이 곧 논스 관리다.」",
                "“all txs are sent by the operator or a server-held demo key, so a single lane doubles as nonce management.”"
              )}
            </em>
            {t(
              " 그 주위에 지수 백오프(5s → 25s → 125s), 원자적 PENDING→RUNNING 클레임, 2분 뒤 멈춘 잡 복구, 종료 실패 시 보상(onFailed)이 붙어 있습니다. 이름만 안 붙었을 뿐 릴레이어입니다.",
              " Around it sit exponential backoff (5s → 25s → 125s), an atomic PENDING→RUNNING claim, stuck-job recovery after two minutes, and compensation on terminal failure (onFailed). It is a relayer in everything but name."
            )}
          </p>
          <ol className="sub" style={{ marginTop: 12, paddingLeft: 20, fontSize: 13.5 }}>
            <li>
              <strong>{t("무엇을 지울 수 있나?", "What would a Relayer let you delete?")}</strong>{" "}
              {t(
                "논스 레인, 가스 전략, 재시도 사다리. 셋 다 배관이고, 셋 다 이미 남이 더 잘 만들어 뒀습니다.",
                "The nonce lane, the gas strategy, the retry ladder. All three are plumbing, and all three already exist, made better, elsewhere."
              )}
            </li>
            <li>
              <strong>{t("무엇이 남아야 하나?", "What has to stay?")}</strong>{" "}
              {t(
                "onFailed. 종료 실패 후 DB 체결을 되감는 건 배관의 옷을 입은 비즈니스 로직입니다 — 릴레이어는 트랜잭션이 실패했다는 건 알지만, 실패한 SETTLE_MATCH가 곧 두 사용자의 잔고를 취소해야 한다는 뜻임은 알 수 없습니다.",
                "onFailed. Reversing DB fills after a terminal failure is business logic wearing plumbing's clothes — a relayer knows a transaction failed, but it cannot know that a failed SETTLE_MATCH means two users' balances must be un-credited."
              )}
            </li>
            <li>
              <strong>{t("무엇이 깨지나?", "What breaks?")}</strong>{" "}
              {t(
                "이게 진짜 질문입니다. 단일 레인은 논스만이 아니라 정산 순서까지 부수적으로 직렬화하고 있었습니다. 레인을 넓히면 그 보장이 사라지고, 그게 중요했는지 아닌지가 그때 드러납니다 — 그리고 이 코드베이스는 이미 정확히 그 계열의 버그를 하나 냈습니다(정산 전 balanceOf로 사다리를 산정한 건, 2026-08-07).",
                "This is the real question. The single lane was serializing settlement order as a side effect, not just nonces. Widen it and that guarantee is gone — and you find out whether it mattered. This codebase has already produced one bug of exactly that family: a ladder sized from a pre-settlement balanceOf (2026-08-07)."
              )}
            </li>
          </ol>
        </div>

        {/* jay가 두 번 요청한 부분 — "그래서 실제로 뭘 세우고 뭘 고치는가". 위 세 질문이
            추상적이라 이 패널이 없으면 사고 실험의 대상이 손에 안 잡힌다. 설정 값은
            예시이고, 실제 필드명은 각 저장소에서 확인해야 한다(맨 아래에 그렇게 적어 뒀다). */}
        <div className="panel" style={{ marginTop: 24 }}>
          <strong>{t("구체적으로 — 무엇을 세우고, verex의 어디가 바뀌나", "Concretely — what you stand up, and what changes in verex")}</strong>

          <p className="sub" style={{ marginTop: 12, fontSize: 13.5 }}>
            <strong>{t("① Relayer 세우기 — 작은 VM 1대", "① Stand up the Relayer — one small VM")}</strong>
          </p>
          <pre style={{ marginTop: 6, fontSize: 12.5, overflowX: "auto" }}>
            <code>{`git clone https://github.com/OpenZeppelin/openzeppelin-relayer
cd openzeppelin-relayer && cp .env.example .env
docker compose up -d          # REST API 노출`}</code>
          </pre>
          <p className="sub" style={{ marginTop: 6, fontSize: 13 }}>
            {t(
              "핵심은 설정 파일이다 — 네트워크, 그리고 키를 어디서 가져오는가. 오퍼레이터 키가 서버 env를 떠나는 지점이라, 도입의 부수 효과가 아니라 주된 이유일 수 있다.",
              "The config is the point — the network, and where the key comes from. This is where the operator key leaves a server env var, which may be the main reason to adopt rather than a side effect."
            )}
          </p>
          <pre style={{ marginTop: 6, fontSize: 12.5, overflowX: "auto" }}>
            <code>{`{
  "networks": [{ "network": "sepolia", "rpc_urls": ["\${SEPOLIA_RPC}"] }],
  "signers": [{
    "id": "verex-operator",
    "type": "aws_kms",            // ← env 변수가 아니라 KMS
    "config": { "key_id": "\${KMS_KEY_ID}", "region": "ap-northeast-2" }
  }],
  "relayers": [{
    "id": "verex-settle",
    "network": "sepolia",
    "signer_id": "verex-operator",
    "policies": { "gas_price_cap": "50000000000" }
  }]
}`}</code>
          </pre>

          <p className="sub" style={{ marginTop: 16, fontSize: 13.5 }}>
            <strong>{t("② verex의 호출부 — 무엇이 지워지나", "② verex's call site — what gets deleted")}</strong>
          </p>
          <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
            {t(
              "지금은 워커가 viem으로 직접 쏘고, 논스는 「레인이 하나라서」 맞고, 실패하면 runAfter를 밀어 재시도한다. Relayer를 넣으면 워커는 「무엇을 보낼지」만 정하고 나머지를 넘긴다.",
              "Today the worker fires through viem, the nonce is correct because there is only one lane, and failure pushes runAfter for a retry. With a Relayer the worker only decides what to send and hands off the rest."
            )}
          </p>
          <pre style={{ marginTop: 6, fontSize: 12.5, overflowX: "auto" }}>
            <code>{`// before — worker.ts 안, 직렬 레인이 논스를 지켜준다
const hash = await exchange.matchOrders(taker, makers, fills);
await publicClient.waitForTransactionReceipt({ hash });

// after — 논스·가스·재시도는 Relayer 소관
const res = await fetch(\`\${RELAYER}/api/v1/relayers/verex-settle/transactions\`, {
  method: "POST",
  headers: { Authorization: \`Bearer \${RELAYER_KEY}\` },
  body: JSON.stringify({ to: EXCHANGE, data: encodeMatchOrders(...), value: "0" }),
});
const { id } = await res.json();   // 이 id를 ChainJob.result 에 저장하고 폴링`}</code>
          </pre>
          <p className="sub" style={{ marginTop: 6, fontSize: 13 }}>
            {t(
              "지워지는 것: 논스 레인(= 직렬 제약), 가스 가격 선택, 백오프 사다리 5s/25s/125s. 남는 것: ChainJob 행 자체(어떤 비즈니스 작업인지 아는 건 여기뿐), 그리고 onFailed.",
              "Deleted: the nonce lane (and with it the serial constraint), gas price selection, the 5s/25s/125s backoff ladder. Kept: the ChainJob row itself — the only place that knows what business operation this is — and onFailed."
            )}
          </p>

          <p className="sub" style={{ marginTop: 16, fontSize: 13.5 }}>
            <strong>{t("③ Monitor 룰 — 이미 근거가 있는 첫 룰", "③ The Monitor rule — the first one already has evidence")}</strong>
          </p>
          <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
            {t(
              "08-07의 사다리 버그는 잘못된 호가를 낼 때까지 오프체인에서 보이지 않았지만, 온체인에서는 처음부터 관측 가능했다. 오퍼레이터의 실제 보유량과 호가 규모가 어긋나는 순간이 곧 룰이다.",
              "The ladder bug of 08-07 was invisible off-chain until it produced a wrong quote, but on-chain it was observable the whole time. The moment the operator's holdings diverge from its advertised size is the rule."
            )}
          </p>
          <pre style={{ marginTop: 6, fontSize: 12.5, overflowX: "auto" }}>
            <code>{`{
  "name": "verex-operator-oversold",
  "networks": ["sepolia"],
  "addresses": ["0xCTF"],
  "match_conditions": {
    "events": [{
      "signature": "TransferSingle(address,address,address,uint256,uint256)",
      "expression": "from == OPERATOR && value > 500000000"
    }]
  },
  "triggers": ["slack_settlement"]
}`}</code>
          </pre>
          <p className="sub" style={{ marginTop: 6, fontSize: 13 }}>
            {t(
              "그 다음 룰 셋: 정산 실패(FAILED로 떨어진 ChainJob에 대응하는 revert), 만료 임박한 마켓의 미확정 상태, 그리고 Relayer 계정의 가스 잔량 — 마지막 것이 「누가 데몬을 지켜보는가」에 대한 유일한 실질적 답이다.",
              "The next three: a settlement revert (the on-chain counterpart of a ChainJob falling to FAILED), a market past its close still unresolved, and the Relayer account's own gas balance — that last one being the only concrete answer to “who watches the daemon”."
            )}
          </p>
        </div>

        <SettlementQueueMock />

        {/* Monitor는 Relayer의 대칭이다 — 하나는 내보내는 쪽, 하나는 지켜보는 쪽. */}
        <div className="panel" style={{ marginTop: 24 }}>
          <strong>{t("Monitor — 반대 방향", "Monitor — the other direction")}</strong>
          <p className="sub" style={{ marginTop: 8, fontSize: 13.5 }}>
            {t(
              "Relayer가 내보내는 쪽이라면 Monitor는 지켜보는 쪽입니다. 이벤트·함수 호출·트랜잭션 패턴을 선언적 JSON 룰로 감시하고 Slack이나 웹훅으로 알립니다. verex에 붙일 첫 룰이 정해져 있는데, 근거가 이미 있기 때문입니다 — 08-07의 사다리 버그는 잘못된 호가를 낼 때까지 오프체인에서 보이지 않았지만, ",
              "If Relayer is the outbound side, Monitor is the watching side: declarative JSON rules over events, function calls, and transaction patterns, firing Slack or webhook alerts. The first rule to write against verex already picks itself, because the evidence exists — the ladder bug of 08-07 was invisible off-chain until it produced a wrong quote, but "
            )}
            <strong>{t("온체인에서는 처음부터 관측 가능했습니다.", "on-chain it was observable the entire time.")}</strong>
            {t(
              " 오퍼레이터의 실제 보유량과 호가 규모가 어긋나는 순간이 곧 룰입니다.",
              " The moment the operator's actual holdings diverge from its advertised size is the rule."
            )}
          </p>
          <pre style={{ marginTop: 12, fontSize: 12.5, overflowX: "auto" }}>
            <code>{`{
  "name": "verex-operator-oversold",
  "networks": ["sepolia"],
  "addresses": ["0xCTF"],
  "match_conditions": {
    "events": [{
      "signature": "TransferSingle(address,address,address,uint256,uint256)",
      "expression": "from == OPERATOR && value > 500000000"
    }]
  },
  "triggers": ["slack_alert"]
}`}</code>
          </pre>
          <p className="sub" style={{ marginTop: 8, fontSize: 13 }}>
            {t(
              "위 룰은 예시일 뿐 검증된 스키마가 아닙니다 — 실제 필드명은 openzeppelin-monitor 저장소에서 확인해야 합니다.",
              "That rule is illustrative, not a verified schema — the real field names have to come from the openzeppelin-monitor repository."
            )}
          </p>
        </div>

        <div className="panel" style={{ marginTop: 24 }}>
          <strong>{t("이 목업을 두고 정해야 할 것", "What this mock is meant to settle")}</strong>
          <ul className="sub" style={{ marginTop: 8, paddingLeft: 20, fontSize: 13.5 }}>
            <li>
              {t(
                "레인을 넓히는 게 verex에 실제로 필요한가 — 지금 정산량이 블록당 1건에 눌릴 만큼인가, 아니면 아직 아무 문제도 아닌가? 필요 없는데 도입하면 운영 부담만 새로 생긴다.",
                "Does verex actually need a wider lane — is settlement volume anywhere near one-per-block, or is this a non-problem today? Adopting it unneeded buys nothing but new operational burden."
              )}
            </li>
            <li>
              {t(
                "순서 보장이 필요한 범위는 어디까지인가 — 마켓 단위인가, 전역인가? 마켓 단위면 마켓별로 레인을 나눠도 되고, 그러면 릴레이어 없이도 넓힐 수 있다.",
                "What scope actually needs ordering — per market, or global? If per market, the lane can be split by market and widened without a relayer at all."
              )}
            </li>
            <li>
              {t(
                "키를 어디 두는가 — 지금은 서버 env다. Vault/KMS 연동은 릴레이어 도입의 부수 효과가 아니라, 어쩌면 도입의 주된 이유일 수도 있다.",
                "Where do the keys live — today, a server env var. Vault/KMS integration may not be a side effect of adopting a relayer; it may be the main reason to."
              )}
            </li>
            <li>
              {t(
                "누가 이 데몬을 지켜보는가 — Docker 이미지가 self-contained인 것과, 새벽 3시에 멈춘 걸 누가 알아채는가는 다른 문제다. 에이전트 카드의 「지켜지지 않는 가스통」과 같은 모양의 구멍이다.",
                "Who watches the daemon — a self-contained Docker image and someone noticing it stopped at 3am are different problems. Same shape of gap as the agent card's unguarded gas tank."
              )}
            </li>
          </ul>
        </div>

        <div className="panel" style={{ marginTop: 24 }}>
          <strong>{t("이 페이지가 주장하지 않는 것", "What this page does not claim")}</strong>
          <ul className="sub" style={{ marginTop: 8, paddingLeft: 20, fontSize: 13.5 }}>
            <li>
              {t(
                "Relayer를 도입해야 한다는 주장이 아니다 — 위 세 질문 중 ①만 답하고 ②③을 건너뛰면 정산이 조용히 망가진다.",
                "Not an argument that a relayer should be adopted — answer question ① while skipping ② and ③ and settlement breaks quietly."
              )}
            </li>
            <li>
              {t(
                "큐 화면의 숫자는 측정값이 아니라 각본이다. 체인 지연·가스·재시도를 양쪽 같게 두고 동시성만 다르게 계산했을 뿐이며, 실제 처리량은 블록 가스와 릴레이어 설정에 달려 있다.",
                "The queue numbers are a script, not a measurement. Chain latency, gas, and retries are held identical on both sides and only concurrency differs; real throughput depends on block gas and relayer configuration."
              )}
            </li>
            <li>
              {t(
                "오픈소스로 넘어갔다는 것이 곧 안전한 선택이라는 뜻은 아니다. 호스팅·가용성·대시보드·Autotasks는 관리형이었기에 공짜로 얻던 것이고, 그 책임이 전부 사용자에게 돌아온다.",
                "Open source is not automatically the safe choice. Hosting, uptime, dashboards, and Autotasks were free because the product was managed; all of that responsibility returns to you."
              )}
            </li>
          </ul>
        </div>

        <TechNotes cards={[CARD]} lang={lang} />
      </main>
    </>
  );
}
