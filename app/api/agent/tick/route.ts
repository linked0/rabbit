import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { agentAddress } from "@/lib/agent-wallet";
import { verex, placeSignedLimitOrder } from "@/lib/verex-client";
import { estimate } from "@/lib/agent-estimate";
import { redeemMandate, simulateMandateDraw } from "@/lib/delegation";
import type { Delegation } from "@metamask/smart-accounts-kit";
import type { TickVerdict } from "@prisma/client";

export const dynamic = "force-dynamic";

// J2 / R-C — 틱 하나. observe → estimate → decide → act → record.
//
// **두 번 연달아 불러도 안전해야 한다.** 스케줄러(R-F)가 붙기 전에 curl 로
// 검증하는 게이트가 그것이고, 안전을 보장하는 것은 쿨다운이다.
//
// **skip 도 반드시 기록한다.** 하지 않은 일은 체인에 없으므로, 저널이 유일한
// 기록이다. 그리고 거절 사유 여섯 갈래는 서로 구별돼야 한다 — 특히
// 예산 소진과 만료는 **다른 경계가 작동한 것**이다.

const DEFAULTS = {
  /// 행동 사이 최소 간격(초). 데모에서는 짧게 줄여 테스트한다.
  cooldownSec: 3600,
  /// |p − 체결가| 최소 edge. 퍼센트포인트가 아니라 확률 단위(0.05 = 5pp).
  edgeThreshold: 0.05,
  /// 한 번에 걸 명목 금액(USDC).
  sizeUsdc: 2.5,
  /// 추정이 볼 뉴스의 발행 기준 시간창.
  newsWithinHours: 48,
};

type Settings = Partial<typeof DEFAULTS> & { marketSlug: string; outcome?: string };

async function record(args: {
  mandateId: string | null;
  marketSlug: string;
  outcome: string;
  bestBid: number | null;
  bestAsk: number | null;
  p: number | null;
  rationale: string | null;
  citedNewsIds: string[];
  verdict: TickVerdict;
  reason: string;
  verexOrderId?: string | null;
  spentUsdc?: number;
  budgetLeftUsdc?: number | null;
}) {
  return prisma.agentTick.create({
    data: {
      mandateId: args.mandateId,
      marketSlug: args.marketSlug,
      outcome: args.outcome,
      bestBid: args.bestBid,
      bestAsk: args.bestAsk,
      p: args.p,
      rationale: args.rationale,
      citedNewsIds: args.citedNewsIds,
      verdict: args.verdict,
      reason: args.reason,
      verexOrderId: args.verexOrderId ?? null,
      spentUsdc: args.spentUsdc ?? 0,
      budgetLeftUsdc: args.budgetLeftUsdc ?? null,
    },
  });
}

