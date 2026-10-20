import { NextResponse } from "next/server";
import { fetchIndexQuote, type IndexQuote } from "@/lib/market";
import { FEEDS, FEED_ORDER, type FeedSpec } from "@/lib/market-feeds";
import { latestPrices, priceAt, PythNotEntitled, pythConfigured, resolveFeedId } from "@/lib/pyth";

// 지수/시세 카드 — Pyth Hermes 1차, Yahoo 폴백 (2026-10-20, 그 전에는 CoinGecko + Yahoo).
// 카드 구성은 lib/market-feeds.ts, Pyth 호출은 lib/pyth.ts. 인증은 middleware 가 보장.
//
// 응답 모양은 그대로 둔다({ quotes, errors }) — IndexCards 가 그걸 읽는다. 필드만 늘었다:
//   publishTime  피드가 이 값을 발표한 시각(초). 장이 닫힌 시장은 여기서 멈춘다.
//   stale        marketHours 피드가 STALE_S 보다 오래됐다 = 장 마감(죽음이 아니다).
//   source       "pyth" | "yahoo" — 카드가 실제로 어디서 왔는지.
//   changePct    없을 수 있다. 전에는 `?? 0` 이라 못 구한 걸 0.00% 로 보여 줬다.
export const dynamic = "force-dynamic";

const STALE_S = 15 * 60;

async function viaPyth(specs: FeedSpec[]): Promise<{ quotes: IndexQuote[]; errors: string[] }> {
  const quotes: IndexQuote[] = [];
  const errors: string[] = [];

  const resolved = await Promise.all(
    specs.map(async (spec) => {
      try {
        const meta = await resolveFeedId(spec.pyth!);
        if (!meta) errors.push(`Pyth: ${spec.key} 심볼 미해석 (${spec.pyth!.join(", ")})`);
        return meta ? { spec, ...meta } : null;
      } catch (e) {
        errors.push(`Pyth: ${spec.key} ${String(e instanceof Error ? e.message : e)}`);
        return null;
      }
    })
  );
  const hits = resolved.filter((r): r is NonNullable<typeof r> => r !== null);
  if (!hits.length) return { quotes, errors };

  let prices: Awaited<ReturnType<typeof latestPrices>>;
  try {
    prices = await latestPrices(hits.map((h) => h.id));
  } catch (e) {
    if (e instanceof PythNotEntitled) {
      // 키는 유효하고 검색은 되는데 **가격 권한이 없다**. 플랜 문제이므로 한 줄만 남기고
      // 카드는 Yahoo 로 간다 — 피드 열 개에 같은 에러를 열 번 쌓지 않는다.
      return { quotes, errors: [...errors, e.message] };
    }
    throw e;
  }
  const dayAgo = Math.floor(Date.now() / 1000) - 24 * 60 * 60;
  const now = Math.floor(Date.now() / 1000);

  await Promise.all(
    hits.map(async ({ spec, id, symbol, isOpen }) => {
      const p = prices.get(id);
      if (!p) {
        errors.push(`Pyth: ${spec.key} 가격 없음`);
        return;
      }
      // 24h 변화율은 latest 응답에 없다 — Benchmarks 로 24시간 전 한 점을 받아 계산한다.
      // 못 받으면 changePct 를 비워 둔다(0% 로 꾸미지 않는다).
      const then = await priceAt(symbol, dayAgo);
      const changePct = then && then !== 0 ? ((p.price - then) / then) * 100 : undefined;
      quotes.push({
        key: spec.key,
        name: spec.name,
        nameEn: spec.nameEn,
        price: p.price,
        changePct,
        currency: spec.currency,
        publishTime: p.publishTime,
        // 장 개폐는 discovery 가 알려 준 is_open 을 먼저 믿고, 없으면 나이로 본다.
        stale: isOpen === false || (isOpen === undefined && Boolean(spec.marketHours) && now - p.publishTime > STALE_S),
        source: "pyth",
        symbol,
      });
    })
  );
  return { quotes, errors };
}

async function viaYahoo(spec: FeedSpec): Promise<IndexQuote> {
  const q = await fetchIndexQuote(spec.key, spec.yahoo!, spec.name);
  return { ...q, nameEn: spec.nameEn, source: "yahoo", currency: q.currency || spec.currency };
}

export async function GET() {
  const quotes: IndexQuote[] = [];
  const errors: string[] = [];

  const pythSpecs = FEEDS.filter((f) => f.pyth?.length);
  if (pythConfigured() && pythSpecs.length) {
    try {
      const r = await viaPyth(pythSpecs);
      quotes.push(...r.quotes);
      errors.push(...r.errors);
    } catch (e) {
      errors.push(`Pyth: ${String(e instanceof Error ? e.message : e)}`);
    }
  } else if (pythSpecs.length) {
    errors.push("Pyth: PYTH_API_KEY 미설정 — Yahoo 폴백만 사용");
  }

  // Pyth 로 못 채운 카드를 Yahoo 로 메운다 (Yahoo 심볼이 있는 것만).
  const got = new Set(quotes.map((q) => q.key));
  const fallbacks = FEEDS.filter((f) => !got.has(f.key) && f.yahoo);
  const settled = await Promise.allSettled(fallbacks.map(viaYahoo));
  settled.forEach((r, i) => {
    if (r.status === "fulfilled") quotes.push(r.value);
    else errors.push(`Yahoo: ${fallbacks[i].key} ${String(r.reason)}`);
  });

  quotes.sort((a, b) => FEED_ORDER.indexOf(a.key) - FEED_ORDER.indexOf(b.key));
  return NextResponse.json({ quotes, errors });
}
