import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ethers } from "ethers";
import { NETWORKS, resolveNetwork } from "@/lib/flashbots";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// GET /api/bundle/status?tx=0x…&network=sepolia|mainnet — 번들 tx 포함 여부. 로그인 필요.
export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email)
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });

  const url = new URL(req.url);
  const tx = url.searchParams.get("tx");
  if (!tx || !/^0x[0-9a-fA-F]{64}$/.test(tx))
    return NextResponse.json({ error: "유효한 tx 해시가 필요합니다." }, { status: 400 });

  const net = resolveNetwork(url.searchParams.get("network"));
  const rpc = (net === "mainnet" ? process.env.MAINNET_RPC : process.env.SEPOLIA_RPC)?.trim();
  if (!rpc)
    return NextResponse.json({ error: `${net} RPC 미설정.` }, { status: 503 });

  try {
    const provider = new ethers.JsonRpcProvider(rpc, NETWORKS[net].chainId);
    const [receipt, currentBlock] = await Promise.all([
      provider.getTransactionReceipt(tx),
      provider.getBlockNumber(),
    ]);
    return NextResponse.json({
      included: !!receipt,
      blockNumber: receipt?.blockNumber ?? null,
      txStatus: receipt?.status ?? null,
      currentBlock,
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e instanceof Error ? e.message : e) },
      { status: 502 }
    );
  }
}
