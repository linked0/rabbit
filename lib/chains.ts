// The three networks Jayverse runs on, as one model.
//
// jay, 2026-09-16: "We use three networks — Anvil, devnet, Sepolia." The page
// that used to be /devnet now covers all three, so the per-chain facts that
// were constants in lib/devnet.ts become a list, and every read is
// parameterised on a chain instead of hardcoding the devnet's client.
//
// Each chain has a distinct JOB, and this file says so — the point of showing
// three columns is that they are NOT interchangeable:
//
//   local    the inner loop. Instant reset, snapshots, offline, break it freely.
//   devnet   shared state the cloud services target. Always on, always seeded.
//   sepolia  a real public chain: live oracles, and the only one MetaMask will
//            show an ERC-7715 permission popup for.
//
// ── Why the chain definitions are repeated here rather than imported ──
// ~/work/jayverse-rails/src/chains.ts is the canonical definition and these
// values are copied from it verbatim. rabbit cannot import it: Cloud Run
// deploys with `gcloud run deploy --source .` (scripts/deploy.sh), which
// uploads ONLY this directory, so a `file:../jayverse-rails` dependency
// resolves locally and then fails in Cloud Build. Until rails is published to
// a registry, the ids and URLs below must be kept in step with it by hand.
// Nothing here is a second source of truth for anything on chain — the
// Registry still is (see lib/devnet.ts).

import { createPublicClient, defineChain, http, type Chain } from "viem";
import { sepolia } from "viem/chains";

export type ChainKey = "local" | "devnet" | "sepolia";

export type ChainDef = {
  key: ChainKey;
  name: string;
  nameKo: string;
  /** The id this chain is SUPPOSED to have. What it actually reports is read
   *  at render time and shown instead when the two disagree — see §6 of the
   *  brief: the running local Anvil reports 11155111, not 31337. */
  chainId: number;
  /** Server-side RPC URL. */
  rpc: string;
  /** A second address for the same node, when there is one worth printing
   *  (the local chain over Tailscale — see `TAILSCALE_HOST`). */
  altRpc?: string;
  ws?: string;
  explorer?: string;
  explorerName?: string;
  /** What this chain is for, in one line. */
  role: string;
  roleKo: string;
  /** Seconds per block. Used for the cache TTL as much as for display. */
  blockTimeSec: number;
  /** The devnet's edge publishes a /status JSON the chain cannot report itself. */
  statusUrl?: string;
  faucet: string;
  faucetKo: string;
};

// jay's Mac on the tailnet. The local chain is only worth listing for other
// devices if they can actually reach it, and on a phone `localhost` means the
// phone — so the Tailscale address is printed beside 127.0.0.1 rather than
// instead of it. Anvil binds to 127.0.0.1 by default, so this address only
// answers after a restart with `--host 0.0.0.0`; the page says so.
const TAILSCALE_HOST = process.env.TAILSCALE_HOST ?? "100.111.162.0";

// ANVIL_RPC_URL does NOT mean "the local Anvil" in the cloud.
//
// The name is a leftover: scripts/deploy.sh binds it to the rabbit-devnet-rpc
// secret (CHAIN=devnet in scripts/deploy.env), so in the deployed service it
// holds https://devnet.jaylabs.xyz/rpc — "the chain this deployment talks to",
// which deploy.sh's own comment says is no longer the same thing. Reading it
// here unguarded printed the DEVNET's URL in the Local Anvil endpoints row in
// production, labelled as the local node. On Cloud Run the local chain is
// 127.0.0.1 by definition and nothing else, so we do not consult the env at all.
const LOCAL_RPC = process.env.K_SERVICE
  ? "http://127.0.0.1:8545"
  : process.env.ANVIL_RPC_URL ?? "http://127.0.0.1:8545";

const DEVNET_URL = process.env.DEVNET_URL ?? "https://devnet.jaylabs.xyz";

// Sepolia's RPC is a server-side secret today and is NOT forwarded to Cloud Run
// (scripts/deploy.sh binds rabbit-sepolia-rpc to ANVIL_RPC_URL only when
// CHAIN=sepolia). Rather than leave the column blank in production, fall back
// to the same public node app/live/7702 already uses: these are head-block
// reads with no key and nothing to leak.
const SEPOLIA_FALLBACK_RPC = "https://ethereum-sepolia-rpc.publicnode.com";

