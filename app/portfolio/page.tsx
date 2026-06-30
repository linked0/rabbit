import Nav from "../Nav";

// Portfolio (/portfolio) — 스텁(로그인 전용). Market은 /market 으로 분리 (Jun-30 design §1).
// 추후 /dashboard(holdings·P&L)를 이 라우트로 병합.
export default function PortfolioPage() {
  return (
    <>
      <Nav />
      <main>
        <h1>포트폴리오 (Portfolio)</h1>
        <p className="sub">준비 중 — 곧 제공됩니다. 설계: <code>docs/features/portfolio-and-market.md</code></p>
      </main>
    </>
  );
}
