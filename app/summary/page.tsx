import Nav from "../Nav";
import IndexCards from "./IndexCards";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// 로그인 후 기본 화면 (plan §4): ETH · BTC · S&P 500 · KOSPI 카드
export const dynamic = "force-dynamic";

export default function SummaryPage() {
  const lang = getLang();
  return (
    <>
      <Nav />
      <main>
        <h1>{pick(lang, "투자 요약", "Investment Summary")}</h1>
        <p className="sub">
          {pick(lang, "BTC · ETH · S&P 500 · KOSPI — 60초마다 자동 갱신", "BTC · ETH · S&P 500 · KOSPI — auto-refresh every 60s")}
        </p>
        <IndexCards />
      </main>
    </>
  );
}
