import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createPublicClient, createWalletClient, defineChain, http, parseUnits, erc20Abi, type Address } from "viem";
import { agentAccount, agentAddress } from "@/lib/agent-wallet";
import { verex } from "@/lib/verex-client";

export const dynamic = "force-dynamic";

// J2 / R-B — scripts/agent-approve.mjs 의 콘솔 버전 (jay, 2026-09-02).
//
// 같은 두 승인이다: USDC `approve`(BUY 가 지불할 돈)와 CTF `setApprovalForAll`
// (SELL 이 인도할 토큰). verex 의 `checkExternalFunds` 는 읽고 거절만 하지 대신
// 승인해 주지 않으므로, 이 둘이 없으면 주문이 전부 400 으로 죽는다. 키가 서버에
// 있으니(D2) 버튼 하나로 서버가 보낼 수 있다 — CLI 를 여는 것보다 조작판에서
// 상태를 본 자리에서 고치는 쪽이 낫다.
//
// 멱등: 이미 충분하면 아무것도 보내지 않고 그 사실을 말한다.
// Exchange 주소는 매번 /config 에서 읽는다 — reset.sh 마다 바뀐다.

const RPC = process.env.ANVIL_RPC_URL ?? "http://127.0.0.1:8545";
// 무한 승인을 쓰지 않는 이유는 scripts/agent-approve.mjs 와 같다: 이 데모의 주장이
// "상한은 온체인에서 강제된다"인데 화면 밖 무한 승인은 그 문장을 덜 정직하게 만든다.
const AMOUNT = Number(process.env.AGENT_APPROVE_USDC ?? 10_000);

const ERC1155_ABI = [
  { name: "setApprovalForAll", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "operator", type: "address" }, { name: "approved", type: "bool" }], outputs: [] },
  { name: "isApprovedForAll", type: "function", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }, { name: "operator", type: "address" }],
    outputs: [{ type: "bool" }] },
] as const;

export async function POST() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  try {
    const cfg = await verex.config();
    if (!cfg.usdc || !cfg.exchange || !cfg.ctf) {
      return NextResponse.json({ error: "verex /config has no usdc/exchange/ctf — is it seeded?" }, { status: 503 });
    }

    // 체인은 RPC 에 물어본다 — 설정이 아니라 현실 (agent-approve.mjs 와 같은 이유).
    const probe = createPublicClient({ transport: http(RPC) });
    const chainId = await probe.getChainId();
    const chain = defineChain({
      id: chainId,
      name: `local-${chainId}`,
      nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
      rpcUrls: { default: { http: [RPC] } },
    });
    const pub = createPublicClient({ chain, transport: http(RPC) });
    const wallet = createWalletClient({ account: agentAccount(), chain, transport: http(RPC) });

    const need = parseUnits(String(AMOUNT), 6);
    const [allowance, gas, ctfApproved] = await Promise.all([
      pub.readContract({ address: cfg.usdc, abi: erc20Abi, functionName: "allowance", args: [agentAddress(), cfg.exchange] }),
      pub.getBalance({ address: agentAddress() }),
      pub.readContract({ address: cfg.ctf, abi: ERC1155_ABI, functionName: "isApprovedForAll", args: [agentAddress(), cfg.exchange] }),
    ]);

    const needUsdc = allowance < need;
    const needCtf = !ctfApproved;
    if (!needUsdc && !needCtf) {
      return NextResponse.json({ already: true, allowanceUsdc: Number(allowance) / 1e6, ctfApproved: true });
    }
    if (gas === 0n) {
      // 승인은 에이전트가 직접 내는 유일한 온체인 tx 다 — 가스가 없으면 여기서 멈춘다.
      return NextResponse.json(
        { error: `the agent ${agentAddress()} holds no native token, so it cannot send the approval — fund it first (cast send … --value 1ether)` },
        { status: 400 },
      );
    }

    let usdcTx: string | null = null;
    let ctfTx: string | null = null;
    if (needUsdc) {
      usdcTx = await wallet.writeContract({
        address: cfg.usdc, abi: erc20Abi, functionName: "approve", args: [cfg.exchange, need],
      });
      await pub.waitForTransactionReceipt({ hash: usdcTx as Address });
    }
    if (needCtf) {
      ctfTx = await wallet.writeContract({
        address: cfg.ctf, abi: ERC1155_ABI, functionName: "setApprovalForAll", args: [cfg.exchange, true],
      });
      await pub.waitForTransactionReceipt({ hash: ctfTx as Address });
    }
    return NextResponse.json({ already: false, approvedUsdc: needUsdc ? AMOUNT : null, usdcTx, ctfTx });
  } catch (e) {
    const message = String(e instanceof Error ? e.message : e);
    console.error("[agent/approve]", e);
    return NextResponse.json({ error: `approve failed: ${message}` }, { status: 500 });
  }
}
