import Nav from "../Nav";
import TradePanel from "./TradePanel";
import OrderBook from "./OrderBook";
import IndexCards from "../summary/IndexCards";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// Market (/market) — Hyperliquid ETH 퍼프 오더북 + 주요 지수 (Jun-30 design §3). Public.
// 오더북은 REST 폴링 1차 (WebSocket은 다음 단계), 지수 카드는 /summary의 IndexCards 재사용.
export const dynamic = "force-dynamic";

export default function MarketPage() {
  const lang = getLang();
  return (
    <>
      <Nav />
      <main>
        <h1>{pick(lang, "마켓 (Market)", "Market")}</h1>
        <p className="sub">
          {pick(
            lang,
            "Hyperliquid ETH 무기한 선물 오더북 + BTC · ETH · S&P 500 · KOSPI",
            "Hyperliquid ETH perp order book + BTC · ETH · S&P 500 · KOSPI"
          )}
        </p>
        <TradePanel coin="ETH" />
        <OrderBook coin="ETH" />
        <IndexCards />
      </main>
    </>
  );
}
