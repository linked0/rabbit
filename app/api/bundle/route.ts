import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { submitBundle } from "@/lib/flashbots";

export const dynamic = "force-dynamic";
export const runtime = "nodejs"; // ethers 서명 → Node 런타임 필요

// POST /api/bundle — C2 서처: 번들을 Sepolia relay에 제출. 로그인 필요(허용 이메일만).
// ADMIN_KEY(개인키)는 서버 환경변수에서만 읽고 절대 클라이언트로 노출하지 않는다.
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const rpc = process.env.SEPOLIA_RPC?.trim();
  const key = process.env.ADMIN_KEY?.trim();
  if (!rpc || !key)
    return NextResponse.json(
      { error: "서버에 SEPOLIA_RPC / ADMIN_KEY 가 설정되지 않았습니다 (.env.local)." },
      { status: 503 }
    );

  let input: any;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: "잘못된 요청 본문(JSON)." }, { status: 400 });
  }
  if (!input?.to)
    return NextResponse.json({ error: "받는 주소(to)가 필요합니다." }, { status: 400 });

  try {
    const result = await submitBundle(rpc, key, {
      to: String(input.to).trim(),
      valueEth: input.valueEth,
      maxFeeGwei: input.maxFeeGwei,
      maxPriorityGwei: input.maxPriorityGwei,
      gasLimit: input.gasLimit,
      blockOffset: input.blockOffset,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: String(e instanceof Error ? e.message : e) },
      { status: 502 }
    );
  }
}
