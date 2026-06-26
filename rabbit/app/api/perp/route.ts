import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { fetchPerpContext, fetchUserState } from "@/lib/hyperliquid";

export const dynamic = "force-dynamic";

// GET /api/perp — ETH-PERP 시세(+ HL_ACCOUNT_ADDRESS 설정 시 내 포지션). Phase 1, 키 불필요.
export async function GET() {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const context = await fetchPerpContext("ETH");
    const address = process.env.HL_ACCOUNT_ADDRESS?.trim();
    let user = null;
    if (address) {
      const state = await fetchUserState(address);
      user = { ...state, positions: state.positions.filter((p) => p.coin === "ETH") };
    }
    return NextResponse.json({
      context,
      user,
      address: address ?? null,
      fetchedAt: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e instanceof Error ? e.message : e) },
      { status: 502 }
    );
  }
}
