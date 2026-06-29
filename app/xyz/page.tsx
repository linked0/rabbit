import Nav from "../Nav";

// Target IA: XYZ Demo (/xyz) — 스텁(고용주 데모). 설계: docs/features/xyz-demo.md
export default function XyzPage() {
  return (
    <>
      <Nav />
      <main>
        <h1>XYZ 데모 (trade[XYZ] / Unit Labs)</h1>
        <p className="sub">준비 중 — 곧 제공됩니다. 설계: <code>docs/features/xyz-demo.md</code></p>
      </main>
    </>
  );
}
