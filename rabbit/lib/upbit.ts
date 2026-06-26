// Upbit 공개 시세 — KRW 마켓 현재가 (API 키 불필요, KRW 네이티브)
// GET https://api.upbit.com/v1/ticker?markets=KRW-BTC,KRW-ETH
// 설계 결정: base currency = KRW → 1순위 가격 피드는 Upbit (docs/tasks/jun-19-rabbit-design.md)

type UpbitTicker = { market: string; trade_price: number };

// 심볼 배열 → { BTC: 95000000, ETH: 5000000 } (KRW). 현금(KRW)·미상장 심볼은 제외.
export async function fetchKrwPrices(
  symbols: string[]
): Promise<Record<string, number>> {
  const uniq = Array.from(
    new Set(
      symbols
        .map((s) => s.trim().toUpperCase())
        .filter((s) => s && s !== "KRW")
    )
  );
  if (uniq.length === 0) return {};

  const markets = uniq.map((s) => `KRW-${s}`).join(",");
  const url = `https://api.upbit.com/v1/ticker?markets=${encodeURIComponent(markets)}`;

  // Upbit은 markets 중 하나라도 미상장이면 요청 전체가 404. v1에서는 실패 시
  // 가격을 비워(null) 두고 UI가 "—"로 표시하도록 throw 없이 {}를 반환한다.
  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      next: { revalidate: 60 }, // 60초 캐시 (rate limit 보호)
    });
    if (!res.ok) return {};
    const data = (await res.json()) as UpbitTicker[];
    const out: Record<string, number> = {};
    for (const t of data) {
      const sym = t.market.replace(/^KRW-/, "");
      if (typeof t.trade_price === "number") out[sym] = t.trade_price;
    }
    return out;
  } catch {
    return {};
  }
}
