import Nav from "../Nav";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// Market (/market) — split out of "Portfolio & Market" (Jun-30 design §1). Public.
// 콘텐츠(Hyperliquid 오더북 + 지수)는 §3 / task 3에서 채운다.
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
            "준비 중 — Hyperliquid 오더북 + 주요 지수. 설계: ",
            "Coming soon — Hyperliquid orderbook + key indices. Design: "
          )}
          <code>docs/tasks/jun-30-rabbit-design.md §3</code>
        </p>
      </main>
    </>
  );
}
