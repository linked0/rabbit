// The Jayverse devnet (chain 313370) — the half that only the devnet has.
//
// Two sources, deliberately:
//   - the devnet's own /status endpoint, which knows things the chain cannot
//     report about itself (fork pin, node mode, faucet budget, proxy uptime)
//   - the chain itself, for anything that must be true on-chain rather than
//     reported — the Registry's contents
//
// The address book is read from the Registry CONTRACT, not from the status
// endpoint's copy of deployments.json. The whole point of the Registry is that
// it is the authority after a reset; trusting a JSON file beside it would
// reintroduce exactly the stale-address problem it exists to prevent.
//
// Anything that is true of more than one chain — the chain list, block reads,
// the capability matrix — lives in lib/chains.ts since the page became
// /chains (jay, 2026-09-16). What stays here is what has no counterpart on
// the local fork or on Sepolia: a /status endpoint and a seeded Registry.

import { createPublicClient, http, type Address } from "viem";
import { jayverse } from "./jayverse";
import { chainDef, type ChainKey } from "./chains";

const devnet = chainDef("devnet");

export const DEVNET_URL = process.env.DEVNET_URL ?? "https://devnet.jaylabs.xyz";
export const DEVNET_RPC = devnet.rpc;
export const DEVNET_EXPLORER = devnet.explorer!;
export const DEVNET_CHAIN_ID = devnet.chainId;

