// Pyth Hermes 클라이언트 — 지수/시세 카드의 Pyth 쪽 소스.
//
// 2026-08-26 16:00 UTC 의 Pyth Core 업그레이드로 Hermes 는 **인증이 필요**해졌다.
//   - 베이스 URL: hermes.pyth.network → pyth.dourolabs.app/hermes (drop-in, 경로·응답 동일)
//   - 헤더: Authorization: Bearer $PYTH_API_KEY   (키는 Pyth Terminal, pythdata.app)
// 키는 **서버에만** 둔다. NEXT_PUBLIC_ 로 내보내면 번들에 박혀 모든 방문자에게 노출되고
// 쿼터·과금이 그대로 털린다 — verex 와 같은 규칙(서버가 들고, 클라이언트는 /api 를 본다).
//
// 피드 id 를 하드코딩하지 않는 이유: Pyth 는 Stable / Beta 채널에서 **같은 피드에 다른 id**
// 를 줄 수 있다. 그래서 심볼("Crypto.BTC/USD")로 선언하고 런타임에 id 를 한 번 해석해
// 모듈 메모리에 캐시한다. 심볼이 안 풀리면 그 카드만 errors 로 빠지고 나머지는 살아 있다.

const BASE = process.env.PYTH_HERMES_URL ?? "https://pyth.dourolabs.app/hermes";

export class PythNotConfigured extends Error {
  constructor() {
    super("PYTH_API_KEY 가 없다 (.env.local 에 서버 전용으로 넣을 것)");
    this.name = "PythNotConfigured";
  }
}

function authHeaders(): HeadersInit {
  const key = process.env.PYTH_API_KEY;
  if (!key) throw new PythNotConfigured();
  return { accept: "application/json", authorization: `Bearer ${key}` };
}

export function pythConfigured(): boolean {
  return Boolean(process.env.PYTH_API_KEY);
}

export class PythNotEntitled extends Error {
  constructor(detail: string) {
    super(`Pyth: 플랜에 이 피드 권한이 없다 — ${detail}`);
    this.name = "PythNotEntitled";
  }
}

async function hermes(path: string, revalidate = 60): Promise<any> {
  const res = await fetch(`${BASE}${path}`, {
    headers: authHeaders(),
    next: { revalidate },
  });
  // 에러 본문이 JSON 이 아니다 — 권한 거부는 평문으로 온다
  // ("Not entitled: feed <id> (no grant accepts this feed (asset type 'crypto', …))").
  // 그래서 res.json() 을 먼저 부르면 SyntaxError 로 터진다. 항상 text 로 먼저 읽는다.
  if (!res.ok) {
    const body = (await res.text().catch(() => "")).slice(0, 300);
    if (res.status === 403 && body.includes("Not entitled")) throw new PythNotEntitled(body);
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Pyth: 인증 거부 (HTTP ${res.status}) ${body}`);
    }
    if (res.status === 429) throw new Error("Pyth: rate limit (HTTP 429)");
    throw new Error(`Pyth: HTTP ${res.status} ${body}`);
  }
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Pyth: JSON 아님 — ${text.slice(0, 200)}`);
  }
}

// ---------------------------------------------------------------- 심볼 → 피드 id

type FeedMeta = { id: string; symbol: string; isOpen?: boolean };
const idCache = new Map<string, FeedMeta>(); // symbol(소문자) → 메타

/** 심볼 후보를 순서대로 조회해 처음 해석되는 것의 id 를 준다. 없으면 null. */
export async function resolveFeedId(candidates: string[]): Promise<FeedMeta | null> {
  for (const symbol of candidates) {
    const cached = idCache.get(symbol.toLowerCase());
    if (cached) return cached;
  }
  for (const symbol of candidates) {
    // query 는 부분 일치다. 정확히 같은 심볼만 받아들인다 (BTC 질의에 BTC/USDT 가 섞여 온다).
    const list: FeedMeta[] = await hermes(
      `/v2/price_feeds?query=${encodeURIComponent(symbol)}`,
      60 * 60 * 24 // id 는 거의 안 바뀐다 — 하루 캐시
    ).then((rows) =>
      (Array.isArray(rows) ? rows : []).map((r: any) => ({
        id: String(r?.id ?? ""),
        symbol: String(r?.attributes?.symbol ?? ""),
        // discovery 응답이 장 개폐를 직접 알려 준다 — 나이로 추측하지 않는다.
        isOpen: typeof r?.market_hours?.is_open === "boolean" ? r.market_hours.is_open : undefined,
      }))
    );
    const hit = list.find((f) => f.symbol.toLowerCase() === symbol.toLowerCase() && f.id);
    if (hit) {
      idCache.set(symbol.toLowerCase(), hit);
      return hit;
    }
  }
  return null;
}

/** 키로 볼 수 있는 피드를 심볼 부분 일치로 찾는다 — scripts/pyth-feeds.mjs 가 쓴다. */
export async function searchFeeds(query: string): Promise<FeedMeta[]> {
  const rows = await hermes(`/v2/price_feeds?query=${encodeURIComponent(query)}`, 0);
  return (Array.isArray(rows) ? rows : []).map((r: any) => ({
    id: String(r?.id ?? ""),
    symbol: String(r?.attributes?.symbol ?? ""),
  }));
}

// ---------------------------------------------------------------- 최신 가격

export type PythPrice = {
  id: string;
  price: number;
  publishTime: number; // unix seconds
};

/** price × 10^expo. Hermes 는 정수 + 지수로 준다 (부동소수점 누적오차 피하려고). */
function decode(p: { price: string | number; expo: number }): number {
  return Number(p.price) * Math.pow(10, p.expo);
}

export async function latestPrices(ids: string[]): Promise<Map<string, PythPrice>> {
  const out = new Map<string, PythPrice>();
  if (!ids.length) return out;
  const qs = ids.map((id) => `ids[]=${encodeURIComponent(id)}`).join("&");
  const data = await hermes(`/v2/updates/price/latest?${qs}&parsed=true`, 60);
  for (const row of data?.parsed ?? []) {
    const p = row?.price;
    if (!row?.id || typeof p?.expo !== "number" || p?.price === undefined) continue;
    out.set(String(row.id), {
      id: String(row.id),
      price: decode(p),
      publishTime: Number(p.publish_time ?? 0),
    });
  }
  return out;
}

// ------------------------------------------------- 24h 전 가격 (Benchmarks)
//
// Hermes 의 latest 응답에는 24h 변화율이 없다 — 현재가뿐이다. 변화율을 쓰려면 과거
// 한 점이 필요하고, 그건 Benchmarks(별 서비스)에 있다. 실패하면 **0% 로 꾸미지 않고**
// change 를 비워 둔다 (전에는 `?? 0` 이라 장이 닫혀도 0.00% 로 보였다).

const BENCH = process.env.PYTH_BENCHMARKS_URL ?? "https://benchmarks.pyth.network";

export async function priceAt(symbol: string, unixSeconds: number): Promise<number | null> {
  try {
    const res = await fetch(
      `${BENCH}/v1/updates/price/${unixSeconds}?ids[]=${encodeURIComponent(symbol)}&parsed=true`,
      { headers: authHeaders(), next: { revalidate: 60 * 10 } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const p = data?.parsed?.[0]?.price;
    if (typeof p?.expo !== "number" || p?.price === undefined) return null;
    return decode(p);
  } catch {
    return null;
  }
}
