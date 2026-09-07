import { NextResponse } from "next/server";
import { verex, quoteBet, encodeBetCalls } from "@/lib/verex-client";

export const dynamic = "force-dynamic";

// Jayverse AA — 베팅 견적 + 배치 calldata. 설계: docs/features/jayverse-aa.md §3·§6.
//
// 인코딩을 서버에서 하는 이유: verex 주소들(/config)은 VEREX_API_URL 뒤에 있고
// (콘솔의 /api/agent/markets 와 같은 이유 — CORS·서버 설정), @verex/sdk 의 ABI 도
// 브라우저 번들에 실을 필요가 없다. 드로어는 받은 콜 두 개를 그대로 UserOp 에 싣는다.
// 인증이 없는 이유: 공개 마켓 데이터로 calldata 를 조립할 뿐, 서명·지출은 전부
// 사용자 지갑 쪽에서 일어난다.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") ?? "";
  const outcome = url.searchParams.get("outcome") ?? "";
  const usdc = Number(url.searchParams.get("usdc"));
  const account = url.searchParams.get("account") ?? "";
  if (!slug || !outcome || !(usdc > 0)) {
    return NextResponse.json({ error: "slug, outcome, usdc(>0) are required" }, { status: 400 });
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(account)) {
    return NextResponse.json({ error: "account must be a 0x address (the smart account)" }, { status: 400 });
  }
  try {
    const [cfg, quote] = await Promise.all([verex.config(), quoteBet(slug, outcome, usdc)]);
    const calls = encodeBetCalls({ cfg, quote, account: account as `0x${string}` });
    return NextResponse.json({
      quote,
      exchange: cfg.exchange,
      usdcAddress: cfg.usdc,
      calls: [calls.approve, calls.placeOrder],
    });
  } catch (e) {
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e) }, { status: 503 });
  }
}
