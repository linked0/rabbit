import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { createPublicClient, createWalletClient, defineChain, http, isAddress, parseEther, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { verex } from "@/lib/verex-client";

export const dynamic = "force-dynamic";

// J2 — 참여자에게 자금 넣기 (jay, 2026-09-02). 두 종류이고 출처가 다르다:
//   • ETH  — `ANVIL_FIRST_PRIVATE_KEY`(anvil #0, .env §17)가 보내는 **진짜 전송**.
//            잔고를 마법으로 고치는 대신 자금 출처를 한 계정으로 명시한다 — 어느
//            체인에서든 그 계정에 돈이 있어야만 동작하고, 로컬 anvil 의 #0 은 늘
//            10,000 ETH 로 시작하므로 로컬에서는 항상 된다.
//   • USDC — verex `/faucet`(MockUSDC mint, 고정 1000). 토큰의 정의는 verex 에
//            있으므로 발행도 verex 가 한다 — 여기서 다시 정의하지 않는다.

const RPC = process.env.ANVIL_RPC_URL ?? "http://127.0.0.1:8545";
const ETH_TOPUP = parseEther("1");

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { to?: string; what?: "eth" | "usdc" } | null;
  if (!body?.to || !isAddress(body.to)) return NextResponse.json({ error: "to must be an address" }, { status: 400 });
  if (body.what !== "eth" && body.what !== "usdc") {
    return NextResponse.json({ error: 'what must be "eth" or "usdc"' }, { status: 400 });
  }
  const to = body.to as Address;

  try {
    if (body.what === "usdc") {
      const r = await verex.faucet(to);
      return NextResponse.json({ funded: "usdc", address: to, usdc: r.usdc });
    }
    const sourceKey = process.env.ANVIL_FIRST_PRIVATE_KEY?.trim();
    if (!sourceKey) {
      return NextResponse.json({ error: "ANVIL_FIRST_PRIVATE_KEY is not set (.env §17) — no fund source" }, { status: 503 });
    }
    const source = privateKeyToAccount(sourceKey as `0x${string}`);
    const pub = createPublicClient({ transport: http(RPC) });
    const chainId = await pub.getChainId();
    const chain = defineChain({
      id: chainId,
      name: `local-${chainId}`,
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: { default: { http: [RPC] } },
    });
    const wallet = createWalletClient({ account: source, chain, transport: http(RPC) });
    const hash = await wallet.sendTransaction({ to, value: ETH_TOPUP });
    await pub.waitForTransactionReceipt({ hash });
    const after = await pub.getBalance({ address: to });
    return NextResponse.json({ funded: "eth", address: to, from: source.address, txHash: hash, eth: Number(after) / 1e18 });
  } catch (e) {
    const message = String(e instanceof Error ? e.message : e);
    return NextResponse.json({ error: `fund failed: ${message}` }, { status: 500 });
  }
}
