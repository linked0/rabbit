import Nav from "../Nav";

// Target IA: ETC (/etc) — 사소한 실험 모음 스텁. 설계: docs/features/etc.md
export default function EtcPage() {
  return (
    <>
      <Nav />
      <main>
        <h1>ETC (잡다한 실험)</h1>
        <p className="sub">준비 중 — 작은 실험들의 자리. 첫 항목: SimpleX Chat 테스트. 설계: <code>docs/features/etc.md</code></p>
      </main>
    </>
  );
}
