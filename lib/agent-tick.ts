import { prisma } from "@/lib/db";
import { agentAddress } from "@/lib/agent-wallet";
import { verex, placeSignedLimitOrder } from "@/lib/verex-client";
import { estimate } from "@/lib/agent-estimate";
import { parseStoredMandate, redeemMandate, simulateMandateDraw } from "@/lib/delegation";
import type { TickVerdict } from "@prisma/client";

// J2 / R-C — 틱 하나. observe → estimate → decide → act → record.
//
// 라우트에서 이 파일로 옮겨진 이유 (jay, 2026-09-02, R-F): 스케줄러는 사람의 세션
// 없이 서버 안에서 틱을 불러야 한다. HTTP 라우트는 auth 를 요구하므로, 판단 로직을
// auth 없는 lib 함수로 내리고 라우트와 스케줄러가 **같은 함수**를 부른다 — 두 경로가
// 다른 코드를 돌면 "스케줄러가 돌린 틱"과 "사람이 누른 틱"이 다른 물건이 된다.
//
// **두 번 연달아 불러도 안전해야 한다.** 안전을 보장하는 것은 쿨다운이다.
// **skip 도 반드시 기록한다.** 하지 않은 일은 체인에 없으므로, 저널이 유일한 기록이다.

export const TICK_DEFAULTS = {
  /// 행동 사이 최소 간격(초). 데모에서는 짧게 줄여 테스트한다.
  cooldownSec: 3600,
  /// |p − 체결가| 최소 edge. 퍼센트포인트가 아니라 확률 단위(0.05 = 5pp).
  edgeThreshold: 0.05,
  /// 한 번에 걸 명목 금액(jUSD).
  sizeJusd: 2.5,
  /// 추정이 볼 뉴스의 발행 기준 시간창.
  newsWithinHours: 48,
};

export type TickSettings = Partial<typeof TICK_DEFAULTS> & { marketSlug: string; outcome?: string };

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
  spentJusd?: number;
  budgetLeftJusd?: number | null;
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
      spentJusd: args.spentJusd ?? 0,
      budgetLeftJusd: args.budgetLeftJusd ?? null,
    },
  });
}

export type TickResult =
  | { tick: Awaited<ReturnType<typeof record>>; placed?: unknown }
  | { error: string; status: number };

