import Nav from "../Nav";
import BackLink from "../BackLink";
import BundleSubmit from "./BundleSubmit";
import RelayDashboard from "./RelayDashboard";
import TechNotes from "../TechNotes";
import TechNotesLink from "../TechNotesLink";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";
import { POC_CARDS } from "@/lib/poc-cards";

const PBS_CARD = POC_CARDS.find((c) => c.key === "pbs")!;

// Target IA: XYZ Demo (/xyz) — 고용주 데모. 설계: docs/features/xyz-demo.md
// C2 서처(번들 제출) + C4 관찰자(relay Data API) 대시보드.
export const dynamic = "force-dynamic";

export default function XyzPage() {
  const lang = getLang();
  return (
    <>
      <Nav />
      <main>
        <BackLink lang={lang} />
        <h1>{pick(lang, "PBS 소비자 트랙", "PBS consumer track")}</h1>
        <p className="sub">
          {pick(
            lang,
            "Flashbots 인프라를 소비하는 두 트랙: C2 서처(번들 제출, Sepolia) · C4 관찰자(relay Data API, 메인넷). 설계: ",
            "Two tracks that consume Flashbots infra: C2 searcher (bundle submit, Sepolia) · C4 observer (relay Data API, mainnet). Design: "
          )}
          <code>docs/features/xyz-demo.md</code>
        </p>
        <TechNotesLink lang={lang} />
        <BundleSubmit />
        <RelayDashboard />

        <TechNotes cards={[PBS_CARD]} lang={lang} />
      </main>
    </>
  );
}
