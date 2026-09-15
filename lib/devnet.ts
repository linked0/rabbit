// Reading the Jayverse devnet (chain 313370) for the /devnet status page.
//
// Two sources, deliberately:
//   - the devnet's own /status endpoint, which knows things the chain cannot
//     report about itself (fork pin, node mode, faucet budget, proxy uptime)
//   - the chain itself, for anything that must be true on-chain rather than
//     reported — the Registry's contents, and the latest blocks
//
// The address book is read from the Registry CONTRACT, not from the status
// endpoint's copy of deployments.json. The whole point of the Registry is that
// it is the authority after a reset; trusting a JSON file beside it would
// reintroduce exactly the stale-address problem it exists to prevent.

import { createPublicClient, defineChain, http, type Address } from "viem";

export const DEVNET_URL = process.env.DEVNET_URL ?? "https://devnet.jaylabs.xyz";
export const DEVNET_RPC = `${DEVNET_URL}/rpc`;
export const DEVNET_EXPLORER = `${DEVNET_URL}/explorer`;
export const DEVNET_CHAIN_ID = 313370;

const chain = defineChain({
  id: DEVNET_CHAIN_ID,
  name: "Jayverse Devnet",
  nativeCurrency: { name: "Test Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [DEVNET_RPC] } },
});

const client = createPublicClient({ chain, transport: http(DEVNET_RPC) });

const registryAbi = [
  { type: "function", name: "count", stateMutability: "view", inputs: [], outputs: [{ type: "uint256" }] },
  { type: "function", name: "get", stateMutability: "view", inputs: [{ type: "string" }], outputs: [{ type: "address" }] },
  {
    type: "function", name: "entries", stateMutability: "view", inputs: [],
    outputs: [{ name: "keys", type: "bytes32[]" }, { name: "addrs", type: "address[]" }],
  },
] as const;

export type DevnetStatus = {
  chainId: number;
  healthy: boolean;
  mode: string;
  forkBlock: string | null;
  blockNumber?: number;
  latestBlockTime?: string;
  proxyUptimeSeconds?: number;
  rpcUrl: string;
  wsUrl: string;
  explorerUrl: string;
  registry?: { registry?: string; contracts?: Record<string, string> } | null;
  faucet?: {
    remainingTodayEth?: string;
    dailyBudgetEth?: string;
    payoutEth?: string;
    faucetAddress?: string;
    faucetBalanceEth?: string;
    error?: string;
  };
  error?: string;
};

export type BlockRow = { number: number; timestamp: number; txCount: number; hash: string };

/**
 * Groups for the address book. The Registry is a flat name -> address map, so
 * the grouping lives here — the chain should not have to care how a page
 * chooses to lay its contents out.
 */
export const CONTRACT_GROUPS: { title: string; blurb: string; names: string[] }[] = [
  {
    title: "Jayverse tokens & markets",
    blurb: "Deployed fresh on the devnet by the seed — never inherited from the fork.",
    names: ["JYVE", "JUSD", "Exchange", "MarketFactory", "Registry"],
  },
  {
    title: "DeFi (jeETH)",
    blurb: "The from-scratch EtherFi study: a rebasing vault and its wrapper.",
    names: ["LiquidityPool", "jeETH", "jweETH", "MockAVS"],
  },
  {
    title: "Delegation framework",
    blurb: "ERC-7710 session keys. The kit hardcodes no addresses, so services find it here.",
    names: ["DelegationManager", "SimpleFactory", "DelegationEntryPoint", "HybridDeleGatorImpl", "MultiSigDeleGatorImpl", "EIP7702StatelessDeleGatorImpl"],
  },
  {
    title: "Caveat enforcers",
    blurb: "What actually enforces a delegation's limits on chain.",
    names: ["ERC20TransferAmountEnforcer", "TimestampEnforcer", "AllowedMethodsEnforcer", "AllowedTargetsEnforcer", "LimitedCallsEnforcer", "ValueLteEnforcer"],
  },
  {
    title: "Base rails (from the fork)",
    blurb: "Inherited from Sepolia at their real addresses — the only things not deployed by us.",
    names: ["EntryPoint", "USDC"],
  },
];

export async function fetchStatus(): Promise<DevnetStatus> {
  try {
    const res = await fetch(`${DEVNET_URL}/status`, { cache: "no-store" });
    if (!res.ok) throw new Error(`status endpoint returned ${res.status}`);
    return (await res.json()) as DevnetStatus;
  } catch (err) {
    return {
      chainId: DEVNET_CHAIN_ID, healthy: false, mode: "unknown", forkBlock: null,
      rpcUrl: DEVNET_RPC, wsUrl: "", explorerUrl: DEVNET_EXPLORER,
      error: (err as Error).message,
    };
  }
}

/** Read the address book from the Registry contract — the on-chain authority. */
export async function fetchRegistry(
  registryAddress: Address,
  names: string[],
): Promise<{ book: Record<string, Address>; count: number | null }> {
  const book: Record<string, Address> = {};
  let count: number | null = null;
  try {
    count = Number(await client.readContract({ address: registryAddress, abi: registryAbi, functionName: "count" }));
  } catch {
    // A reset between the seed and this read leaves no contract here. Not fatal:
    // the page should say the book is unavailable rather than fail to render.
    return { book, count: null };
  }
  const results = await Promise.allSettled(
    names.map((n) =>
      client.readContract({ address: registryAddress, abi: registryAbi, functionName: "get", args: [n] }),
    ),
  );
  results.forEach((r, i) => {
    if (r.status === "fulfilled" && r.value !== "0x0000000000000000000000000000000000000000") {
      book[names[i]] = r.value as Address;
    }
  });
  return { book, count };
}

/** The last `n` blocks, newest first — the chain's recent activity at a glance. */
export async function fetchRecentBlocks(n = 8): Promise<BlockRow[]> {
  try {
    const head = await client.getBlockNumber();
    const numbers = Array.from({ length: n }, (_, i) => head - BigInt(i)).filter((b) => b >= 0n);
    const blocks = await Promise.all(
      numbers.map((b) => client.getBlock({ blockNumber: b, includeTransactions: false })),
    );
    return blocks.map((b) => ({
      number: Number(b.number),
      timestamp: Number(b.timestamp),
      txCount: b.transactions.length,
      hash: b.hash,
    }));
  } catch {
    return [];
  }
}
