import Nav from "../Nav";
import BundleSubmit from "./BundleSubmit";
import RelayDashboard from "./RelayDashboard";

// Target IA: XYZ Demo (/xyz) — 고용주 데모. 설계: docs/features/xyz-demo.md
// C2 서처(번들 제출) + C4 관찰자(relay Data API) 대시보드.
export const dynamic = "force-dynamic";

export default function XyzPage() {
  return (
    <>
      <Nav />
      <main>
        <h1>XYZ 데모 — PBS 소비자 트랙</h1>
        <p className="sub">
          Flashbots 인프라를 <b>소비</b>하는 두 트랙: <b>C2 서처</b>(번들 제출, Sepolia) ·{" "}
          <b>C4 관찰자</b>(relay Data API, 메인넷). 설계: <code>docs/features/xyz-demo.md</code>
        </p>
        <BundleSubmit />
        <RelayDashboard />
      </main>
    </>
  );
}
