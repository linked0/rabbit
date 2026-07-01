import { ethers } from "ethers";

// C2 서처 — 번들을 Flashbots relay에 직접 제출 (SDK 없이 JSON-RPC).
// relay는 eth_callBundle(시뮬)·eth_sendBundle(제출)을 지원. 개인키는 서버에서만 사용.
// 설계: docs/features/xyz-demo.md (C2) · relay 스펙: https://docs.flashbots.net/flashbots-auction/advanced/rpc-endpoint

export type Network = "sepolia" | "mainnet";

// ⚠️ mainnet은 실제 ETH·가스를 사용한다 (되돌릴 수 없음).
// simRelay = eth_callBundle(시뮬) 지원 엔드포인트. builders = eth_sendBundle 보낼 빌더들.
// 메인넷은 Flashbots 빌더 점유율이 낮아, 실제 블록을 많이 만드는 빌더들(beaverbuild·Titan·rsync)에
// 동시에 보내야 포함 확률이 오른다.
export const NETWORKS: Record<
  Network,
  { simRelay: string; builders: string[]; chainId: number; label: string }
> = {
  sepolia: {
    simRelay: "https://relay-sepolia.flashbots.net",
    builders: ["https://relay-sepolia.flashbots.net"],
    chainId: 11155111,
    label: "Sepolia",
  },
  mainnet: {
    simRelay: "https://relay.flashbots.net",
    builders: [
      "https://relay.flashbots.net",
      "https://rpc.beaverbuild.org",
      "https://rpc.titanbuilder.xyz",
      "https://rsync-builder.xyz",
    ],
    chainId: 1,
    label: "Ethereum Mainnet",
  },
};

export function resolveNetwork(n: unknown): Network {
  return n === "mainnet" ? "mainnet" : "sepolia";
}

const MAX_BLOCKS = 25; // 재제출 상한 (searcher 관행 ~25블록)

export type BundleInput = {
  to: string;
  valueEth?: string;
  maxFeeGwei?: string;
  maxPriorityGwei?: string;
  gasLimit?: string;
  blocks?: number; // 다음 N개 블록에 재제출 (기본 1) — 포함 확률 ↑
  network?: Network;
};

export type BundleResult = {
  network: Network;
  builders: string[]; // 제출 대상 빌더 호스트들
  chainId: number;
  sender: string;
  to: string;
  valueEth: string;
  nonce: number;
  currentBlock: number;
  firstBlock: number;
  lastBlock: number;
  submittedBlocks: number; // ≥1 빌더가 받은 블록 수
  submissions: number; // 성공한 (빌더×블록) 제출 총합
  bundleHash: string | null;
  txHash: string; // 서명된 tx의 해시 — 포함 추적용
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
  relayUrl: string,
  authWallet: ethers.HDNodeWallet,
  method: string,
  params: unknown[]
): Promise<any> {
  const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method, params });
  const res = await fetch(relayUrl, {
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

  const net = resolveNetwork(input.network);
  const { simRelay, builders, chainId } = NETWORKS[net];
  const provider = new ethers.JsonRpcProvider(rpcUrl, chainId);
  const wallet = new ethers.Wallet(adminKey, provider);
  const authWallet = ethers.Wallet.createRandom(); // 평판용 임시 서명자(자금 불필요)

  const nonce = await provider.getTransactionCount(wallet.address, "pending");
  const currentBlock = await provider.getBlockNumber();
  const blocks = Math.min(MAX_BLOCKS, Math.max(1, Math.floor(input.blocks ?? 1)));
  const firstBlock = currentBlock + 1;
  const lastBlock = currentBlock + blocks;
  const valueEth = input.valueEth ?? "0";

  // EIP-1559 tx 서명 (기본: 단순 ETH 전송, 21000 gas)
  const rawTx = await wallet.signTransaction({
    chainId,
    type: 2,
    to: ethers.getAddress(input.to),
    value: ethers.parseEther(valueEth),
    nonce,
    gasLimit: BigInt(input.gasLimit ?? "21000"),
    maxFeePerGas: ethers.parseUnits(input.maxFeeGwei ?? "30", "gwei"),
    maxPriorityFeePerGas: ethers.parseUnits(input.maxPriorityGwei ?? "2", "gwei"),
  });
  const txHash = ethers.Transaction.from(rawTx).hash ?? "";

  // 1) 시뮬레이션 (다음 블록 기준, Flashbots relay에서) — 실패면 제출하지 않고 에러.
  const simulation = await relayCall(simRelay, authWallet, "eth_callBundle", [
    { txs: [rawTx], blockNumber: "0x" + firstBlock.toString(16), stateBlockNumber: "latest" },
  ]);
  const simErr = simulation?.results?.[0]?.error || simulation?.results?.[0]?.revert;
  if (simErr) throw new Error(`시뮬레이션 실패: ${simErr}`);

  // 2) 제출 — (빌더 × 블록) 조합 전부에 eth_sendBundle 병렬 전송. 같은 tx라 bundleHash는 동일.
  //    메인넷은 여러 빌더에 보내야(실제 블록을 만드는 빌더 커버) 포함 확률이 실질적으로 오른다.
  const jobs: Promise<{ block: number; ok: boolean; hash?: string; err?: unknown }>[] = [];
  for (let b = firstBlock; b <= lastBlock; b++) {
    for (const builder of builders) {
      jobs.push(
        relayCall(builder, authWallet, "eth_sendBundle", [
          { txs: [rawTx], blockNumber: "0x" + b.toString(16) },
        ])
          .then((r) => ({ block: b, ok: true as const, hash: r?.bundleHash }))
          .catch((err) => ({ block: b, ok: false as const, err }))
      );
    }
  }
  const settled = await Promise.all(jobs);
  const okJobs = settled.filter((s) => s.ok);
  const bundleHash = okJobs.find((s) => s.hash)?.hash ?? null;
  const submittedBlocks = new Set(okJobs.map((s) => s.block)).size;
  const submissions = okJobs.length;
  if (submissions === 0) {
    const lastErr = settled.find((s) => !s.ok)?.err;
    throw new Error(`제출 실패: ${String(lastErr instanceof Error ? lastErr.message : lastErr)}`);
  }

  return {
    network: net,
    builders,
    chainId,
    sender: wallet.address,
    to: ethers.getAddress(input.to),
    valueEth,
    nonce,
    currentBlock,
    firstBlock,
    lastBlock,
    submittedBlocks,
    submissions,
    bundleHash,
    txHash,
    simulation,
    rawTx,
    submittedAt: new Date().toISOString(),
  };
}
