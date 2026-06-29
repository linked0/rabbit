// 거래(Trade) 기록 → Current Portfolio 계산 (KRW 기준, compute-on-read)
// 설계: docs/tasks/jun-19-rabbit-design.md — Task 1

export type Side = "BUY" | "SELL";

// API로 주고받는 거래 1건 (Decimal은 number로 평탄화해서 전달)
export type TradeRow = {
  id: string;
  assetType: string; // CRYPTO | CASH | …
  market: string | null;
  symbol: string; // BTC, ETH, KRW(현금) …
  side: Side;
  quantity: number;
  price: number; // 단가 (KRW)
  fee: number | null;
  tradedAt: string; // ISO
  note: string | null;
};

// 종목별 현재 포지션
export type Position = {
  symbol: string;
  assetType: string;
  quantity: number; // 순보유 수량 (BUY - SELL)
  avgCost: number; // 평균 매수가 (KRW)
  currentPrice: number | null; // 현재가 (KRW), 시세 없으면 null
  marketValue: number | null; // 평가액 = quantity * currentPrice
  pnl: number | null; // 평가손익 = marketValue - quantity*avgCost
  pnlPct: number | null;
};

export type PortfolioTotals = {
  cost: number; // 총 매수원가
  marketValue: number; // 총 평가액 (시세 없는 종목은 원가로 대체)
  pnl: number;
  pnlPct: number;
};

// 현금(CASH/symbol=KRW)은 현재가 1로 고정. 그 외는 priceBySymbol에서 조회.
export function computePositions(
  trades: TradeRow[],
  priceBySymbol: Record<string, number>
): Position[] {
  type Acc = { assetType: string; buyQty: number; buyCost: number; sellQty: number };
  const bySymbol = new Map<string, Acc>();

  for (const t of trades) {
    const sym = t.symbol.toUpperCase();
    const acc =
      bySymbol.get(sym) ??
      { assetType: t.assetType, buyQty: 0, buyCost: 0, sellQty: 0 };
    if (t.side === "BUY") {
      acc.buyQty += t.quantity;
      acc.buyCost += t.quantity * t.price;
    } else {
      acc.sellQty += t.quantity;
    }
    bySymbol.set(sym, acc);
  }

  const positions: Position[] = [];
  for (const [symbol, acc] of bySymbol) {
    const quantity = acc.buyQty - acc.sellQty;
    const avgCost = acc.buyQty > 0 ? acc.buyCost / acc.buyQty : 0;
    const isCash = acc.assetType === "CASH" || symbol === "KRW";
    const currentPrice = isCash ? 1 : priceBySymbol[symbol] ?? null;
    const marketValue = currentPrice === null ? null : quantity * currentPrice;
    const costBasis = quantity * avgCost;
    const pnl = marketValue === null ? null : marketValue - costBasis;
    const pnlPct =
      marketValue === null || costBasis === 0 ? null : (pnl! / costBasis) * 100;
    positions.push({
      symbol,
      assetType: acc.assetType,
      quantity,
      avgCost,
      currentPrice,
      marketValue,
      pnl,
      pnlPct,
    });
  }

  // 보유 수량 0 이하(전량 매도)는 숨김. 현금(KRW)은 맨 위로.
  return positions
    .filter((p) => p.quantity > 0)
    .sort((a, b) => {
      if (a.symbol === "KRW") return -1;
      if (b.symbol === "KRW") return 1;
      return (b.marketValue ?? 0) - (a.marketValue ?? 0);
    });
}

export function computeTotals(positions: Position[]): PortfolioTotals {
  const cost = positions.reduce((s, p) => s + p.quantity * p.avgCost, 0);
  const marketValue = positions.reduce(
    (s, p) => s + (p.marketValue ?? p.quantity * p.avgCost),
    0
  );
  const pnl = marketValue - cost;
  const pnlPct = cost === 0 ? 0 : (pnl / cost) * 100;
  return { cost, marketValue, pnl, pnlPct };
}

export function fmtKRW(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString("ko-KR", { style: "currency", currency: "KRW", maximumFractionDigits: 0 });
}

export function fmtNum(n: number | null, digits = 8): string {
  if (n === null) return "—";
  return n.toLocaleString("en-US", { maximumFractionDigits: digits });
}

export function fmtPct(n: number | null): string {
  if (n === null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}
