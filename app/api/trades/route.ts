import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import type { TradeRow } from "@/lib/portfolio";

export const dynamic = "force-dynamic";

// Prisma의 Decimal/Date → 순수 number/string 으로 평탄화
type DbTrade = Awaited<ReturnType<typeof prisma.trade.findFirst>>;
function toRow(t: NonNullable<DbTrade>): TradeRow {
  return {
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
  };
}

async function currentEmail(): Promise<string | null> {
  const session = await auth();
  return session?.user?.email ?? null;
}

// GET /api/trades — 내 거래 내역 (최신순)
export async function GET() {
  const email = await currentEmail();
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const trades = await prisma.trade.findMany({
    where: { userEmail: email },
    orderBy: { tradedAt: "desc" },
  });
  return NextResponse.json(trades.map(toRow));
}

// POST /api/trades — 거래 1건 추가 → Current Portfolio는 다음 조회 때 자동 반영
export async function POST(req: NextRequest) {
  const email = await currentEmail();
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 JSON" }, { status: 400 });
  }

  const symbol = String(body.symbol ?? "").trim().toUpperCase();
  const side = body.side === "SELL" ? "SELL" : "BUY";
  const quantity = Number(body.quantity);
  const price = Number(body.price);
  const assetType = String(body.assetType ?? "CRYPTO").trim().toUpperCase();

  if (!symbol) return NextResponse.json({ error: "symbol이 필요합니다." }, { status: 400 });
  if (!Number.isFinite(quantity) || quantity <= 0)
    return NextResponse.json({ error: "quantity는 0보다 커야 합니다." }, { status: 400 });
  if (!Number.isFinite(price) || price < 0)
    return NextResponse.json({ error: "price가 올바르지 않습니다." }, { status: 400 });

  const trade = await prisma.trade.create({
    data: {
      userEmail: email,
      assetType,
      market: body.market ? String(body.market) : null,
      symbol,
      side,
      quantity,
      price,
      currency: "KRW",
      fee: body.fee != null && Number.isFinite(Number(body.fee)) ? Number(body.fee) : null,
      tradedAt: body.tradedAt ? new Date(String(body.tradedAt)) : new Date(),
      note: body.note ? String(body.note) : null,
    },
  });
  return NextResponse.json(toRow(trade), { status: 201 });
}
