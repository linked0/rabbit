// 코인 심볼 ↔ CoinGecko id 매핑 + 포트폴리오 계산 헬퍼 (PoC)

// CoinGecko의 simple/price API는 심볼이 아니라 "id"(예: bitcoin)를 쓴다.
// 자주 쓰는 코인만 매핑. 없으면 입력값을 소문자로 fallback(= CoinGecko id 직접 입력 가능).
export const SYMBOL_TO_ID: Record<string, string> = {
  BTC: "bitcoin",
  ETH: "ethereum",
  SOL: "solana",
  XRP: "ripple",
  ADA: "cardano",
  DOGE: "dogecoin",
  AVAX: "avalanche-2",
  MATIC: "matic-network",
  DOT: "polkadot",
  LINK: "chainlink",
  UNI: "uniswap",
  LTC: "litecoin",
  BCH: "bitcoin-cash",
  ATOM: "cosmos",
  ARB: "arbitrum",
  OP: "optimism",
  TRX: "tron",
  BNB: "binancecoin",
  USDT: "tether",
  USDC: "usd-coin",
};

export function symbolToId(symbol: string): string {
  const s = symbol.trim();
  return SYMBOL_TO_ID[s.toUpperCase()] ?? s.toLowerCase();
}

// 한 종목(보유 코인)
export type Holding = {
  symbol: string; // BTC
  quantity: number; // 0.5
  avgBuyPrice: number; // 평균 매수가 (USD)
  buyDate?: string; // YYYY-MM-DD (선택)
};

// 현재가가 적용된 종목별 계산 결과
export type HoldingResult = Holding & {
  id: string;
  currentPrice: number | null; // 시세 없으면 null
  cost: number; // 매수 원가 = quantity * avgBuyPrice
  value: number | null; // 평가액 = quantity * currentPrice
  pnl: number | null; // 평가손익 = value - cost
  pnlPct: number | null; // 수익률 %
};

export function computeHolding(
  h: Holding,
  priceById: Record<string, number>
): HoldingResult {
  const id = symbolToId(h.symbol);
  const currentPrice = priceById[id] ?? null;
  const cost = h.quantity * h.avgBuyPrice;
  const value = currentPrice === null ? null : h.quantity * currentPrice;
  const pnl = value === null ? null : value - cost;
  const pnlPct = value === null || cost === 0 ? null : (pnl! / cost) * 100;
  return { ...h, id, currentPrice, cost, value, pnl, pnlPct };
}

export type PortfolioTotals = {
  cost: number;
  value: number;
  pnl: number;
  pnlPct: number;
};

export function computeTotals(rows: HoldingResult[]): PortfolioTotals {
  const cost = rows.reduce((s, r) => s + r.cost, 0);
  // 시세 없는 종목은 평가액을 원가로 대체(보수적)
  const value = rows.reduce((s, r) => s + (r.value ?? r.cost), 0);
  const pnl = value - cost;
  const pnlPct = cost === 0 ? 0 : (pnl / cost) * 100;
  return { cost, value, pnl, pnlPct };
}

// 단순 시나리오 전망: 현재 평가액에 연 성장률 g(%)를 적용한 1년 후 추정액
export function projectOneYear(value: number, growthPct: number): number {
  return value * (1 + growthPct / 100);
}

export function fmtUSD(n: number | null): string {
  if (n === null) return "—";
  return n.toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export function fmtPct(n: number | null): string {
  if (n === null) return "—";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n.toFixed(2)}%`;
}