/// 틱 하나를 돌린다. 던지지 않고 { error, status } 로 돌려준다 — 라우트는 그대로
/// NextResponse 로 감싸고, 스케줄러는 lastError 로 기록한다.
export async function runAgentTick(input: TickSettings): Promise<TickResult> {
  const s = { ...TICK_DEFAULTS, ...input };
  if (!s.marketSlug) return { error: "marketSlug is required", status: 400 };
  const outcome = s.outcome ?? "Yes";

  const mandate = await prisma.mandate.findFirst({
    where: { agent: agentAddress(), revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!mandate) {
    return { error: "no active mandate — grant one first", status: 400 };
  }

  const cap = Number(mandate.capJusd);
  const drawn = Number(mandate.drawnJusd);
  const budgetLeft = Number((cap - drawn).toFixed(6));
  const base = { mandateId: mandate.id, marketSlug: s.marketSlug, outcome, citedNewsIds: [] as string[] };

  // 저장된 위임은 두 모양 중 하나다(서명된 구조체 / 지갑이 준 ERC-7715 context).
  const stored = parseStoredMandate(mandate.delegation);

  // ── 1. 만료. DB 의 만료 시각만 보고 "체인이 거절했다"고 적으면 거짓말이다 —
  // 위임이 온체인이면 실제로 물어본다(시뮬레이션이라 가스 0).
  if (mandate.expiresAt.getTime() <= Date.now()) {
    let reason = `mandate expired at ${mandate.expiresAt.toISOString()} — recorded from the DB mirror (no on-chain delegation to ask)`;
    if (stored) {
      const cfg = await verex.config().catch(() => null);
      if (cfg?.jusd) {
        const probe = await simulateMandateDraw({
          mandate: stored,
          jusd: cfg.jusd,
          amountJusd: Math.min(s.sizeJusd, Math.max(budgetLeft, 0.000001)),
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
      budgetLeftJusd: budgetLeft,
    });
    return { tick };
  }

  // ── 2. 예산 소진. 만료와 **다른 경계**이고 다르게 읽혀야 한다.
  if (budgetLeft <= 0) {
    const tick = await record({
      ...base, bestBid: null, bestAsk: null, p: null, rationale: null,
      verdict: "SKIP_EXHAUSTED",
      reason: `budget fully drawn (${drawn.toFixed(2)} / ${cap.toFixed(2)} jUSD) → no action`,
      budgetLeftJusd: 0,
    });
    return { tick };
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
        budgetLeftJusd: budgetLeft,
      });
      return { tick };
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
      budgetLeftJusd: budgetLeft,
    });
    return { tick };
  }

  // ── 6. 판정. edge 는 **체결되는 쪽 가격**에 대해 잰다.
  //
  // 약세 견해는 SELL 이 아니라 **반대 outcome 의 BUY** 로 표현한다 (jay, 2026-09-02).
  // 이진 마켓에서 Yes 를 p 에 파는 것과 No 를 (1−p) 에 사는 것은 같은 견해이고,
  // BUY 는 mandate 인출만 필요해 "재고가 없어 못 판다"(insufficient balance)가 아예
  // 생기지 않는다. 더 중요한 것: 모든 행동이 인출이 되므로 상한이 예외 없이 전부를
  // 묶는다 — SELL 이 인출을 우회하던 구멍이 구조적으로 닫힌다. SELL 경로는 반대
  // outcome 이 하나로 정해지지 않는 비이진 마켓에만 남는다.
  const buying = est.p > (bestAsk ?? 1);
  let side: "BUY" | "SELL" = buying ? "BUY" : "SELL";
  let tradeOutcome = outcome;
  let tradeP = est.p;
  let executable = buying ? bestAsk : bestBid;

  if (!buying && market.outcomes.length === 2) {
    const opposite = market.outcomes.find((o) => o.label !== outcome);
    if (opposite) {
      const oppBook = await verex.book(s.marketSlug, opposite.label);
      side = "BUY";
      tradeOutcome = opposite.label;
      tradeP = Number((1 - est.p).toFixed(4));
      executable = oppBook.asks[0]?.price ?? null;
    }
  }

  if (executable === null) {
    const tick = await record({
      ...base, bestBid, bestAsk, p: est.p, rationale: est.rationale, citedNewsIds: est.citedNewsIds,
      verdict: "SKIP_EDGE",
      reason: `no ${side === "BUY" ? "ask" : "bid"} on ${tradeOutcome} to trade against → no action`,
      budgetLeftJusd: budgetLeft,
    });
    return { tick };
  }
  // BUY 는 부호 있는 edge 를 쓴다 — 모델이 호가보다 낮게 보는데 |차이|가 크다고 사는
  // 실수를 막는다. 비이진 SELL 경로만 기존의 절대값 규칙을 유지한다.
  const edge = side === "BUY" ? Number((tradeP - executable).toFixed(4)) : Math.abs(est.p - executable);
  if (edge < s.edgeThreshold) {
    const tick = await record({
      ...base, bestBid, bestAsk, p: est.p, rationale: est.rationale, citedNewsIds: est.citedNewsIds,
      verdict: "SKIP_EDGE",
      reason:
        `book ${executable.toFixed(2)} (${tradeOutcome} ${side === "BUY" ? "ask" : "bid"}), ` +
        `model ${tradeP.toFixed(2)}${tradeOutcome !== outcome ? ` (1−p of ${outcome})` : ""}, ` +
        `edge ${edge.toFixed(2)} < ${s.edgeThreshold} → no action`,
      budgetLeftJusd: budgetLeft,
    });
    return { tick };
  }

  // ── 7. 규모. 남은 예산을 넘으면 하지 않는다.
  const notional = s.sizeJusd;
  if (notional > budgetLeft) {
    const tick = await record({
      ...base, bestBid, bestAsk, p: est.p, rationale: est.rationale, citedNewsIds: est.citedNewsIds,
      verdict: "SKIP_BUDGET",
      reason: `notional ${notional.toFixed(2)} > ${budgetLeft.toFixed(2)} remaining → no action`,
      budgetLeftJusd: budgetLeft,
    });
    return { tick };
  }

  // ── 8. 실행. 위임 행사가 **먼저**다 — 여기가 강제 지점이다.
  const price = executable;
  const size = Number((notional / price).toFixed(6));
  const target = market.outcomes.find((o) => o.label === tradeOutcome);
  if (!target) return { error: `outcome ${tradeOutcome} not found`, status: 400 };

  let drawTxHash: string | null = null;
  if (stored && side === "BUY") {
    const cfg = await verex.config();
    if (!cfg.jusd) return { error: "verex has no jUSD address", status: 503 };
    try {
      drawTxHash = await redeemMandate({ mandate: stored, jusd: cfg.jusd, amountJusd: notional });
    } catch (e) {
      // 체인이 거절했다면 그것이 결과다. 저널에 남기고 조용히 넘어가지 않는다.
      const tick = await record({
        ...base, outcome: tradeOutcome, bestBid, bestAsk, p: est.p, rationale: est.rationale, citedNewsIds: est.citedNewsIds,
        verdict: "SKIP_BUDGET",
        reason: `draw of ${notional.toFixed(2)} refused on-chain: ${String(e instanceof Error ? e.message : e).slice(0, 180)}`,
        budgetLeftJusd: budgetLeft,
      });
      return { tick };
    }
  }

  const placed = await placeSignedLimitOrder({
    slug: s.marketSlug, outcome: tradeOutcome, tokenId: target.tokenId, side, size, price,
  });

  const spent = placed.totalJusd;
  await prisma.mandate.update({
    where: { id: mandate.id },
    data: { drawnJusd: { increment: spent } },
  });
  const tick = await record({
    ...base, outcome: tradeOutcome, bestBid, bestAsk, p: est.p, rationale: est.rationale, citedNewsIds: est.citedNewsIds,
    verdict: "TRADED",
    reason:
      `book ${price.toFixed(2)}, model ${tradeP.toFixed(2)}, edge ${edge.toFixed(2)} ≥ ${s.edgeThreshold} → ${side} ${size.toFixed(2)} ${tradeOutcome}` +
      (tradeOutcome !== outcome ? ` (bearish on ${outcome}, expressed as ${tradeOutcome})` : "") +
      (drawTxHash ? ` (drawn on-chain ${drawTxHash.slice(0, 10)}…)` : " (no on-chain delegation — DB budget only)"),
    verexOrderId: placed.orderId,
    spentJusd: spent,
    budgetLeftJusd: Number((budgetLeft - spent).toFixed(6)),
  });
  return { tick, placed };
}
