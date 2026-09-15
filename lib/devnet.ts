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
    names: ["EntryPoint", "jUSD"],
  },
];

/**
 * The Jayverse services, and what each one has on this chain.
 *
 * `contracts` names Registry entries, so a service's row fills itself in from
 * the chain rather than from a list maintained here — if the seed stops
 * deploying something, the row goes quiet instead of lying.
 *
 * `live` is checked at render time. It is genuinely useful (a demo estate's
 * question is usually "is it up right now"), but it is also the slowest thing
 * on the page, so every check is short-timeout and failure means "unknown"
 * rather than "down" — we cannot distinguish a sleeping Cloud Run instance
 * from a broken one, and claiming the second would be wrong.
 */
export type Service = {
  name: string;
  blurb: string;
  url?: string;
  /** Registry names this service owns on the devnet. */
  contracts: string[];
  /** Something true about this service that the chain cannot tell you. */
  note?: string;
};

export const SERVICES: Service[] = [
  {
    name: "Rabbit — portal & Agentic AA",
    blurb: "ERC-4337 account abstraction and the ERC-7710 session-key path.",
    url: "https://www.jaylabs.xyz",
    contracts: ["EntryPoint", "DelegationManager", "SimpleFactory"],
    note: "UserOps go through the EntryPoint the fork carries, so the address is the one every 4337 tool already knows.",
  },
  {
    name: "Verex — prediction markets",
    blurb: "Onboarding and a market maker over conditional tokens.",
    url: "https://verex.jaylabs.xyz",
    contracts: ["MarketFactory"],
    note: "Its CTF backbone (jUSD, ConditionalTokens, CTFExchange) is pinned in verex's own deployments.json rather than the Registry — it is deployed by verex's tooling, not by the devnet seed.",
  },
  {
    name: "Token, Exchange & Personas",
    blurb: "JYVE and jUSD, priced against each other by a mini-AMM.",
    url: "https://exchange.jaylabs.xyz",
    contracts: ["JYVE", "JUSD", "Exchange"],
    note: "jUSD is the Jayverse dollar — our own, deployed by the seed in both node modes, not Circle's USDC.",
  },
  {
    name: "DeFi — jeETH",
    blurb: "EtherFi's mechanics rebuilt from scratch: a rebasing vault and its wrapper.",
    url: "https://defi.jaylabs.xyz",
    contracts: ["LiquidityPool", "jeETH", "jweETH", "MockAVS"],
  },
  {
    name: "Wallet & simulate-before-sign",
    blurb: "Embedded wallet, MV3 extension, and transaction previews.",
    url: "https://wallet.jaylabs.xyz",
    contracts: [],
    note: "No contracts of its own. It lists this chain as a network and its simulate API forks from the devnet, so a preview and the real thing agree.",
  },
  {
    name: "Number — math & investment",
    blurb: "Research notes, admin-only.",
    url: "https://number.jaylabs.xyz",
    contracts: [],
    note: "Reads the chain; deploys nothing to it.",
  },
  {
    name: "Game — 3D street",
    blurb: "Wander a street and find Verex markets on boards.",
    url: "https://www.jaylabs.xyz/game",
    contracts: [],
    note: "Runs inside the Rabbit service and reads markets from the devnet through Verex.",
  },
];

/** Is a service answering right now? Unknown beats a wrong "down". */
export async function probe(url?: string): Promise<"up" | "unknown"> {
  if (!url) return "unknown";
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 4000);
    const res = await fetch(url, { method: "GET", cache: "no-store", signal: ctl.signal, redirect: "manual" });
    clearTimeout(t);
    // A redirect is a live server answering, so anything below 500 counts.
    return res.status < 500 ? "up" : "unknown";
  } catch {
    return "unknown";
  }
}

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
