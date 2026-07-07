// Hyperliquid 퍼프 — Phase 1 "표시 전용" (키 불필요, 공개 info 엔드포인트)
// 설계: docs/tasks/jun-19-rabbit-design.md — Task 3
// 거래(Phase 2)는 서명 키가 필요하지만, 시세/포지션 조회는 공개 API로 충분.

// 기본은 메인넷 info(읽기 전용 시세). 거래(Phase 2)는 테스트넷 우선 — HL_API_URL로 전환.
const HL_INFO = (process.env.HL_API_URL?.trim() || "https://api.hyperliquid.xyz") + "/info";

async function hlPost<T>(body: unknown, revalidate = 15): Promise<T> {
  const res = await fetch(HL_INFO, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    next: { revalidate }, // 초 단위 캐시 (0 = 캐시 없음, 오더북 폴링용)
  });
  if (!res.ok) throw new Error(`Hyperliquid: HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export type PerpContext = {
  coin: string;
  markPx: number; // 마크 가격 (USD)
  midPx: number | null;
  funding: number | null; // 시간당 펀딩률
  openInterest: number | null;
  prevDayPx: number | null;
  dayChangePct: number | null;
};

// ETH-PERP 등 시장 컨텍스트 (인증 불필요)
export async function fetchPerpContext(coin = "ETH"): Promise<PerpContext> {
  const [meta, ctxs] = await hlPost<[{ universe: { name: string }[] }, any[]]>({
    type: "metaAndAssetCtxs",
  });
  const idx = meta.universe.findIndex((u) => u.name === coin);
  if (idx < 0) throw new Error(`coin ${coin} not found on Hyperliquid`);
  const c = ctxs[idx];
  const markPx = Number(c.markPx);
  const prevDayPx = c.prevDayPx != null ? Number(c.prevDayPx) : null;
  return {
    coin,
    markPx,
    midPx: c.midPx != null ? Number(c.midPx) : null,
    funding: c.funding != null ? Number(c.funding) : null,
    openInterest: c.openInterest != null ? Number(c.openInterest) : null,
    prevDayPx,
    dayChangePct: prevDayPx ? ((markPx - prevDayPx) / prevDayPx) * 100 : null,
  };
}

export type BookLevel = { px: number; sz: number };
export type L2Book = {
  coin: string;
  time: number; // HL 서버 타임스탬프 (ms)
  bids: BookLevel[];
  asks: BookLevel[];
};

// L2 오더북 스냅샷 — REST 폴링 1차 (Jun-30 design §3; WebSocket은 다음 단계).
// 응답 levels[0] = bids, levels[1] = asks (각각 { px, sz, n } 문자열).
export async function fetchL2Book(coin = "BTC", depth = 10): Promise<L2Book> {
  const raw = await hlPost<{
    coin: string;
    time: number;
    levels: { px: string; sz: string; n: number }[][];
  }>({ type: "l2Book", coin }, 0);
  const side = (levels?: { px: string; sz: string }[]) =>
    (levels ?? []).slice(0, depth).map((l) => ({ px: Number(l.px), sz: Number(l.sz) }));
  return {
    coin: raw.coin,
    time: raw.time,
    bids: side(raw.levels?.[0]),
    asks: side(raw.levels?.[1]),
  };
}

export type PerpPosition = {
  coin: string;
  szi: number; // 부호 있는 수량 (+롱 / -숏)
  entryPx: number | null;
  positionValue: number | null;
  unrealizedPnl: number | null;
  leverage: number | null;
};

export type UserState = {
  accountValue: number | null;
  positions: PerpPosition[];
};

// 공개 지갑 주소로 포지션 조회 — 주소만 필요(서명 키 X). Phase 1에서 선택적.
export async function fetchUserState(address: string): Promise<UserState> {
  const s = await hlPost<any>({ type: "clearinghouseState", user: address });
  const positions: PerpPosition[] = (s.assetPositions ?? []).map((ap: any) => {
    const p = ap.position;
    return {
      coin: p.coin,
      szi: Number(p.szi),
      entryPx: p.entryPx != null ? Number(p.entryPx) : null,
      positionValue: p.positionValue != null ? Number(p.positionValue) : null,
      unrealizedPnl: p.unrealizedPnl != null ? Number(p.unrealizedPnl) : null,
      leverage: p.leverage?.value != null ? Number(p.leverage.value) : null,
    };
  });
  return {
    accountValue:
      s.marginSummary?.accountValue != null ? Number(s.marginSummary.accountValue) : null,
    positions,
  };
}
