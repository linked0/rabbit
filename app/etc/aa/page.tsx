import Nav from "../../Nav";
import TechNotes from "../../TechNotes";
import TechNotesLink from "../../TechNotesLink";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { LazySessionKeyDemo, LazyAgenticPillars } from "./LazyAA";
import { POC_CARDS } from "@/lib/poc-cards";

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
        <h1>{t("AA — 위임형 계정 & 세션 키", "AA — Delegatable Accounts & Session Keys")}</h1>
        <p className="sub">
          {t(
            "ERC-7702(위임형 스마트 계정) + ERC-7715(세션 키) 데모 — MetaMask Delegation Toolkit, Sepolia. 실제 자금은 사용되지 않습니다.",
            "An ERC-7702 (delegatable smart account) + ERC-7715 (session key) demo — MetaMask Delegation Toolkit, on Sepolia. No real funds involved."
          )}
        </p>
        <TechNotesLink lang={lang} />
        <LazySessionKeyDemo />

        <h2 style={{ marginTop: 32 }}>{t("Agentic AA — 4대 요소", "Agentic AA — 4 pillars")}</h2>
        <p className="sub">
          {t(
            "①은 위 세션 키 데모 — 아래는 ②~④, thirdweb의 ERC-4337 스마트 계정으로 시연합니다.",
            "① is the session key demo above — ②–④ below are demonstrated via thirdweb's ERC-4337 smart account."
          )}
        </p>
        <LazyAgenticPillars />

        <TechNotes cards={[AA_CARD]} lang={lang} />
      </main>
    </>
  );
}
