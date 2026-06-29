import Nav from "../Nav";
import IndexCards from "./IndexCards";

// 로그인 후 기본 화면 (plan §4): ETH · BTC · S&P 500 · KOSPI 카드
export const dynamic = "force-dynamic";

export default function SummaryPage() {
  return (
    <>
      <Nav />
      <main>
        <h1>투자 요약</h1>
        <p className="sub">BTC · ETH · S&P 500 · KOSPI — 60초마다 자동 갱신</p>
        <IndexCards />
      </main>
    </>
  );
}
