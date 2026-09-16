// The Jayverse ecosystem, as one list.
//
// Two pages describe the same set of services for different reasons: /projects
// answers "what did jay build", /devnet answers "what is on this chain". They
// were about to hold two copies of the same names, blurbs and URLs, so the
// shared half lives here and each page adds only what it alone needs —
// /devnet keeps the Registry names and the chain-specific notes in
// lib/devnet.ts, which reads this file rather than repeating it.
//
// `key` is the join between the two. Renaming one is a type error, not a
// silently mismatched card.

export type JayverseProject = {
  key: string;
  name: string;
  /** One line, in the voice of what it demonstrates rather than what it is. */
  blurb: string;
  blurbKo: string;
  /** The running app, when there is one to open. */
  url?: string;
  /** The port this project's dev server uses. When rabbit is itself being
   *  served from a local or Tailscale address, the card links to this port on
   *  the SAME host instead of production — so the estate is browsable from a
   *  phone over Tailscale, where "localhost" would mean the phone. */
  localPort?: number;
};

// No repo links here. The cards are a single tap target each (jay,
// 2026-09-15), and six of the eight repos are private anyway — a link most
// readers would get a 404 from. Source lives on the project pages.
export const JAYVERSE: JayverseProject[] = [
  {
    key: "verex",
    name: "Verex",
    blurb:
      "A decentralized prediction market on conditional tokens — an order book, a market maker, and on-chain settlement.",
    blurbKo:
      "조건부 토큰 기반 탈중앙 예측 시장 — 호가창, 마켓메이커, 온체인 정산.",
    url: "https://verex.jaylabs.xyz",
    localPort: 3000,
  },
  {
    key: "rabbit",
    name: "Rabbit",
    blurb:
      "This portal, and the account-abstraction work behind it: ERC-4337 UserOps and ERC-7715 session keys an agent can spend under.",
    blurbKo:
      "이 포털과 그 뒤의 계정 추상화 작업 — ERC-4337 UserOp, 그리고 에이전트가 한도 안에서 쓰는 ERC-7715 세션 키.",
    url: "https://www.jaylabs.xyz",
    localPort: 3100,
  },
  {
    // Renamed from "Jayverse Devnet" (jay, 2026-09-16): the page behind this
    // card now covers all three networks, and a card that names one of them
    // would send readers looking for the other two somewhere else.
    key: "devnet",
    name: "Jayverse Chains",
    blurb:
      "Three networks, side by side — the local Anvil fork, our always-on devnet at chain id 313370, and Sepolia.",
    blurbKo:
      "세 네트워크를 나란히 — 로컬 Anvil 포크, 체인 아이디 313370의 상시 가동 데브넷, 그리고 Sepolia.",
    url: "/chains",
  },
  {
    key: "token",
    name: "Token & Exchange",
    blurb:
      "JYVE and jUSD, priced against each other by a constant-product pool — the pool is the price, because a self-made token has no oracle.",
    blurbKo:
      "JYVE와 jUSD를 상수곱 풀로 서로 가격 매김 — 자체 토큰에는 오라클이 없으므로 풀 자체가 가격이다.",
    url: "https://exchange.jaylabs.xyz",
    localPort: 3070,
  },
  {
    key: "defi",
    name: "DeFi — jeETH",
    blurb:
      "EtherFi's mechanics rebuilt from scratch: a rebasing liquid-staking vault and its non-rebasing wrapper.",
    blurbKo:
      "EtherFi의 메커니즘을 처음부터 재구현 — 리베이싱 유동 스테이킹 볼트와 비리베이싱 래퍼.",
    url: "https://defi.jaylabs.xyz",
    localPort: 3030,
  },
  {
    key: "wallet",
    name: "Wallet",
    blurb:
      "An embedded wallet and an MV3 extension that simulates a transaction before you sign it.",
    blurbKo:
      "임베디드 지갑과 MV3 확장 — 서명 전에 트랜잭션을 시뮬레이션해 보여준다.",
    url: "https://wallet.jaylabs.xyz",
    localPort: 3060,
  },
  {
    key: "number",
    name: "Number",
    blurb: "Maths and investment research notes, kept private.",
    blurbKo: "수학과 투자 리서치 노트 — 비공개.",
    url: "https://number.jaylabs.xyz",
  },
  {
    key: "game",
    name: "Game — 3D street",
    blurb: "Walk a street in the browser and find live Verex markets on the boards.",
    blurbKo: "브라우저에서 거리를 걸으며 게시판에 붙은 실시간 Verex 마켓을 찾는다.",
    url: "/game",
  },
];

/** Look one up by key. Throws rather than returning undefined: every caller
 *  here has a literal key, so a miss is a typo to fix, not a case to handle. */
export function jayverse(key: string): JayverseProject {
  const found = JAYVERSE.find((p) => p.key === key);
  if (!found) throw new Error(`no Jayverse project with key "${key}"`);
  return found;
}

/**
 * True when rabbit is being served from a machine on jay's own network rather
 * than from the internet: localhost, a private LAN address, or a Tailscale one.
 *
 * Tailscale hands out addresses in 100.64.0.0/10 (the CGNAT range) and
 * MagicDNS names under *.ts.net. That range is the whole point of this
 * function: on a phone, `localhost` means the phone, so a link has to carry
 * the address the browser actually reached rabbit on.
 */
export function isLocalHost(host: string | null | undefined): boolean {
  if (!host) return false;
  const name = hostname(host);
  if (name === "localhost" || name === "127.0.0.1" || name === "::1" || name === "0.0.0.0") return true;
  if (name.endsWith(".ts.net") || name.endsWith(".local")) return true;
  const octets = name.match(/^(\d+)\.(\d+)\.\d+\.\d+$/);
  if (!octets) return false;
  const a = Number(octets[1]);
  const b = Number(octets[2]);
  if (a === 100 && b >= 64 && b <= 127) return true; // Tailscale CGNAT
  if (a === 10) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

/** Strip the port, and the brackets an IPv6 Host header carries. */
function hostname(host: string): string {
  const h = host.trim().toLowerCase();
  if (h.startsWith("[")) return h.slice(1, h.indexOf("]"));
  return h.replace(/:\d+$/, "");
}

/**
 * Where a card should point, given the host the page was requested on.
 *
 * Off a local host, or for a project with no dev server of its own, this is
 * just the production URL. On a local host it becomes the same host with the
 * project's dev port — so opening rabbit at http://100.111.162.0:3100 from a
 * phone gives links to http://100.111.162.0:3070 and so on, all reachable
 * over the same Tailscale connection.
 *
 * Relative URLs (/devnet, /game) are already same-origin and pass through.
 */
export function projectUrl(p: JayverseProject, host?: string | null): string | undefined {
  if (!p.url) return undefined;
  if (!p.url.startsWith("http")) return p.url;
  if (!p.localPort || !isLocalHost(host)) return p.url;
  return `http://${hostname(host!)}:${p.localPort}`;
}
