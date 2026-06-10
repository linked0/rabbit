// 지수 시세 조회 — Yahoo Finance chart API (키 불필요)
// Alpha Vantage 무료 티어는 지수(^GSPC/^KS11) 미지원 + 25회/일 제한이라 Yahoo 사용.
// (MARKET_API_KEY는 유료 프로바이더로 바꿀 때를 위해 env에 유지)
export type IndexQuote = {
  key: string;
  name: string;
  price: number;
  changePct: number; // 전일 종가 대비 %
  currency: string;
};

export async function fetchIndexQuote(
  key: string,
  symbol: string,
  name: string
): Promise<IndexQuote> {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}` +
    `?range=1d&interval=1d`;
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" }, // UA 없으면 차단됨
    next: { revalidate: 60 }, // 60초 캐시 (rate limit 보호)
  });
  if (!res.ok) throw new Error(`Yahoo ${symbol}: HTTP ${res.status}`);

  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  const price = meta?.regularMarketPrice;
  const prev = meta?.previousClose ?? meta?.chartPreviousClose;
  if (typeof price !== "number" || typeof prev !== "number" || prev === 0) {
    throw new Error(`Yahoo ${symbol}: 응답 형식 오류`);
  }
  return {
    key,
    name,
    price,
    changePct: ((price - prev) / prev) * 100,
    currency: meta?.currency ?? "",
  };
}
