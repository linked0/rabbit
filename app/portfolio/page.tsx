import Nav from "../Nav";

// Target IA: Portfolio & Market (/portfolio) — 스텁(로그인 전용). 설계: docs/features/portfolio-and-market.md
// 추후 /summary(Market) + /dashboard(Portfolio)를 이 라우트로 병합 (로드맵 P2·S5).
export default function PortfolioPage() {
  return (
    <>
      <Nav />
      <main>
        <h1>포트폴리오·마켓 (Portfolio &amp; Market)</h1>
        <p className="sub">준비 중 — 곧 제공됩니다. 설계: <code>docs/features/portfolio-and-market.md</code></p>
      </main>
    </>
  );
}
