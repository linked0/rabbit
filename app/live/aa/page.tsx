import Nav from "../../Nav";
import BackLink from "../../BackLink";
import TechNotes from "../../TechNotes";
import TechNotesLink from "../../TechNotesLink";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { LazySessionKeyDemo, LazyAgenticPillars } from "./LazyAA";
import { POC_CARDS } from "@/lib/poc-cards";
import { AGENT_SCENARIOS } from "@/lib/agent-scenarios";

const AA_CARD = POC_CARDS.find((c) => c.key === "aa")!;

// AA — §3 ERC-7702/7715 세션 키 데모 + §6 Agentic AA 4대 요소. 설계: docs/tasks/current-plan.md §3, §6.
// force-dynamic: 정적 프리렌더 시 @metamask/smart-accounts-kit 로드가 멈추는 문제 회피
// (Node 정적 생성 컨텍스트와 안 맞음 — 클라이언트 전용 데모라 정적 생성 자체가 불필요).
export const dynamic = "force-dynamic";
export default function AaPage() {
  const lang = getLang();
  const t = (ko: string, en: string) => pick(lang, ko, en);

  return (
    <>
      <Nav />
      <main>
        <BackLink lang={lang} href="/live" ko="라이브" en="Live" />
        <h1>{t("AA — 위임형 계정 & 세션 키", "AA — Delegatable Accounts & Session Keys")}</h1>
        <p className="sub">
          {/* 세 표준의 역할이 다르다 — 이 페이지가 실제로 시연하는 건 7715/7710이고,
              7702는 MetaMask가 처리하는 전제조건. 이전 문구는 셋을 뭉뚱그려 혼란을 줬다. */}
          {t(
            "ERC-7715로 세션 키에 한도 권한을 위임하고, ERC-7710이 온체인에서 강제하는 데모입니다. EIP-7702는 오너 EOA를 스마트 계정으로 만드는 전제조건으로, 이 페이지가 아니라 MetaMask가 처리합니다. @metamask/smart-accounts-kit · Sepolia — 실제 자금은 사용되지 않습니다.",
            "A demo of ERC-7715 (delegate a bounded permission to a session key) and ERC-7710 (enforce it on-chain). EIP-7702 is the precondition that turns the owner's EOA into a smart account — handled by MetaMask, not by this page. @metamask/smart-accounts-kit · Sepolia — no real funds involved."
          )}
        </p>
        <TechNotesLink lang={lang} />
        <LazySessionKeyDemo />

        {/* 이름을 "Agentic AA"에서 바꾼 이유: 아래 버튼은 전부 사람이 누른다 — 에이전트가 필요로
            하는 능력을 보여줄 뿐, 에이전트를 보여주지는 않는다(jay 지적, 2026-08-05). 능력과
            자율성은 다른 것이라, 가진 것만 정확히 이름 붙이고 빠진 것은 아래에 명시한다. */}
        <h2 style={{ marginTop: 32 }}>
          {t("에이전트를 위한 AA — 4가지 구성요소", "AA for agents — four building blocks")}
        </h2>
        <p className="sub">
          {t(
            "①은 위 세션 키 데모 — 아래 ②~④는 thirdweb의 ERC-4337 스마트 계정으로 시연합니다. 일반 지갑(EOA)이 자율 에이전트에게 줄 수 없는 네 가지 능력입니다.",
            "① is the session key demo above; ②–④ below run on thirdweb's ERC-4337 smart account. These are four things a plain wallet (EOA) cannot give an autonomous agent."
          )}
        </p>
        <LazyAgenticPillars clientId={process.env.THIRDWEB_CLIENT_ID ?? process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID ?? ""} />

        <h2 style={{ marginTop: 32 }}>{t("이 구성요소로 만드는 에이전트", "What an agent built on these would do")}</h2>
        <p className="sub" style={{ maxWidth: 620 }}>
          {t(
            "위 버튼은 전부 사람이 누릅니다 — 즉 이 페이지는 에이전트에게 필요한 능력을 보여줄 뿐, 에이전트 자체를 보여주지는 않습니다. 빠진 조각은 결정 루프입니다: 무엇을 언제 할지 스스로 정하고, 사람에게 매번 묻지 않는 것. 아래는 그 루프를 얹었을 때 각 구성요소가 실제로 하는 일입니다.",
            "Every button above is pressed by a human — so this page shows the capabilities an agent needs, not an agent. The missing piece is a decision loop: choosing what to do and when, without asking a person each time. Below is what each building block actually buys you once that loop exists."
          )}
        </p>
        <div style={{ marginTop: 12, display: "grid", gap: 12 }}>
          {AGENT_SCENARIOS.map((s) => (
            <div key={s.slug} className="panel" style={{ maxWidth: 620 }}>
              <strong>{t(s.titleKo, s.title)}</strong>
              <p className="sub" style={{ marginTop: 4, fontSize: 13 }}>
                {t(s.summaryKo, s.summary)}
              </p>
              <p className="sub" style={{ marginTop: 6, fontSize: 12 }}>
                {t("쓰이는 구성요소: ", "Blocks used: ")}
                {s.blocks}
                {" · "}
                <a href={`/live/aa/scenarios/${s.slug}`}>
                  {t("관계도와 순서도 보기 →", "See the diagrams →")}
                </a>
              </p>
            </div>
          ))}
        </div>

        <TechNotes cards={[AA_CARD]} lang={lang} />
      </main>
    </>
  );
}
