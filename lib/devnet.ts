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
 * A set of contracts one service owns on one chain.
 *
 * Addresses used to live in a separate "Ecosystem contracts" panel, grouped by
 * what kind of contract they were. jay, 2026-09-16: put them in the Services
 * section instead. He is right — "which contracts does Verex have, and where"
 * is the question people actually arrive with, and answering it meant reading
 * a service row, then scrolling to a different panel and matching names by eye.
 * Grouping by owner and then by chain puts the answer in one place.
 *
 * Two sources, and the distinction matters:
 *
 *   `names`  — looked up in the devnet's Registry CONTRACT at render time.
 *              The Registry is the authority after a reset, so a name that has
 *              gone missing renders as missing rather than as a stale address.
 *
 *   `fixed`  — an address we cannot ask the chain for, because nothing on the
 *              chain indexes it: the rails the fork inherited, and verex's own
 *              deployments.json. These are copied by hand and go stale
 *              silently. Prefer `names` whenever the seed puts it in the
 *              Registry; every `fixed` entry says where it was copied from.
 */
export type ContractSet = {
  /** Which chain these addresses are on. */
  chain: ChainKey;
  /** Sub-heading, when a service owns more than one family of contracts. */
  title?: string;
  titleKo?: string;
  /** Registry names — resolved live from the Registry contract. */
  names?: string[];
  /** Addresses that are not in any Registry. Copied by hand; say from where. */
  fixed?: { name: string; address: string }[];
  note?: string;
  noteKo?: string;
};

/**
 * The Jayverse services, what each one has, and on which chain.
 *
 * `contracts` names Registry entries wherever it can, so a service's row fills
 * itself in from the chain rather than from a list maintained here — if the
 * seed stops deploying something, the row goes quiet instead of lying.
 *
 * Liveness is checked at render time. It is genuinely useful (a demo estate's
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
  /** What this service has deployed, per chain. */
  contracts: ContractSet[];
  /** Which chains this service actually targets today. Not a wish list: each
   *  entry below cites where it is configured, because guessing here would
   *  produce a table that looks authoritative and is wrong. */
  chains: ChainKey[];
  /** Something true about this service that the chain cannot tell you. */
  note?: string;
  noteKo?: string;
};

// Verex's CTF backbone is deployed by verex's own tooling, not by the devnet
// seed, so it is in packages/contracts/deployments.json and NOT in the
// Registry. Copied from that file on 2026-09-16 — the same hand-copy problem
// as the rails chain definitions in lib/chains.ts, and for the same reason
// (rabbit deploys with `--source .`, so it cannot read a sibling repo).
// `NEXT_PUBLIC_DEVNET_JUSD` in .env.example already carries the first of these,
// which is how the duplication started.
const VEREX_DEVNET = [
  { name: "jUSD", address: "0x55F1b740d15c097eD1FfD0520540131A5B7127e6" },
  { name: "ConditionalTokens", address: "0x8676ea7FcCf586fBaB48B36e635264C473651B40" },
  { name: "CTFExchange", address: "0xF9abc16a92BFfA62a83c697264Bb4C05167991b5" },
];
const VEREX_SEPOLIA = [
  { name: "jUSD", address: "0xAc0328f49c4ED8ea1B1C1AaBb86441dD9682b6B6" },
  { name: "ConditionalTokens", address: "0xEB100D76E2F3E3B5176593b5aAfbEB5a1d90Fb04" },
  { name: "CTFExchange", address: "0xcB2271f5Eb6337a1938ab8a9190e12A9773599Cf" },
];

/** Name, blurb and URL come from lib/jayverse.ts so /projects and /chains
 *  cannot drift; only the chain-specific half is written here. */
function svc(
  key: string,
  chain: { contracts: ContractSet[]; chains: ChainKey[]; note?: string; noteKo?: string },
): Service {
  const p = jayverse(key);
  return { name: p.name, blurb: p.blurb, blurbKo: p.blurbKo, url: p.url, ...chain };
}

