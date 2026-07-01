import Nav from "../Nav";
import BundleSubmit from "./BundleSubmit";
import RelayDashboard from "./RelayDashboard";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// Target IA: XYZ Demo (/xyz) — 고용주 데모. 설계: docs/features/xyz-demo.md
// C2 서처(번들 제출) + C4 관찰자(relay Data API) 대시보드.
export const dynamic = "force-dynamic";

export default function XyzPage() {
  const lang = getLang();
  return (
    <>
      <Nav />
      <main>
        <h1>{pick(lang, "XYZ 데모 — PBS 소비자 트랙", "XYZ Demo — PBS consumer track")}</h1>
        <p className="sub">
          {pick(
            lang,
            "Flashbots 인프라를 소비하는 두 트랙: C2 서처(번들 제출, Sepolia) · C4 관찰자(relay Data API, 메인넷). 설계: ",
            "Two tracks that consume Flashbots infra: C2 searcher (bundle submit, Sepolia) · C4 observer (relay Data API, mainnet). Design: "
          )}
          <code>docs/features/xyz-demo.md</code>
        </p>
        <BundleSubmit />
        <RelayDashboard />
      </main>
    </>
  );
}
