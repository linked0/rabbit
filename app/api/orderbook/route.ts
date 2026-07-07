import { NextResponse } from "next/server";
import { fetchL2Book } from "@/lib/hyperliquid";

export const dynamic = "force-dynamic";

// GET /api/orderbook?coin=BTC — Hyperliquid L2 스냅샷 프록시 (Jun-30 design §3).
// /market(공개 페이지)에서 폴링 — 공개 info 엔드포인트라 키·인증 불필요.
export async function GET(req: Request) {
  const coin = (new URL(req.url).searchParams.get("coin") ?? "BTC").toUpperCase();
  if (!/^[A-Z0-9]{1,10}$/.test(coin)) {
    return NextResponse.json({ error: "invalid coin" }, { status: 400 });
  }
  try {
    const book = await fetchL2Book(coin);
    return NextResponse.json({ ...book, fetchedAt: new Date().toISOString() });
  } catch (e) {
    return NextResponse.json(
      { error: String(e instanceof Error ? e.message : e) },
      { status: 502 }
    );
  }
}
