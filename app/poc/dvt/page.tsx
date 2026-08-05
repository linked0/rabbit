import Nav from "../../Nav";
import BackLink from "../../BackLink";
import TechNotes from "../../TechNotes";
import TechNotesLink from "../../TechNotesLink";
import MermaidDiagram from "../../MermaidDiagram";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { POC_CARDS } from "@/lib/poc-cards";

const CARD = POC_CARDS.find((c) => c.key === "dvt")!;

// DVT를 프로토콜에 흡수하자는 제안 정독 노트 — 라이브 데모가 아니라 설계 분석 페이지.
// 아직 EIP 번호가 없는 ethresear.ch 단계의 제안이라 "구현했다"가 아니라 "무엇을 지금 만들 수
// 있고 무엇이 제안 채택을 기다려야 하나"로 구성했다 (jay, 2026-08-05).
export default function DvtPage() {
  const lang = getLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);

  const todayDiagram = `flowchart LR
    K["One validator key"] -->|"Shamir / threshold BLS"| S1["Share 1"]
    K --> S2["Share 2"]
    K --> S3["Share 3"]
    S1 --> C["Off-chain consensus round<br/>QBFT-family, every signature"]
    S2 --> C
    S3 --> C
    C -->|"reassembled signature"| P["Protocol<br/>sees one validator"]`;

  const proposalDiagram = `flowchart LR
    K1["Participant 1<br/>own key"] --> AGG["BLS aggregate<br/>+ participation bitfield"]
    K2["Participant 2<br/>own key"] --> AGG
    K3["Participant 3<br/>own key"] --> AGG
    AGG -->|"m of n present?"| P["Protocol<br/>groups them natively"]
    P -->|"bitfield is public"| D["Per-operator uptime<br/>becomes on-chain data"]`;

  const questions: { q: string; qKo: string; a: string; aKo: string }[] = [
    {
      q: "Slashing attribution",
      qKo: "슬래싱 귀속",
      a: "If one participant of the m signs something slashable, who pays? Partial slashing is new accounting the protocol does not do today.",
      aKo: "m 중 한 참여자가 슬래싱 대상 서명을 하면 누가 무는가? 부분 슬래싱은 오늘의 프로토콜이 하지 않는 새로운 회계입니다.",
    },
    {
      q: "Latency budget",
      qKo: "지연 예산",
      a: "When fewer than m show up in time, the group misses its duty. Liveness penalties have to land on someone, and \"whose fault\" is not obvious without a coordination round to blame.",
      aKo: "제 시간에 m명이 모이지 않으면 그룹이 의무를 놓칩니다. Liveness 페널티는 누군가에게 귀속돼야 하는데, 탓할 조율 라운드가 없으니 \"누구 잘못인가\"가 자명하지 않습니다.",
    },
    {
      q: "The m < n trade-off",
      qKo: "m < n 의 트레이드오프",
      a: "A lower m is more available and easier to collude in; a higher m is more resistant and easier to stall. This is a product decision disguised as a parameter.",
      aKo: "m이 낮으면 가용성이 높아지는 대신 공모가 쉬워지고, 높으면 저항성이 오르는 대신 멈추기 쉬워집니다. 파라미터로 위장한 제품 결정입니다.",
    },
    {
      q: "Why n ≤ 16",
      qKo: "n ≤ 16 의 근거",
      a: "Presumably an aggregation-cost ceiling rather than a security argument — worth confirming in the thread rather than assuming.",
      aKo: "보안 논거라기보다 집계 비용 상한으로 보이지만, 가정하지 말고 원 스레드에서 확인할 항목입니다.",
    },
  ];

  const buildable: {
    title: string;
    titleKo: string;
    body: string;
    bodyKo: string;
    now: boolean;
  }[] = [
    {
      title: "m-of-n settlement resolver — a prediction-market oracle adapter",
      titleKo: "m-of-n 정산 리졸버 — 예측시장 오라클 어댑터",
      body: "The idea transplants cleanly to any settlement layer that today trusts a single operator or a single dispute game. n resolvers each hold an independently generated key; m matching attestations settle the market; the bitfield records who actually showed up. Nothing here waits on the EIP — it is the same shape one layer up.",
      bodyKo: "오늘 단일 운영자나 단일 분쟁 게임에 의존하는 정산 계층이라면 이 아이디어가 그대로 이식됩니다. n명의 리졸버가 각자 독립 생성한 키를 들고, m개의 일치하는 서명이 마켓을 정산하며, 비트필드가 실제로 누가 참여했는지 기록합니다. EIP를 기다릴 필요가 없어요 — 한 층 위에서 같은 모양입니다.",
      now: true,
    },
    {
      title: "m-of-n independent checkers — the same accounting, no cryptography",
      titleKo: "m-of-n 독립 체커 — 암호학 없이 같은 회계 구조",
      body: "Replace \"one reviewer approved\" with \"m of n independent checks passed\" — link checking, build, spelling, policy linting. The rule worth importing is that the checkers never see each other's results: no coordination round means verification cost grows with n instead of n². Accumulated pass/fail records are the bitfield's CI equivalent, and let you retire a useless checker with data rather than opinion.",
      bodyKo: "\"리뷰어 1명 승인\"을 \"독립 체크 n개 중 m개 통과\"로 바꾸는 것 — 링크 검사, 빌드, 맞춤법, 정책 린터. 수입할 규칙은 체커들이 서로의 결과를 보지 않는다는 점입니다: 조율 라운드가 없으면 검증 비용이 n²이 아니라 n에 비례합니다. 누적된 통과/실패 기록이 비트필드의 CI 버전이고, 쓸모없는 체커를 의견이 아니라 데이터로 퇴출할 수 있게 해줍니다.",
      now: true,
    },
    {
      title: "Validator set registry — operator credit scoring from the bitfield",
      titleKo: "밸리데이터 셋 레지스트리 — 비트필드 기반 운영자 신용평가",
      body: "If participation becomes a public bitfield, per-operator uptime and slashing history become indexable on-chain data for the first time. Scoring that is a due-diligence product for anyone choosing operators — institutional staking desks most obviously. This one genuinely waits on the proposal shipping; the data does not exist yet.",
      bodyKo: "참여 여부가 공개 비트필드가 되면, 운영자별 가동률과 슬래싱 이력이 처음으로 인덱싱 가능한 온체인 데이터가 됩니다. 이를 점수화하면 운영자를 고르는 쪽 — 가장 분명하게는 기관 스테이킹 데스크 — 을 위한 실사 도구가 됩니다. 이건 정말로 제안 채택을 기다려야 해요. 데이터 자체가 아직 없습니다.",
      now: false,
    },
    {
      title: "Curation for the set — what remains after the ceremony disappears",
      titleKo: "셋 큐레이션 — 세리머니가 사라진 뒤 남는 것",
      body: "Killing DKG removes a technical ritual, not the question behind it: who belongs in the n, who bonds them, who insures the set. That is a service layer, and it is where today's middleware operators would land if the protocol absorbed their core function. Speculative, but the pattern is familiar.",
      bodyKo: "DKG를 없애는 것은 기술적 의례를 없앨 뿐 그 뒤의 질문을 없애지 않습니다: 누가 n에 들어갈 자격이 있는가, 누가 본드를 서는가, 누가 셋을 보험 처리하는가. 이건 서비스 계층이고, 프로토콜이 핵심 기능을 흡수했을 때 오늘의 미들웨어 운영자들이 착지할 자리입니다. 추정이지만 낯익은 패턴이에요.",
      now: false,
    },
  ];

  return (
    <>
      <Nav />
      <main>
        <BackLink lang={lang} />
        <h1>{t("프로토콜에 흡수된 DVT", "DVT, absorbed into the protocol")}</h1>
        <p className="sub">
          {t(
            "분산 밸리데이터를 미들웨어가 아니라 프로토콜이 직접 다루자는 제안 정독 노트 — 키를 쪼개는 대신 여러 키를 m-of-n으로 묶습니다. ⚠️ EIP 번호가 확정된 표준이 아니라 ethresear.ch 단계의 논의이므로, 구현 보고가 아니라 설계 분석입니다.",
            "Reading notes on a proposal to handle distributed validators in the protocol itself rather than in middleware — grouping several keys m-of-n instead of splitting one key. ⚠️ Not a finalized EIP with an assigned number but an ethresear.ch-stage discussion, so this is design analysis, not an implementation report."
          )}
        </p>
        <TechNotesLink lang={lang} />

        <h2 style={{ marginTop: 32 }}>{t("배경 — 잔고 유연성이라는 지반", "Background — balance flexibility as the ground")}</h2>
        <p style={{ marginTop: 8, maxWidth: 660 }}>
          {t(
            "Pectra의 EIP-7251이 유효 잔고 상한을 32에서 2048 ETH로 올리면서, 32·n ETH를 예치하면 n개의 슬롯이 선다는 산수가 프로토콜 안에서 성립하게 되었습니다. 여러 참여자를 하나의 밸리데이터로 묶는 이야기가 프로토콜 바깥의 요령이 아니라 프로토콜 안의 설계 선택지가 된 출발점입니다.",
            "Pectra's EIP-7251 raised the max effective balance from 32 to 2048 ETH, so the arithmetic of \"deposit 32·n ETH and n slots stand up\" now holds inside the protocol. That is what turns grouping several participants into one validator from a trick performed outside the protocol into a design option available within it."
          )}
        </p>

        <h2 style={{ marginTop: 32 }}>{t("오늘의 DVT — 열쇠를 쪼갠다", "DVT today — split the key")}</h2>
        <p style={{ marginTop: 8, maxWidth: 660 }}>
          {t(
            "Obol·SSV 같은 현행 DVT는 하나의 밸리데이터 키를 샤미르 분할이나 임계 BLS로 쪼개 노드들이 나눠 들고, 서명이 필요할 때마다 오프체인 합의 라운드(QBFT 계열)를 돌려 재조립합니다. 분산은 전부 프로토콜 밖 미들웨어에 삽니다 — 프로토콜은 여전히 밸리데이터 하나만 봅니다.",
            "Current DVT (Obol, SSV) splits one validator key with Shamir sharing or threshold BLS, hands the shares to separate nodes, and runs an off-chain consensus round (QBFT-family) to reassemble a signature every time one is needed. All of the distribution lives in middleware, outside the protocol — which still sees exactly one validator."
          )}
        </p>
        <MermaidDiagram definition={todayDiagram} />

        <h2 style={{ marginTop: 32 }}>{t("제안 — 금고를 바꾼다", "The proposal — change the vault instead")}</h2>
        <p style={{ marginTop: 8, maxWidth: 660 }}>
          {t(
            "키를 쪼개지 않습니다. 각 참여자가 처음부터 자기 키를 등록하고(n ≤ 16), 프로토콜이 그것을 m-of-n으로 묶습니다. BLS 집계와 참여 비트필드를 쓰는데, 이는 오늘날 attestation 집계와 같은 문법입니다 — m개 이상이 참여하면 인정. 사라지는 것 둘: ① 서명마다의 오프체인 합의 라운드 ② 키 세리머니와 DKG.",
            "The key is never split. Each participant registers their own key from the start (n ≤ 16), and the protocol groups them m-of-n. It uses BLS aggregation and a participation bitfield — the same grammar as today's attestation aggregation — and counts the duty as done when at least m took part. Two things disappear: ① the off-chain consensus round per signature, and ② the key ceremony and DKG."
          )}
        </p>
        <MermaidDiagram definition={proposalDiagram} />
        <p className="sub" style={{ marginTop: 12, maxWidth: 660 }}>
          {t(
            "비유하자면: DVT는 열쇠를 조각내 바깥에서 조립해 금고를 열고, 이 제안은 열쇠 여러 개가 꽂히면 열리도록 금고 자체를 바꿉니다.",
            "The analogy: DVT breaks the key into pieces and reassembles them outside to open the vault. This proposal changes the vault so that it opens when enough separate keys are inserted."
          )}
        </p>

        <h2 style={{ marginTop: 32 }}>{t("정독하며 남은 질문 넷", "Four questions the proposal leaves open")}</h2>
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          {questions.map((q) => (
            <div key={q.q} className="panel" style={{ maxWidth: 660 }}>
              <strong>{t(q.qKo, q.q)}</strong>
              <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
                {t(q.aKo, q.a)}
              </p>
            </div>
          ))}
        </div>

        <h2 style={{ marginTop: 32 }}>{t("실무 함의", "Why it matters beyond staking")}</h2>
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          <div className="panel" style={{ maxWidth: 660 }}>
            <strong>{t("미들웨어의 운명 패턴", "The middleware fate pattern")}</strong>
            <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
              {t(
                "번들러·페이마스터가 ERC-4337로 미들웨어에 살다가 네이티브 AA 논의(EIP-7702, EIP-8141)로 프로토콜에 흡수되는 흐름과 구조적으로 같습니다. 프로토콜 바깥에서 잘 작동하는 것은 결국 안으로 들어오고, 미들웨어는 서비스 계층으로 후퇴합니다 — 이 사이트의 AA 페이지들이 다루는 것과 같은 이야기의 다른 사례입니다.",
                "Structurally identical to bundlers and paymasters living in middleware under ERC-4337, then being absorbed by native AA discussions (EIP-7702, EIP-8141). What works well outside the protocol tends to get pulled inside, and the middleware retreats to a service layer — the same story the AA pages on this site are about, in a different domain."
              )}
            </p>
          </div>
          <div className="panel" style={{ maxWidth: 660 }}>
            <strong>{t("기관 스테이킹의 신뢰 가정이 한 층 내려간다", "Institutional staking loses a trust layer")}</strong>
            <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
              {t(
                "오늘 기관은 운영자를 믿고, 운영자는 DVT 미들웨어를 믿습니다. 프로토콜이 m-of-n을 직접 다루면 그 중간 한 층의 신뢰 가정이 사라집니다 — ETP·커스터디 배관을 실사하는 쪽에 직접적인 변화입니다.",
                "Today an institution trusts an operator, and the operator trusts DVT middleware. If the protocol handles m-of-n directly, one of those trust layers disappears — a direct change for anyone doing due diligence on ETP or custody plumbing."
              )}
            </p>
          </div>
          <div className="panel" style={{ maxWidth: 660 }}>
            <strong>{t("참여 비트필드 = 새로운 지표군", "The participation bitfield is a new metric family")}</strong>
            <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
              {t(
                "누가 참여했는지가 온체인에 남으면 운영자별 가동률이 공개 데이터가 됩니다. 인덱서 관점에서는 없던 지표군이 생기는 일이고, 아래 PoC 후보 중 하나가 정확히 여기서 나옵니다.",
                "If who participated is recorded on-chain, per-operator uptime becomes public data. From an indexer's point of view that is a metric family that did not previously exist — and one of the PoC candidates below comes directly from it."
              )}
            </p>
          </div>
        </div>

        <h2 style={{ marginTop: 32 }}>{t("PoC 후보 — 무엇을 지금 만들 수 있나", "PoC candidates — what could actually be built")}</h2>
        <p className="sub" style={{ maxWidth: 660 }}>
          {t(
            "제안 자체는 프로토콜 변경이라 개인이 구현할 수 없습니다. 하지만 아이디어의 회계 구조 — 독립 키 n개, m개 일치로 성립, 참여 기록이 평판이 됨 — 는 한 층 위에서 오늘 그대로 만들 수 있습니다.",
            "The proposal itself is a protocol change and cannot be implemented by an individual. But its accounting structure — n independent keys, m matching to count, participation records becoming reputation — can be built one layer up, today."
          )}
        </p>
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          {buildable.map((b) => (
            <div key={b.title} className="panel" style={{ maxWidth: 660 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <strong>{t(b.titleKo, b.title)}</strong>
                <span className={`poc-badge ${b.now ? "poc-badge-live" : "poc-badge-soon"}`}>
                  {b.now
                    ? t("지금 만들 수 있음", "buildable today")
                    : t("제안 채택 이후", "waits on the proposal")}
                </span>
              </div>
              <p className="sub" style={{ marginTop: 8, fontSize: 13 }}>
                {t(b.bodyKo, b.body)}
              </p>
            </div>
          ))}
        </div>

        <h2 style={{ marginTop: 32 }}>{t("첫 후보의 스펙 초안", "A spec sketch for the first candidate")}</h2>
        <p className="sub" style={{ maxWidth: 660 }}>
          {t(
            "정독하며 남은 질문 넷이 그대로 스펙 결정 넷으로 번역된다는 점이 이 아이디어의 매력입니다 — 슬래싱 귀속은 부분 슬래싱 회계로, 지연 예산은 폴백 규칙으로, m<n 트레이드오프는 등급별 m 테이블로, n 상한은 집계 가스 비용으로.",
            "What makes the idea attractive to build on is that the four open questions translate directly into four design decisions — slashing attribution becomes partial-slashing accounting, the latency budget becomes a fallback rule, the m<n trade-off becomes a per-tier table of m, and the n ceiling becomes an aggregation gas budget."
          )}
        </p>
        <pre
          style={{
            marginTop: 12,
            padding: 16,
            overflowX: "auto",
            fontSize: 13,
            lineHeight: 1.6,
            border: "1px solid var(--border, #e5e7eb)",
            borderRadius: 8,
            maxWidth: 660,
          }}
        >
{`ResolverSetAdapter

  resolvers[n]   independently generated keys, n <= 16
  threshold m    set per market — a product tier, not a constant
  attest(marketId, outcome, sig)
                 each resolver submits alone, seeing no one else
  bitfield       who actually submitted — the reputation ledger
  slashing       only the wrong signers lose bond, not the set
  liveness       fewer than m by deadline + T  ->  fall back`}
        </pre>
        <p className="sub" style={{ marginTop: 12, maxWidth: 660 }}>
          {t(
            "그리고 비트필드가 제품이 됩니다 — \"가동률 99%인 리졸버 7명 중 5명이 정산한 마켓\" 같은 문장을 UI 배지로 보여줄 수 있어요. 신뢰 모델을 사용자에게 파는 방법입니다.",
            "And the bitfield becomes a product surface — a badge that says \"settled by 5 of 7 resolvers, each at 99% uptime\". That is how you sell a trust model to a user instead of asking them to take it on faith."
          )}
        </p>

        <TechNotes cards={[CARD]} lang={lang} />
      </main>
    </>
  );
}