// POST /api/agent/tick  { marketSlug, outcome?, cooldownSec?, edgeThreshold?, sizeUsdc? }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const s = { ...DEFAULTS, ...((await req.json().catch(() => ({}))) as Settings) };
  if (!s.marketSlug) return NextResponse.json({ error: "marketSlug is required" }, { status: 400 });
  const outcome = s.outcome ?? "Yes";

  const mandate = await prisma.mandate.findFirst({
    where: { agent: agentAddress(), revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!mandate) {
    return NextResponse.json({ error: "no active mandate — grant one first" }, { status: 400 });
  }

  const cap = Number(mandate.capUsdc);
  const drawn = Number(mandate.drawnUsdc);
  const budgetLeft = Number((cap - drawn).toFixed(6));
  const base = { mandateId: mandate.id, marketSlug: s.marketSlug, outcome, citedNewsIds: [] as string[] };

  const delegation = mandate.delegation as unknown as Delegation | null;

  // ── 1. 만료. 계획서의 money shot — 아무도 취소하지 않았고 창이 닫혔을 뿐이다.
  //
  // DB 의 만료 시각만 보고 "체인이 거절했다"고 적으면 그건 거짓말이다: 묻지도
  // 않았으니까. 위임이 온체인이면 **실제로 물어본다**(시뮬레이션이라 가스 0),
  // 그리고 TimestampEnforcer 가 낸 이유를 그대로 저널에 적는다. 온체인 위임이
  // 없으면 그 사실이 문장에 드러나야 한다 — 근거 없는 주장 대신.
  if (mandate.expiresAt.getTime() <= Date.now()) {
    let reason = `mandate expired at ${mandate.expiresAt.toISOString()} — recorded from the DB mirror (no on-chain delegation to ask)`;
    if (delegation) {
      const cfg = await verex.config().catch(() => null);
      if (cfg?.usdc) {
        const probe = await simulateMandateDraw({
          delegation,
          usdc: cfg.usdc,
          amountUsdc: Math.min(s.sizeUsdc, Math.max(budgetLeft, 0.000001)),
        });
        reason = probe.ok
          ? `mandate expired at ${mandate.expiresAt.toISOString()} but the chain still allows a draw — block time trails the wall clock`
          : `mandate expired at ${mandate.expiresAt.toISOString()} → chain refused the draw: ${probe.reason}`;
      }
    }
    const tick = await record({
      ...base, bestBid: null, bestAsk: null, p: null, rationale: null,
      verdict: "SKIP_EXPIRED",
      reason,
      budgetLeftUsdc: budgetLeft,
    });
    return NextResponse.json({ tick });
  }

  // ── 2. 예산 소진. 만료와 **다른 경계**이고 다르게 읽혀야 한다.
  if (budgetLeft <= 0) {
    const tick = await record({
      ...base, bestBid: null, bestAsk: null, p: null, rationale: null,
      verdict: "SKIP_EXHAUSTED",
      reason: `budget fully drawn (${drawn.toFixed(2)} / ${cap.toFixed(2)} USDC) → no action`,
      budgetLeftUsdc: 0,
    });
    return NextResponse.json({ tick });
  }

  // ── 3. 쿨다운. "두 번 연달아 불러도 안전"을 보장하는 것이 이 검사다.
  const lastAction = await prisma.agentTick.findFirst({
    where: { mandateId: mandate.id, verdict: "TRADED" },
    orderBy: { createdAt: "desc" },
  });
  if (lastAction) {
    const elapsed = (Date.now() - lastAction.createdAt.getTime()) / 1000;
    if (elapsed < s.cooldownSec) {
      const left = Math.ceil(s.cooldownSec - elapsed);
      const tick = await record({
        ...base, bestBid: null, bestAsk: null, p: null, rationale: null,
        verdict: "SKIP_COOLDOWN",
        reason: `cooldown ${left}s remaining → no action`,
        budgetLeftUsdc: budgetLeft,
      });
      return NextResponse.json({ tick });
    }
  }

  // ── 4. 관측.
  const market = await verex.market(s.marketSlug);
  const book = await verex.book(s.marketSlug, outcome);
  const bestBid = book.bids[0]?.price ?? null;
  const bestAsk = book.asks[0]?.price ?? null;

  // ── 5. 추정. 뉴스가 없으면 부르지 않는다 — 순수 사전확률은 호가보다 나을 근거가 없다.
  const est = await estimate({
    marketSlug: s.marketSlug,
    question: market.title,
    withinHours: s.newsWithinHours,
  });
  if (!est) {
    const tick = await record({
      ...base, bestBid, bestAsk, p: null, rationale: null,
      verdict: "SKIP_NO_ESTIMATE",
      reason: `no news within ${s.newsWithinHours}h → estimate not called`,
      budgetLeftUsdc: budgetLeft,
    });
    return NextResponse.json({ tick });
  }

  // ── 6. 판정. edge 는 **체결되는 쪽 가격**에 대해 잰다 — 중간값 기준이면
  //     스프레드 절반만큼 체계적으로 과대평가된다.
  const buying = est.p > (bestAsk ?? 1);
  const executable = buying ? bestAsk : bestBid;
  if (executable === null) {
    const tick = await record({
      ...base, bestBid, bestAsk, p: est.p, rationale: est.rationale, citedNewsIds: est.citedNewsIds,
      verdict: "SKIP_EDGE",
      reason: `no ${buying ? "ask" : "bid"} to trade against → no action`,
      budgetLeftUsdc: budgetLeft,
    });
    return NextResponse.json({ tick });
  }
  const edge = Math.abs(est.p - executable);
  if (edge < s.edgeThreshold) {
    const tick = await record({
      ...base, bestBid, bestAsk, p: est.p, rationale: est.rationale, citedNewsIds: est.citedNewsIds,
      verdict: "SKIP_EDGE",
      reason: `book ${executable.toFixed(2)}, model ${est.p.toFixed(2)}, edge ${edge.toFixed(2)} < ${s.edgeThreshold} → no action`,
      budgetLeftUsdc: budgetLeft,
    });
    return NextResponse.json({ tick });
  }

  // ── 7. 규모. 남은 예산을 넘으면 하지 않는다 — 줄이지 않는 이유는, 줄이면
  //     "왜 이 크기였나"가 저널에서 사라지기 때문이다.
  const notional = s.sizeUsdc;
  if (notional > budgetLeft) {
    const tick = await record({
      ...base, bestBid, bestAsk, p: est.p, rationale: est.rationale, citedNewsIds: est.citedNewsIds,
      verdict: "SKIP_BUDGET",
      reason: `notional ${notional.toFixed(2)} > ${budgetLeft.toFixed(2)} remaining → no action`,
      budgetLeftUsdc: budgetLeft,
    });
    return NextResponse.json({ tick });
  }

  // ── 8. 실행. 지정가로만 낸다 — 시장가는 최악 조건 서명이 필요하고, 그 경계를
  //     고르는 것은 이쪽의 슬리피지 정책이다.
  const side = buying ? "BUY" : "SELL";
  const price = executable;
  const size = Number((notional / price).toFixed(6));
  const target = market.outcomes.find((o) => o.label === outcome);
  if (!target) return NextResponse.json({ error: `outcome ${outcome} not found` }, { status: 400 });

  // 위임 행사가 **먼저**다. 여기가 강제 지점이다 — 상한을 넘거나 만료 뒤면
  // enforcer 가 revert 시킨다. 주문을 먼저 냈다가 인출이 막히면 verex 에 정산할 수
  // 없는 호가만 남는다(verex 계획서 W6.5 와 같은 실패 모양).
  let drawTxHash: string | null = null;
  if (delegation && side === "BUY") {
    const cfg = await verex.config();
    if (!cfg.usdc) return NextResponse.json({ error: "verex has no USDC address" }, { status: 503 });
    try {
      drawTxHash = await redeemMandate({ delegation, usdc: cfg.usdc, amountUsdc: notional });
    } catch (e) {
      // 체인이 거절했다면 그것이 결과다. 저널에 남기고 조용히 넘어가지 않는다.
      const tick = await record({
        ...base, bestBid, bestAsk, p: est.p, rationale: est.rationale, citedNewsIds: est.citedNewsIds,
        verdict: "SKIP_BUDGET",
        reason: `draw of ${notional.toFixed(2)} refused on-chain: ${String(e instanceof Error ? e.message : e).slice(0, 180)}`,
        budgetLeftUsdc: budgetLeft,
      });
      return NextResponse.json({ tick }, { status: 200 });
    }
  }

  const placed = await placeSignedLimitOrder({
    slug: s.marketSlug, outcome, tokenId: target.tokenId, side, size, price,
  });

  const spent = placed.totalUsdc;
  await prisma.mandate.update({
    where: { id: mandate.id },
    data: { drawnUsdc: { increment: spent } },
  });
  const tick = await record({
    ...base, bestBid, bestAsk, p: est.p, rationale: est.rationale, citedNewsIds: est.citedNewsIds,
    verdict: "TRADED",
    reason:
      `book ${price.toFixed(2)}, model ${est.p.toFixed(2)}, edge ${edge.toFixed(2)} ≥ ${s.edgeThreshold} → ${side} ${size.toFixed(2)} ${outcome}` +
      (drawTxHash ? ` (drawn on-chain ${drawTxHash.slice(0, 10)}…)` : " (no on-chain delegation — DB budget only)"),
    verexOrderId: placed.orderId,
    spentUsdc: spent,
    budgetLeftUsdc: Number((budgetLeft - spent).toFixed(6)),
  });
  return NextResponse.json({ tick, placed });
}

// GET /api/agent/tick — 저널 (최신순). skip 이 기본으로 보여야 한다.
//
// 인용한 뉴스 id 를 **헤드라인과 출처로 되돌려** 함께 보낸다. R-E 의 요구가
// "resolvable to headline + source"인 이유는, id 목록만 보이는 저널은 감사할 수
// 없기 때문이다. 삭제된 항목은 조용히 빠지는 게 아니라 `missing` 으로 남는다 —
// "인용한 증거가 사라졌다"는 사실 자체가 기록되어야 한다.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "50"), 200);
  const ticks = await prisma.agentTick.findMany({ orderBy: { createdAt: "desc" }, take: limit });

  const ids = [...new Set(ticks.flatMap((t) => t.citedNewsIds))];
  const news = ids.length
    ? await prisma.newsItem.findMany({
        where: { id: { in: ids } },
        select: { id: true, headline: true, source: true, publishedAt: true },
      })
    : [];
  const byId = new Map(news.map((n) => [n.id, n]));

  return NextResponse.json({
    ticks: ticks.map((t) => ({
      ...t,
      cited: t.citedNewsIds.map((id) => {
        const n = byId.get(id);
        return n
          ? { id, headline: n.headline, source: n.source, publishedAt: n.publishedAt.toISOString(), missing: false }
          : { id, headline: null, source: null, publishedAt: null, missing: true };
      }),
    })),
  });
}