export const CHAINS: ChainDef[] = [
  {
    key: "local",
    name: "Local Anvil",
    nameKo: "로컬 Anvil",
    chainId: 31337,
    rpc: LOCAL_RPC, // see the note above — not ANVIL_RPC_URL in the cloud
    altRpc: `http://${TAILSCALE_HOST}:8545`,
    role: "The inner loop — instant reset, snapshots, works offline, break it freely.",
    roleKo: "개발 루프 — 즉시 초기화, 스냅샷, 오프라인 가능, 마음껏 망가뜨려도 되는 체인.",
    blockTimeSec: 1,
    faucet: "Anvil's ten accounts are prefunded with 10,000 ETH each.",
    faucetKo: "Anvil 이 주는 계정 10 개가 각각 10,000 ETH 를 들고 시작한다.",
  },
  {
    key: "devnet",
    name: "Jayverse Devnet",
    nameKo: "Jayverse 데브넷",
    chainId: 313370,
    rpc: `${DEVNET_URL}/rpc`,
    ws: `${DEVNET_URL.replace(/^http/, "ws")}/ws`,
    // Otterscan is its own host, not /explorer (jay, 2026-09-15): it is a SPA
    // built for the root of a domain, and under a path prefix its assets
    // resolved to the status page. /explorer still redirects here.
    explorer: process.env.NEXT_PUBLIC_DEVNET_EXPLORER ?? "https://explorer.devnet.jaylabs.xyz",
    explorerName: "Otterscan",
    role: "Shared state every cloud service targets. Always on, seeded with the whole Jayverse address book.",
    roleKo: "클라우드 서비스 전부가 바라보는 공유 상태. 상시 가동이고 Jayverse 주소록 전체가 시드돼 있다.",
    blockTimeSec: 1,
    statusUrl: `${DEVNET_URL}/status`,
    faucet: `${DEVNET_URL}/faucet — budgeted, rate limited per address and per day.`,
    faucetKo: `${DEVNET_URL}/faucet — 예산제. 주소별·일별로 한도가 있다.`,
  },
  {
    key: "sepolia",
    name: "Sepolia",
    nameKo: "Sepolia",
    chainId: 11155111,
    rpc: process.env.SEPOLIA_RPC ?? SEPOLIA_FALLBACK_RPC,
    explorer: "https://sepolia.etherscan.io",
    explorerName: "Etherscan",
    role: "A real public chain: live Chainlink, and the only one MetaMask will show an ERC-7715 popup for.",
    roleKo: "실제 공개 체인 — 살아 있는 Chainlink, 그리고 MetaMask 가 ERC-7715 팝업을 띄워 주는 유일한 체인.",
    blockTimeSec: 12,
    faucet: "Public faucets (Google Cloud, Alchemy). We do not run one.",
    faucetKo: "공개 포싯(Google Cloud, Alchemy)을 쓴다. 우리가 운영하지는 않는다.",
  },
];

export function chainDef(key: ChainKey): ChainDef {
  const found = CHAINS.find((c) => c.key === key);
  if (!found) throw new Error(`no chain with key "${key}"`);
  return found;
}

/** True when this process is a Cloud Run container. K_SERVICE is set by the
 *  runtime and by nothing else, so it is the cheapest honest test for "the
 *  developer's laptop is not on the other end of localhost". */
export const IN_CLOUD = !!process.env.K_SERVICE;

export type BlockRow = { number: number; timestamp: number; txCount: number; hash: string };

export type ChainReading = {
  key: ChainKey;
  reachable: boolean;
  /** The id the node actually reports, which may differ from `def.chainId`. */
  chainId: number | null;
  blocks: BlockRow[];
  /** Newest block number and its timestamp, or null when unreachable. */
  head: number | null;
  headTime: number | null;
  /** How far the chain's clock sits behind the real one, in seconds.
   *  A fork continues the forked block's timestamp, so this is large and
   *  growing on local and devnet, and ~0 on Sepolia. */
  skew: number;
  /** Why we have nothing, when we have nothing. */
  error?: string;
  /** Set when we deliberately did not try (the local chain, from the cloud). */
  skipped?: boolean;
};

function clientFor(def: ChainDef) {
  const base: Chain =
    def.key === "sepolia"
      ? sepolia
      : defineChain({
          id: def.chainId,
          name: def.name,
          nativeCurrency: { name: "Test Ether", symbol: "ETH", decimals: 18 },
          rpcUrls: { default: { http: [def.rpc] } },
          testnet: true,
        });
  // Short timeout, no retries: this page re-renders every five seconds, so a
  // slow chain must degrade to "unreachable" fast rather than hold the whole
  // render. viem's defaults (10s, 3 retries) would stall a refresh for half a
  // minute on one dead node.
  return createPublicClient({ chain: base, transport: http(def.rpc, { timeout: 3500, retryCount: 0 }) });
}