export const SERVICES: Service[] = [
  svc("rabbit", {
    // scripts/deploy.env: CHAIN=devnet, ANVIL_RPC_URL=<devnet>/rpc. Sepolia is
    // still reached by app/api/bundle (SEPOLIA_RPC) and /live/7702.
    chains: ["devnet", "sepolia", "local"],
    contracts: [
      {
        chain: "devnet",
        title: "Account abstraction & delegation",
        titleKo: "계정 추상화와 위임",
        names: [
          "EntryPoint", "DelegationManager", "SimpleFactory", "DelegationEntryPoint",
          "HybridDeleGatorImpl", "MultiSigDeleGatorImpl", "EIP7702StatelessDeleGatorImpl",
        ],
        note: "ERC-7710 session keys. The kit hardcodes no addresses, so services find them through the Registry — and UserOps go through the EntryPoint the fork carries, which is the address every 4337 tool already knows.",
        noteKo:
          "ERC-7710 세션 키. 킷이 주소를 하드코딩하지 않으므로 서비스들이 Registry 를 통해 찾는다. UserOp 은 포크가 실어 온 EntryPoint 를 지나가므로 주소가 모든 4337 도구가 이미 아는 그 값이다.",
      },
      {
        chain: "devnet",
        title: "Caveat enforcers",
        titleKo: "Caveat 집행자",
        names: [
          "ERC20TransferAmountEnforcer", "TimestampEnforcer", "AllowedMethodsEnforcer",
          "AllowedTargetsEnforcer", "LimitedCallsEnforcer", "ValueLteEnforcer",
        ],
        note: "What actually enforces a delegation's limits on chain — the difference between a budget the agent's code promises and one the chain imposes.",
        noteKo:
          "위임에 걸린 한도를 온체인에서 실제로 강제하는 것들 — 에이전트 코드가 약속하는 예산과 체인이 강제하는 예산의 차이다.",
      },
      {
        chain: "sepolia",
        title: "Base rails (inherited by the fork)",
        titleKo: "기본 레일 (포크가 물려받는 것)",
        fixed: [{ name: "EntryPoint v0.7", address: "0x0000000071727De22E5E9d8BAf0edAc6f37da032" }],
        note: "The canonical ERC-4337 EntryPoint, at the same address on every chain. Our two forks carry this one in rather than deploying their own; /live/7702 and the bundle demo reach it here.",
        noteKo:
          "표준 ERC-4337 EntryPoint — 모든 체인에서 같은 주소다. 우리 두 포크는 직접 배포하지 않고 이것을 물려받는다. /live/7702 와 번들 데모가 여기로 붙는다.",
      },
    ],
  }),
  svc("verex", {
    // packages/contracts/deployments.json: a devnet entry (313370) and the
    // staging/prod entries, both still on Sepolia (11155111).
    chains: ["devnet", "sepolia"],
    contracts: [
      {
        chain: "devnet",
        title: "Markets",
        titleKo: "마켓",
        names: ["MarketFactory"],
      },
      {
        chain: "devnet",
        title: "CTF backbone",
        titleKo: "CTF 백본",
        fixed: VEREX_DEVNET,
        note: "Pinned in verex's own deployments.json rather than the Registry — deployed by verex's tooling, not by the devnet seed. Copied here by hand, so it can go stale without the page noticing.",
        noteKo:
          "Registry 가 아니라 verex 자체의 deployments.json 에 고정돼 있다 — 데브넷 시드가 아니라 verex 도구가 배포하기 때문이다. 손으로 옮겨 적은 값이라, 낡아도 페이지가 알아채지 못한다.",
      },
      {
        chain: "sepolia",
        title: "CTF backbone (prod)",
        titleKo: "CTF 백본 (운영)",
        fixed: VEREX_SEPOLIA,
        note: "The Sepolia deployment verex ran before the devnet existed. Still live, and still where the oracle-dependent resolution tests run — Chainlink and UMA only answer on a real chain.",
        noteKo:
          "데브넷이 생기기 전 verex 가 올린 Sepolia 배포다. 아직 살아 있고, 오라클이 필요한 결정(resolution) 테스트는 여전히 여기서 돈다 — Chainlink 와 UMA 는 진짜 체인에서만 답한다.",
      },
      {
        chain: "sepolia",
        title: "Oracle",
        titleKo: "오라클",
        fixed: [{ name: "Chainlink ETH/USD", address: "0x694AA1769357215DE4FAC081bf1f309aDC325306" }],
        note: "Live here; frozen at the fork block on our two chains, which is the main reason Sepolia is still in the estate.",
        noteKo:
          "여기서는 살아 있고, 우리 두 체인에서는 포크 시점에 멈춰 있다. Sepolia 를 계속 두는 가장 큰 이유가 이것이다.",
      },
    ],
  }),
  svc("token", {
    chains: ["devnet"],
    contracts: [
      {
        chain: "devnet",
        names: ["JYVE", "JUSD", "Exchange"],
        note: "Deployed fresh by the seed, never inherited from the fork. jUSD is the Jayverse dollar — our own, not Circle's USDC — and the Exchange is the constant-product pool that prices JYVE against it, because a self-made token has no oracle.",
        noteKo:
          "시드가 새로 배포한다 — 포크에서 물려받은 것이 아니다. jUSD 는 Jayverse 의 달러이고(Circle 의 USDC 가 아니다), Exchange 는 JYVE 를 그에 대해 가격 매기는 상수곱 풀이다 — 자체 토큰에는 오라클이 없기 때문이다.",
      },
    ],
  }),
  svc("defi", {
    chains: ["devnet"],
    contracts: [
      {
        chain: "devnet",
        names: ["LiquidityPool", "jeETH", "jweETH", "MockAVS"],
        note: "The from-scratch EtherFi study: a rebasing vault and its non-rebasing wrapper.",
        noteKo: "EtherFi 를 처음부터 다시 만들어 본 것: 리베이싱 볼트와 비리베이싱 래퍼.",
      },
    ],
  }),
  svc("wallet", {
    chains: ["devnet", "local"],
    contracts: [],
    note: "No contracts of its own. It lists this chain as a network and its simulate API forks from the devnet, so a preview and the real thing agree.",
    noteKo:
      "자체 컨트랙트는 없다. 이 체인을 네트워크로 등록해 두고, simulate API 가 데브넷을 포크하므로 미리보기와 실제가 일치한다.",
  }),
  svc("number", {
    chains: ["devnet"],
    contracts: [],
    note: "Reads the chain; deploys nothing to it.",
    noteKo: "체인을 읽기만 하고, 아무것도 배포하지 않는다.",
  }),
  svc("game", {
    chains: ["devnet"],
    contracts: [],
    note: "Runs inside the Rabbit service and reads markets from the devnet through Verex.",
    noteKo: "Rabbit 서비스 안에서 돌고, Verex 를 통해 데브넷의 마켓을 읽는다.",
  }),
];

/** Every Registry name any service asks for, deduplicated — one read per name. */
export const REGISTRY_NAMES: string[] = Array.from(
  new Set(SERVICES.flatMap((s) => s.contracts.flatMap((c) => c.names ?? []))),
);

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
