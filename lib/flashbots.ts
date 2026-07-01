import { ethers } from "ethers";

// C2 서처 — 번들을 Flashbots Sepolia relay에 직접 제출 (SDK 없이 JSON-RPC).
// relay는 eth_callBundle(시뮬)·eth_sendBundle(제출)을 지원. ADMIN_KEY는 서버에서만 사용.
// 설계: docs/features/xyz-demo.md (C2) · relay 스펙: https://docs.flashbots.net/flashbots-auction/advanced/rpc-endpoint
const SEPOLIA_RELAY = "https://relay-sepolia.flashbots.net";
const CHAIN_ID = 11155111;

export type BundleInput = {
  to: string;
  valueEth?: string;
  maxFeeGwei?: string;
  maxPriorityGwei?: string;
  gasLimit?: string;
  blockOffset?: number;
};

export type BundleResult = {
  relay: string;
  chainId: number;
  sender: string;
  to: string;
  valueEth: string;
  nonce: number;
  currentBlock: number;
  targetBlock: number;
  bundleHash: string | null;
  simulation: unknown;
  rawTx: string;
  submittedAt: string;
};

// Flashbots 인증 헤더: "<서명자주소>:<id(body) 서명>". 평판용 임시 키로 서명.
async function authHeader(authWallet: ethers.HDNodeWallet, body: string): Promise<string> {
  const sig = await authWallet.signMessage(ethers.id(body));
  return `${authWallet.address}:${sig}`;
}

async function relayCall(
  authWallet: ethers.HDNodeWallet,
  method: string,
  params: unknown[]
): Promise<any> {
  const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method, params });
  const res = await fetch(SEPOLIA_RELAY, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "X-Flashbots-Signature": await authHeader(authWallet, body),
    },
    body,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`relay ${method} HTTP ${res.status}`);
  if (json.error) throw new Error(`${method}: ${json.error.message ?? JSON.stringify(json.error)}`);
  return json.result;
}

// 서버 전용: ADMIN_KEY로 tx를 서명해 번들 하나를 relay에 제출한다.
export async function submitBundle(
  rpcUrl: string,
  adminKey: string,
  input: BundleInput
): Promise<BundleResult> {
  if (!ethers.isAddress(input.to)) throw new Error(`받는 주소가 올바르지 않습니다: ${input.to}`);

  const provider = new ethers.JsonRpcProvider(rpcUrl, CHAIN_ID);
  const wallet = new ethers.Wallet(adminKey, provider);
  const authWallet = ethers.Wallet.createRandom(); // 평판용 임시 서명자(자금 불필요)

  const nonce = await provider.getTransactionCount(wallet.address, "pending");
  const currentBlock = await provider.getBlockNumber();
  const targetBlock = currentBlock + (input.blockOffset ?? 1);
  const blockHex = "0x" + targetBlock.toString(16);
  const valueEth = input.valueEth ?? "0";

  // EIP-1559 tx 서명 (기본: 단순 ETH 전송, 21000 gas)
  const rawTx = await wallet.signTransaction({
    chainId: CHAIN_ID,
    type: 2,
    to: ethers.getAddress(input.to),
    value: ethers.parseEther(valueEth),
    nonce,
    gasLimit: BigInt(input.gasLimit ?? "21000"),
    maxFeePerGas: ethers.parseUnits(input.maxFeeGwei ?? "30", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits(input.maxPriorityGwei ?? "2", "gwei"),
  });

  // 1) 시뮬레이션 — 실패(revert/자금부족)면 제출하지 않고 에러.
  const simulation = await relayCall(authWallet, "eth_callBundle", [
    { txs: [rawTx], blockNumber: blockHex, stateBlockNumber: "latest" },
  ]);
  const simErr = simulation?.results?.[0]?.error || simulation?.results?.[0]?.revert;
  if (simErr) throw new Error(`시뮬레이션 실패: ${simErr}`);

  // 2) 제출 — eth_sendBundle
  const sent = await relayCall(authWallet, "eth_sendBundle", [
    { txs: [rawTx], blockNumber: blockHex },
  ]);

  return {
    relay: SEPOLIA_RELAY,
    chainId: CHAIN_ID,
    sender: wallet.address,
    to: ethers.getAddress(input.to),
    valueEth,
    nonce,
    currentBlock,
    targetBlock,
    bundleHash: sent?.bundleHash ?? null,
    simulation,
    rawTx,
    submittedAt: new Date().toISOString(),
  };
}