// A tiny in-process cache, keyed by chain.
//
// AutoRefresh re-renders every 5s while Sepolia produces a block every 12s, so
// without this the page would make nine RPC calls per viewer per refresh to a
// public node for an answer that cannot have changed. TTL is the chain's own
// block time, which makes the cache invisible on the 1s chains and meaningful
// on Sepolia. In-process is the right scope: one Cloud Run instance
// (--max-instances 1) and correctness does not depend on it.
const cache = new Map<ChainKey, { at: number; value: ChainReading }>();

/** Read a chain's head, recent blocks and reported id. Never throws. */
export async function readChain(def: ChainDef, n = 8): Promise<ChainReading> {
  const empty = (extra: Partial<ChainReading>): ChainReading => ({
    key: def.key, reachable: false, chainId: null, blocks: [], head: null, headTime: null, skew: 0, ...extra,
  });

  // The local chain is on jay's laptop. From Cloud Run it is not merely down,
  // it is unreachable by construction — so do not spend 3.5s per refresh
  // proving it. Saying "run Anvil locally" is more useful than "unreachable".
  if (def.key === "local" && IN_CLOUD) return empty({ skipped: true });

  const hit = cache.get(def.key);
  if (hit && Date.now() - hit.at < def.blockTimeSec * 1000) return hit.value;

  let value: ChainReading;
  try {
    const client = clientFor(def);
    const [id, head] = await Promise.all([client.getChainId(), client.getBlockNumber()]);
    const numbers = Array.from({ length: n }, (_, i) => head - BigInt(i)).filter((b) => b >= 0n);
    const settled = await Promise.allSettled(
      numbers.map((b) => client.getBlock({ blockNumber: b, includeTransactions: false })),
    );
    const blocks: BlockRow[] = [];
    for (const r of settled) {
      // A pending block has a null number and hash. It cannot appear here (we
      // ask for numbers at or below the head) but the type allows it, and a
      // row keyed on a null hash would collide with the next one.
      if (r.status !== "fulfilled" || r.value.number === null || r.value.hash === null) continue;
      blocks.push({
        number: Number(r.value.number),
        timestamp: Number(r.value.timestamp),
        txCount: r.value.transactions.length,
        hash: r.value.hash,
      });
    }
    const headTime = blocks.length ? Math.max(...blocks.map((b) => b.timestamp)) : null;
    value = {
      key: def.key,
      reachable: true,
      chainId: id,
      blocks,
      head: Number(head),
      headTime,
      skew: headTime ? Math.max(0, Math.floor(Date.now() / 1000) - headTime) : 0,
    };
  } catch (err) {
    value = empty({ error: (err as Error).message });
  }
  cache.set(def.key, { at: Date.now(), value });
  return value;
}

/** Read all three, in parallel. */
export async function readChains(n = 8): Promise<Record<ChainKey, ChainReading>> {
  const readings = await Promise.all(CHAINS.map((c) => readChain(c, n)));
  return Object.fromEntries(readings.map((r) => [r.key, r])) as Record<ChainKey, ChainReading>;
}

// ── The capability matrix ────────────────────────────────────────────────
//
// This is what makes a Chains page more than three copies of the devnet page.
//
// The thing it exists to make visible: **Alchemy only sees Sepolia.** Its data
// APIs, webhooks, bundler and gas manager index chains Alchemy runs, and it
// runs neither 31337 nor 313370. On our two chains the same capability is
// self-hosted or absent. An Alchemy example labelled "the devnet" would be
// wrong, and the mistake is easy to make because the capability has the same
// NAME on all three — so the rows are named by capability and the cells say
// which implementation actually provides it.
//
// `state` renders honestly: "none" is a dash, "planned" is a dash with a note,
// and neither gets a green dot. A planned row is a promise, not a feature.

export type CellState = "self" | "vendor" | "planned" | "none";
export type Cell = { state: CellState; text: string; textKo: string };
export type CapabilityRow = {
  name: string;
  nameKo: string;
  local: Cell;
  devnet: Cell;
  sepolia: Cell;
};

const self = (text: string, textKo: string): Cell => ({ state: "self", text, textKo });
const vendor = (text: string, textKo: string): Cell => ({ state: "vendor", text, textKo });
const planned = (text: string, textKo: string): Cell => ({ state: "planned", text, textKo });
const none = (text = "—", textKo = "—"): Cell => ({ state: "none", text, textKo });