const client = createPublicClient({
  chain: {
    id: DEVNET_CHAIN_ID,
    name: devnet.name,
    nativeCurrency: { name: "Test Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [DEVNET_RPC] } },
  },
  transport: http(DEVNET_RPC, { timeout: 4000, retryCount: 0 }),
});

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

/**
 * Groups for the address book. The Registry is a flat name -> address map, so
 * the grouping lives here — the chain should not have to care how a page
 * chooses to lay its contents out.
 */
export const CONTRACT_GROUPS: {
  title: string; titleKo: string; blurb: string; blurbKo: string; names: string[];
}[] = [
  {
    title: "Jayverse tokens & markets",
    titleKo: "Jayverse 토큰과 마켓",
    blurb: "Deployed fresh on the devnet by the seed — never inherited from the fork.",
    blurbKo: "시드가 데브넷에 새로 배포한다 — 포크에서 물려받은 것이 아니다.",
    names: ["JYVE", "JUSD", "Exchange", "MarketFactory", "Registry"],
  },
  {
    title: "DeFi (jeETH)",
    titleKo: "DeFi (jeETH)",
    blurb: "The from-scratch EtherFi study: a rebasing vault and its wrapper.",
    blurbKo: "EtherFi 를 처음부터 다시 만들어 본 것: 리베이싱 볼트와 그 래퍼.",
    names: ["LiquidityPool", "jeETH", "jweETH", "MockAVS"],
  },
  {
    title: "Delegation framework",
    titleKo: "위임 프레임워크",
    blurb: "ERC-7710 session keys. The kit hardcodes no addresses, so services find it here.",
    blurbKo: "ERC-7710 세션 키. 킷이 주소를 하드코딩하지 않으므로 서비스들이 여기서 찾는다.",
    names: ["DelegationManager", "SimpleFactory", "DelegationEntryPoint", "HybridDeleGatorImpl", "MultiSigDeleGatorImpl", "EIP7702StatelessDeleGatorImpl"],
  },
  {
    title: "Caveat enforcers",
    titleKo: "Caveat 집행자",
    blurb: "What actually enforces a delegation's limits on chain.",
    blurbKo: "위임에 걸린 한도를 온체인에서 실제로 강제하는 것들.",
    names: ["ERC20TransferAmountEnforcer", "TimestampEnforcer", "AllowedMethodsEnforcer", "AllowedTargetsEnforcer", "LimitedCallsEnforcer", "ValueLteEnforcer"],
  },
  {
    // jUSD 를 여기서 뺐다 (jay, 2026-09-15): 이 자리에 있던 것은 Circle 의 Sepolia USDC 였고,
    // 시드가 rails 에서 지웠다. 목록에 남겨 두면 우리 jUSD 와 같은 칸에 있는 것처럼 보인다.
    title: "Base rails (from the fork)",
    titleKo: "기본 레일 (포크에서)",
    blurb: "Inherited from Sepolia at their real addresses — the only things not deployed by us.",
    blurbKo: "Sepolia 의 실제 주소 그대로 물려받는다 — 우리가 배포하지 않은 유일한 것들.",
    names: ["EntryPoint"],
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
  blurbKo: string;
  url?: string;
  /** Registry names this service owns on the devnet. */
  contracts: string[];
  /** Which chains this service actually targets today. Not a wish list: each
   *  entry below cites where it is configured, because guessing here would
   *  produce a table that looks authoritative and is wrong. */
  chains: ChainKey[];
  /** Something true about this service that the chain cannot tell you. */
  note?: string;
  noteKo?: string;
};

/** Name, blurb and URL come from lib/jayverse.ts so /projects and /devnet
 *  cannot drift; only the chain-specific half is written here. */
function svc(
  key: string,
  chain: { contracts: string[]; chains: ChainKey[]; note?: string; noteKo?: string },
): Service {
  const p = jayverse(key);
  return { name: p.name, blurb: p.blurb, blurbKo: p.blurbKo, url: p.url, ...chain };
}

export const SERVICES: Service[] = [
  svc("rabbit", {
    contracts: ["EntryPoint", "DelegationManager", "SimpleFactory"],
    // scripts/deploy.env: CHAIN=devnet, ANVIL_RPC_URL=<devnet>/rpc. Sepolia is
    // still reached by app/api/bundle (SEPOLIA_RPC) and /live/7702.
    chains: ["devnet", "sepolia", "local"],
    note: "UserOps go through the EntryPoint the fork carries, so the address is the one every 4337 tool already knows.",
    noteKo:
      "UserOp 은 포크가 실어 온 EntryPoint 를 지나가므로, 주소가 모든 4337 도구가 이미 아는 그 값이다.",
  }),
  svc("verex", {
    contracts: ["MarketFactory"],
    // packages/contracts/deployments.json: a devnet entry (313370) and the
    // staging/prod entries, both still on Sepolia (11155111).
    chains: ["devnet", "sepolia"],
    note: "Its CTF backbone (jUSD, ConditionalTokens, CTFExchange) is pinned in verex's own deployments.json rather than the Registry — it is deployed by verex's tooling, not by the devnet seed.",
    noteKo:
      "CTF 백본(jUSD, ConditionalTokens, CTFExchange)은 Registry 가 아니라 verex 자체의 deployments.json 에 고정돼 있다 — 데브넷 시드가 아니라 verex 도구가 배포하기 때문이다.",
  }),
  svc("token", {
    contracts: ["JYVE", "JUSD", "Exchange"],
    chains: ["devnet"],
    note: "jUSD is the Jayverse dollar — our own, deployed by the seed in both node modes, not Circle's USDC.",
    noteKo:
      "jUSD 는 Jayverse 의 달러다 — 시드가 두 노드 모드 모두에서 배포하는 우리 것이고, Circle 의 USDC 가 아니다.",
  }),
  svc("defi", {
    contracts: ["LiquidityPool", "jeETH", "jweETH", "MockAVS"],
    chains: ["devnet"],
  }),
  svc("wallet", {
    contracts: [],
    chains: ["devnet", "local"],
    note: "No contracts of its own. It lists this chain as a network and its simulate API forks from the devnet, so a preview and the real thing agree.",
    noteKo:
      "자체 컨트랙트는 없다. 이 체인을 네트워크로 등록해 두고, simulate API 가 데브넷을 포크하므로 미리보기와 실제가 일치한다.",
  }),
  svc("number", {
    contracts: [],
    chains: ["devnet"],
    note: "Reads the chain; deploys nothing to it.",
    noteKo:
      "체인을 읽기만 하고, 아무것도 배포하지 않는다.",
  }),
  svc("game", {
    contracts: [],
    chains: ["devnet"],
    note: "Runs inside the Rabbit service and reads markets from the devnet through Verex.",
    noteKo:
      "Rabbit 서비스 안에서 돌고, Verex 를 통해 데브넷의 마켓을 읽는다.",
  }),
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
