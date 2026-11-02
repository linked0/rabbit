import Nav from "../../Nav";
import BackLink from "../../BackLink";
import TechNotes from "../../TechNotes";
import TechNotesLink from "../../TechNotesLink";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { POC_CARDS } from "@/lib/poc-cards";
import StackRun from "./StackRun";

const CARD = POC_CARDS.find((c) => c.key === "agent-stack")!;

// 한 번의 실행 (jay, 2026-11-02 손그림). 여섯 개의 라이브 데모가 각자 한 조각씩만 보여 주던
// 것을 한 화면에 모아, **어느 순서로 맞물리는지**를 보여 주는 페이지. 새 데모를 만드는 게
// 아니라 기존 여섯 장을 잇는 것이 목적이라, 판 위의 모든 줄은 그 단계를 실제로 돌리는
// 페이지로 링크된다.
//
// jay 의 메모 두 줄을 그대로 받았다: "add any involved eip erc component not like erc20"
// → 아래 표준 표. "Also include x402" → 에이전트→서비스 간선이 x402 다.
export default function StackPage() {
  const lang = getLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);

  // 이 흐름에 **실제로** 걸리는 표준만. ERC-20 은 뺐다 — 움직이는 돈이지 맞물리는 부품이 아니다.
  // `run` 은 거짓말하지 않기 위한 칸이다: 도는 것과 이름만 있는 것을 같은 표에 섞되 구분한다.
  const STANDARDS: Array<{
    id: string;
    role: string;
    step: string;
    run: "live" | "named";
    href?: string;
    label?: string;
  }> = [
    {
      id: "EIP-7702",
      role: t(
        "EOA 가 주소와 키를 그대로 둔 채 코드를 갖는다. 코드 자리에 0xef0100‖구현주소 가 들어간다.",
        "An EOA keeps its address and key but gains code: 0xef0100‖implementation lands in the code slot.",
      ),
      step: "①",
      run: "live",
      href: "/live/7702",
      label: t("7702 인스펙터", "7702 inspector"),
    },
    {
      id: "ERC-7715",
      role: t(
        "wallet_grantPermissions — 주인이 답하는 단 하나의 팝업. 한도와 기한이 여기서 정해진다.",
        "wallet_grantPermissions — the single popup the owner answers. The cap and the deadline are set here.",
      ),
      step: "②",
      run: "live",
      href: "/live/agent/console",
      label: t("정산 에이전트 콘솔", "Settlement console"),
    },
    {
      id: "ERC-7710",
      role: t(
        "스마트 컨트랙트 위임. 행사할 때마다 caveat enforcer 가 한도를 확인하고, 넘으면 되돌린다.",
        "Smart-contract delegation. On every redemption a caveat enforcer checks the cap and reverts past it.",
      ),
      step: "④",
      run: "live",
      href: "/live/aa",
      label: t("AA 데모", "AA demo"),
    },
    {
      id: "ERC-4337",
      role: t(
        "UserOperation · 번들러 · paymaster. 에이전트가 ETH 를 한 푼도 들지 않고 트랜잭션을 낸다.",
        "UserOperation, bundler, paymaster — the agent transacts while holding no ETH at all.",
      ),
      step: "④",
      run: "live",
      href: "/live/aa",
      label: t("AA 기둥 ②③", "AA pillars ②③"),
    },
    {
      id: "EIP-712",
      role: t(
        "위임 부여와 AP2 mandate 밑에 똑같이 깔려 있는 타입 데이터 서명. 사람이 읽을 수 있는 서명 대상.",
        "The typed-data signature under both the grant and every AP2 mandate — what makes the signed object human-readable.",
      ),
      step: "② ⑤",
      run: "live",
    },
    {
      id: "x402",
      role: t(
        "HTTP 402 를 되살린 기계 대 기계 요금 지불. 응답이 '얼마'를 돌려주고 호출자가 그 자리에서 낸다.",
        "HTTP 402 revived as machine-to-machine payment: the response quotes a price and the caller pays inline.",
      ),
      step: "⑤",
      run: "named",
    },
    {
      id: "AP2",
      role: t(
        "Intent · Cart · Payment 세 가지 mandate(서명된 검증가능 자격증명)로 '무엇을 얼마에'를 고정한다. ERC 가 아니라 프로토콜.",
        "Intent, Cart and Payment mandates — signed verifiable credentials that pin down what is bought at what price. A protocol, not an ERC.",
      ),
      step: "⑤ ⑥",
      run: "live",
      href: "/live/ap2",
      label: "AP2 / Toss",
    },
    {
      id: "ERC-8004",
      role: t(
        "온체인 에이전트 신원·평판 — '상대가 정말 그 에이전트인가'. 이 판에서 유일하게 돌지 않는 조각.",
        "On-chain agent identity and reputation — \"is the counterparty really that agent\". The one piece on this board that does not run.",
      ),
      step: "⑤",
      run: "named",
    },
    {
      id: "ERC-1271",
      role: t(
        "isValidSignature — 컨트랙트 계정이 오프체인 서명을 증명하는 방법. 업그레이드된 계정이 mandate 에 서명하는 순간 필요해진다.",
        "isValidSignature — how a contract account proves an off-chain signature. Needed the moment an upgraded account signs a mandate.",
      ),
      step: "⑤",
      run: "named",
    },
    {
      id: "ERC-5792",
      role: t(
        "wallet_sendCalls — 지갑 쪽 원자적 배치 API. 여기서는 같은 일을 4337 배치로 하고 있어 이름만 걸쳐 있다.",
        "wallet_sendCalls — the wallet-side atomic batch API. Here the same job is done through 4337 batching, so this one is adjacent rather than used.",
      ),
      step: "④",
      run: "named",
    },
  ];

  // 동그라미 친 여섯 장이 이 실행의 어느 칸을 맡는지.
  const DEMOS: Array<{ href: string; name: string; steps: string; covers: string }> = [
    {
      href: "/live/7702",
      name: t("EIP-7702 — 주소 그대로 스마트 계정", "EIP-7702 — smart account, same address"),
      steps: "①",
      covers: t("아무 Sepolia 주소의 위임 지정자를 직접 읽는다.", "Reads any Sepolia account's delegation designator directly."),
    },
    {
      href: "/live/aa",
      name: t("AA — 위임형 계정 & 세션 키", "AA — delegatable accounts & session keys"),
      steps: "② ④",
      covers: t(
        "7715 로 세션 키를 받고 한도 안에서 쓴다 + paymaster·원자적 호출 기둥.",
        "Takes a session key via 7715 and spends inside the cap, plus the paymaster and atomic-call pillars.",
      ),
    },
    {
      href: "/live/agent/console",
      name: t("정산 에이전트 — 위임·틱·저널", "Settlement Agent — grant, tick, journal"),
      steps: "② ④ ⑥",
      covers: t(
        "지갑 팝업으로 실제 부여 → 틱 → 체인이 재구성 못 하는 저널. 로컬 스택이 있어야 돈다.",
        "A real grant through the wallet popup, then ticks, then the journal the chain cannot reconstruct. Needs the local stack.",
      ),
    },
    {
      href: "/live/agent",
      name: t("자율 결제 에이전트", "Autonomous payment agent"),
      steps: "③",
      covers: t(
        "이 실행에서 사람이 없는 단 하나의 칸 — 깨어나서 스스로 살지 말지 정한다.",
        "The only square in this run with no human in it — it wakes and decides for itself whether to spend.",
      ),
    },
    {
      href: "/live/ap2",
      name: t("AP2 — Stripe 정산", "AP2 — Stripe settlement"),
      steps: "⑤ ⑥",
      covers: t("mandate → Stripe Checkout 테스트 결제 → 영수증.", "Mandate → Stripe test Checkout → receipt."),
    },
    {
      href: "/live/toss",
      name: "Toss Payments",
      steps: "⑥",
      covers: t("같은 ⑥ 을 원화 레일로. 국내 대응물.", "The same ⑥ on the KRW rail — the domestic counterpart."),
    },
  ];

  return (
    <>
      <Nav />
      <main>
        <BackLink lang={lang} href="/live" ko="Jayverse" en="Jayverse" />
        <h1>{t("한 번의 실행 — 여섯 데모가 어떻게 맞물리나", "One run — how the six demos coordinate")}</h1>
        {/* 강조는 JSX 로 — .sub 는 평문이라 마크다운 ** 가 그대로 찍힌다 (2026-11-02 확인). */}
        <p className="sub">
          {t(
            "7702 인스펙터, AA 세션 키, 정산 에이전트 콘솔, 자율 결제 에이전트, AP2, 토스 — 여섯 장이 각각 한 조각씩만 보여 줍니다. 조각을 다 봐도 \"그래서 돈이 나갈 때 무슨 순서로 맞물리나\"는 아직 어디에도 없었습니다. 이 페이지가 그 한 가지만 답합니다: 지출 한 건을 처음부터 끝까지, 누가 무엇을 쥐고 있고 ",
            "The 7702 inspector, the AA session key, the settlement console, the autonomous agent, AP2 and Toss each show one piece. Seeing all six still never answered the question \"in what order do they engage when money actually leaves\". This page answers only that: one spend, start to finish, as a board you run — who holds what, and ",
          )}
          <strong>{t("누가 막는지", "who refuses")}</strong>
          {t(" 보면서 돌려 보는 판입니다.", ".")}
        </p>
        <TechNotesLink lang={lang} />

        <StackRun lang={lang} />

        {/* ── 표준 ─────────────────────────────────────────── */}
        <h2 style={{ marginTop: 36 }}>{t("걸려 있는 표준", "The standards involved")}</h2>
        <p className="sub">
          {t(
            "이 흐름에 실제로 걸리는 것만 적었습니다. ERC-20 은 뺐습니다 — 움직이는 돈이지, 맞물리는 부품이 아닙니다. \"도나\" 칸은 거짓말을 막으려고 있습니다: 여기 데모에서 실제로 도는 것과, 이름이 걸려 있을 뿐인 것을 같은 표에 두되 구분해 둡니다.",
            "Only what this flow actually touches. ERC-20 is left out — it is the money that moves, not a part that engages. The \"runs\" column exists to stop this table from lying: what a demo here really executes and what is merely named both appear, but are marked apart.",
          )}
        </p>
        <div className="stack-table-wrap">
          <table className="stack-table">
            <thead>
              <tr>
                <th>{t("표준", "Standard")}</th>
                <th>{t("이 흐름에서 하는 일", "What it does here")}</th>
                <th>{t("단계", "Step")}</th>
                <th>{t("도나", "Runs")}</th>
              </tr>
            </thead>
            <tbody>
              {STANDARDS.map((s) => (
                <tr key={s.id}>
                  <td style={{ whiteSpace: "nowrap", fontWeight: 600 }}>{s.id}</td>
                  <td>{s.role}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{s.step}</td>
                  <td style={{ whiteSpace: "nowrap" }}>
                    {s.run === "live" ? (
                      s.href ? (
                        <a href={`${s.href}?from=live`}>{s.label} →</a>
                      ) : (
                        <span className="sub">{t("흐름 안에서", "inside the flow")}</span>
                      )
                    ) : (
                      <span className="sub">{t("이름만", "named only")}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── 어느 데모가 어느 칸을 맡나 ────────────────────── */}
        <h2 style={{ marginTop: 36 }}>{t("어느 데모가 어느 칸을 맡나", "Which demo owns which square")}</h2>
        <div className="stack-table-wrap">
          <table className="stack-table">
            <thead>
              <tr>
                <th>{t("데모", "Demo")}</th>
                <th>{t("단계", "Steps")}</th>
                <th>{t("거기서 실제로 도는 것", "What actually runs there")}</th>
              </tr>
            </thead>
            <tbody>
              {DEMOS.map((d) => (
                <tr key={d.href}>
                  <td>
                    <a href={`${d.href}?from=live`}>{d.name} →</a>
                  </td>
                  <td style={{ whiteSpace: "nowrap" }}>{d.steps}</td>
                  <td>{d.covers}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── 계획: md 가 아니라 이 페이지에 (jay, 2026-11-02) ── */}
        <h2 style={{ marginTop: 36 }}>{t("이 판의 계획 — 각본인 곳과 진짜인 곳", "The plan — what is scripted, what is real")}</h2>
        <div style={{ display: "grid", gap: 12, maxWidth: 680 }}>
          <div className="panel">
            <strong>{t("판 자체는 전부 각본입니다", "The board itself is entirely scripted")}</strong>
            <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
              {t(
                "위 판에는 체인도, 서명도, 모델 호출도, 키도 없습니다. 공개 페이지가 지갑을 부르거나 API 크레딧을 쓰게 두지 않으려는 것이고, 애초에 이 페이지가 답하려는 질문이 \"무엇이 도는가\"가 아니라 \"무슨 순서로 맞물리는가\"이기 때문입니다. 실제로 도는 것은 각 줄이 링크하는 여섯 장입니다.",
                "No chain, no signature, no model call, no key on that board. A public page should not be able to summon a wallet or spend API credit, and the question this page answers is not \"what runs\" but \"in what order does it engage\". The things that run are the six pages each line links to.",
              )}
            </p>
          </div>
          <div className="panel">
            <strong>{t("지금 비어 있는 칸 — x402 왕복", "The empty square today — the x402 round trip")}</strong>
            <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
              {t(
                "⑤ 에서 법정화폐 쪽(AP2 · 토스)은 테스트 결제가 실제로 돌지만, 기계 대 기계 쪽은 아직 라이브가 없습니다. 필요한 것은 작은 것 하나입니다: 402 와 가격을 돌려주는 엔드포인트, 그리고 그 값을 내고 다시 부르는 호출자. 이게 다음에 만들 조각입니다.",
                "On ⑤ the fiat side (AP2, Toss) really executes a test payment, but the machine-to-machine side has no live page yet. What it needs is small: an endpoint that answers 402 with a price, and a caller that pays it and retries. That is the next piece to build.",
              )}
            </p>
          </div>
          <div className="panel">
            <strong>{t("ERC-8004 은 설명만, 그렇게 적어 둡니다", "ERC-8004 is an explainer, and says so")}</strong>
            <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
              {t(
                "에이전트 신원·평판 표준은 테스트넷 배포 상황을 확인하지 못했습니다. 판 위에서도 흐린 칩으로 둡니다 — 돌지 않는 것을 돌아가는 것처럼 그리면, 이 페이지가 하려는 일(순서를 정직하게 보여 주기)이 통째로 무너집니다.",
                "The agent identity and reputation standard's testnet deployment status is unverified. It stays a dimmed chip on the board: drawing something that does not run as if it did would undo the one thing this page is for.",
              )}
            </p>
          </div>
          <div className="panel">
            <strong>{t("④ 를 진짜로 돌리려면 로컬 스택이 필요합니다", "Running ④ for real needs the local stack")}</strong>
            <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
              {t(
                "정산 에이전트 콘솔의 부여→틱→상환은 Sepolia 포크 anvil 과 verex API 가 이 기기에 떠 있어야 동작합니다. 공개 방문자가 눌러서 볼 수 있는 범위는 7702 인스펙터(읽기 전용)와 AP2·토스 테스트 결제까지입니다.",
                "Grant → tick → redeem on the settlement console needs a Sepolia-fork anvil and the verex API running on this machine. What a public visitor can press through is the 7702 inspector (read-only) and the AP2 / Toss test payments.",
              )}
            </p>
          </div>
        </div>

        <TechNotes cards={[CARD]} lang={lang} />
      </main>
    </>
  );
}