export const CAPABILITIES: CapabilityRow[] = [
  {
    name: "RPC", nameKo: "RPC",
    local: self("Anvil, direct", "Anvil 직접"),
    devnet: self("Anvil behind the method-allowlist proxy", "메서드 허용목록 프록시 뒤의 Anvil"),
    sepolia: vendor("Alchemy Node API", "Alchemy Node API"),
  },
  {
    name: "New heads / logs", nameKo: "새 헤드 · 로그",
    local: self("eth_subscribe on Anvil's ws", "Anvil ws 의 eth_subscribe"),
    devnet: self("/ws", "/ws"),
    sepolia: vendor("Alchemy Websockets", "Alchemy Websockets"),
  },
  {
    name: "History / transfers", nameKo: "히스토리 · 전송 내역",
    local: none("only with a local Otterscan", "로컬에 Otterscan 을 띄웠을 때만"),
    devnet: self("Otterscan ots_*", "Otterscan ots_*"),
    sepolia: vendor("Alchemy Transfers / Receipts", "Alchemy Transfers / Receipts"),
  },
  {
    name: "Token balances", nameKo: "토큰 잔액",
    local: self("direct reads", "직접 읽기"),
    devnet: self("direct reads, addresses from the Registry", "직접 읽기 + Registry 주소록"),
    sepolia: vendor("Alchemy Token API, or direct", "Alchemy Token API 또는 직접"),
  },
  {
    name: "Push on activity", nameKo: "활동 푸시",
    local: none(),
    devnet: self("poll /ws", "/ws 폴링"),
    sepolia: vendor("Alchemy Webhooks", "Alchemy Webhooks"),
  },
  {
    name: "ERC-4337 bundler", nameKo: "ERC-4337 번들러",
    local: none(),
    devnet: planned("self-hosted Rundler/Alto", "자체 호스팅 Rundler/Alto"),
    sepolia: vendor("Alchemy Bundler", "Alchemy Bundler"),
  },
  {
    name: "Sponsored gas", nameKo: "가스 대납",
    local: none(),
    devnet: planned("our own paymaster", "자체 paymaster"),
    sepolia: vendor("Alchemy Gas Manager", "Alchemy Gas Manager"),
  },
  {
    name: "Simulation", nameKo: "시뮬레이션",
    local: self("eth_call, debug_traceCall", "eth_call, debug_traceCall"),
    devnet: self("eth_call, debug_traceCall", "eth_call, debug_traceCall"),
    sepolia: vendor("userOp Simulation / Trace", "userOp Simulation / Trace"),
  },
  {
    name: "Oracles", nameKo: "오라클",
    local: none("frozen at the fork block", "포크 시점에 멈춰 있음"),
    devnet: none("frozen at the fork block", "포크 시점에 멈춰 있음"),
    sepolia: vendor("live Chainlink feeds", "살아 있는 Chainlink 피드"),
  },
  {
    name: "MetaMask ERC-7715 popup", nameKo: "MetaMask ERC-7715 팝업",
    local: none("chain not in MetaMask's list", "MetaMask 네트워크 목록에 없음"),
    devnet: none("chain not in MetaMask's list", "MetaMask 네트워크 목록에 없음"),
    sepolia: vendor("yes", "지원"),
  },
];

// ── Base rails on Sepolia ────────────────────────────────────────────────
// The devnet's address book is read from the Registry contract, which is the
// whole point of having one. Sepolia has no Registry of ours, so this short
// static list stands in — only the rails the fork inherits, at their real
// addresses. Keep it short: anything we deploy belongs on the devnet.
export const SEPOLIA_RAILS: { name: string; address: string; note: string; noteKo: string }[] = [
  {
    name: "EntryPoint v0.7",
    address: "0x0000000071727De22E5E9d8BAf0edAc6f37da032",
    note: "The same address on every chain — the devnet inherits this one from the fork.",
    noteKo: "모든 체인에서 같은 주소 — 데브넷은 포크를 통해 이것을 물려받는다.",
  },
  {
    name: "ETH / USD feed",
    address: "0x694AA1769357215DE4FAC081bf1f309aDC325306",
    note: "Chainlink. Live here; frozen at the fork block on our two chains.",
    noteKo: "Chainlink. 여기서는 살아 있고, 우리 두 체인에서는 포크 시점에 멈춰 있다.",
  },
];
