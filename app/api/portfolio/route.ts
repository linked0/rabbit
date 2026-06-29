import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { fetchKrwPrices } from "@/lib/upbit";
import { computePositions, computeTotals, type TradeRow } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

// GET /api/portfolio — 거래 기록에서 Current Portfolio 계산 (KRW, Upbit 현재가 반영)
export async function GET() {
  const session = await auth();
  const email = session?.user?.email;
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const trades = await prisma.trade.findMany({
    where: { userEmail: email },
    orderBy: { tradedAt: "asc" },
  });

  const rows: TradeRow[] = trades.map((t) => ({
    id: t.id,
    assetType: t.assetType,
    market: t.market,
    symbol: t.symbol,
    side: t.side,
    quantity: Number(t.quantity),
    price: Number(t.price),
    fee: t.fee === null ? null : Number(t.fee),
    tradedAt: t.tradedAt.toISOString(),
    note: t.note,
  }));

  // 현재가: 보유 심볼만 Upbit에서 (현금 KRW는 lib/portfolio가 1로 처리)
  const symbols = Array.from(new Set(rows.map((r) => r.symbol.toUpperCase())));
  const priceBySymbol = await fetchKrwPrices(symbols);

  const positions = computePositions(rows, priceBySymbol);
  const totals = computeTotals(positions);

  return NextResponse.json({
    positions,
    totals,
    fetchedAt: new Date().toISOString(),
  });
}
