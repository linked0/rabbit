import { NextResponse } from "next/server";
import { fetchIndexQuote, type IndexQuote } from "@/lib/market";

// 투자 요약 4종 (plan §4): ETH/BTC → CoinGecko, S&P 500/KOSPI → Yahoo
// 인증은 middleware가 보장.
export const dynamic = "force-dynamic";

async function fetchCrypto(): Promise<IndexQuote[]> {
  const url =
    "https://api.coingecko.com/api/v3/simple/price" +
    "?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true";
  const res = await fetch(url, {
    headers: { accept: "application/json" },
    next: { revalidate: 60 }, // 60초 캐시 (무료 API rate limit 보호)
  });
  if (!res.ok) throw new Error(`CoinGecko: HTTP ${res.status}`);
  const data = await res.json();

  const pick = (id: string, key: string, name: string): IndexQuote => {
    const coin = data?.[id];
    if (typeof coin?.usd !== "number") throw new Error(`CoinGecko: ${id} 없음`);
    return {
      key,
      name,
      price: coin.usd,
      changePct: coin.usd_24h_change ?? 0,
      currency: "USD",
    };
  };
  return [pick("bitcoin", "btc", "Bitcoin"), pick("ethereum", "eth", "Ethereum")];
}

export async function GET() {
  const results = await Promise.allSettled([
    fetchCrypto(),
    fetchIndexQuote("sp500", "^GSPC", "S&P 500"),
    fetchIndexQuote("kospi", "^KS11", "KOSPI"),
  ]);

  const quotes: IndexQuote[] = [];
  const errors: string[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") {
      quotes.push(...(Array.isArray(r.value) ? r.value : [r.value]));
    } else {
      errors.push(String(r.reason));
    }
  }
  // 카드 순서 고정: BTC, ETH, S&P 500, KOSPI
  const order = ["btc", "eth", "sp500", "kospi"];
  quotes.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));

  return NextResponse.json({ quotes, errors });
}
