import { signOrder, Side, SignatureType, type Order as SignedOrder } from "@verex/sdk";
import { parseUnits } from "viem";
import { randomBytes } from "node:crypto";
import { agentAccount, agentAddress } from "./agent-wallet";

// J2 / R-B — verex 클라이언트.
//
// O1 의 답(2026-08-25): `@verex/sdk` 를 `file:` 링크로 가져온다. 복사하지 않는
// 이유는 서명 대상이 12개 필드 + 도메인에 대한 EIP-712 해시이고, 사본이 한 글자만
// 어긋나도 **틀린 메시지에 대한 유효한 서명**이 나오기 때문이다. 그 실패는 에러가
// 구조체를 언급하지 않아 원인을 가리키지 않는다. 배포 전에 퍼블리시로 바꾼다.

const BASE = process.env.VEREX_API_URL ?? "http://127.0.0.1:4000";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
    cache: "no-store",
  });
  const text = await res.text();
  const json = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(json?.error ?? `verex ${path} → ${res.status}`);
  return json as T;
}

export type VerexConfig = {
  chainId: number;
  /// EIP-712 verifyingContract. 로컬 `reset.sh` 마다 바뀌므로 **읽어야 하고**
  /// 절대 하드코딩하면 안 된다 — 낡은 주소는 유효하지만 틀린 서명을 만든다.
  exchange: `0x${string}` | null;
  ctf: `0x${string}` | null;
  usdc: `0x${string}` | null;
  tradingEnabled: boolean;
};

export type VerexMarket = {
  slug: string;
  title: string;
  status: string;
  conditionId: string;
  closesAt: string | null;
  outcomes: { id: string; label: string; price: number; tokenId: string }[];
};

export type VerexBook = {
  outcome: string;
  bids: { price: number; size: number }[];
  asks: { price: number; size: number }[];
  mid: number | null;
};

export type VerexWallet = {
  accountIndex: number | null;
  address: string;
  usdc: number;
  positions: {
    slug: string;
    outcome: string;
    tokens: number;
    price: number;
    value: number;
    costBasis: number;
    pnl: number;
    marketStatus: string;
    won: boolean | null;
  }[];
};

export const verex = {
  config: () => call<VerexConfig>("/config"),
  markets: () => call<{ markets: VerexMarket[] }>("/markets").then((r) => r.markets),
  market: (slug: string) => call<VerexMarket>(`/markets/${slug}`),
  book: (slug: string, outcome: string) =>
    call<VerexBook>(`/markets/${slug}/book?outcome=${encodeURIComponent(outcome)}`),
  wallet: (address = agentAddress()) => call<VerexWallet>(`/wallet/${address}`),
  faucet: (address = agentAddress()) =>
    call<{ address: string; usdc: number }>("/faucet", {
      method: "POST",
      body: JSON.stringify({ address }),
    }),
  /// V-D: 에이전트가 스스로 redeem 한 뒤 그 사실을 보고한다. verex 는 영수증을
  /// 검증한 뒤에야 기록한다 — 말을 믿고 쓰는 것이 아니다.
  reportRedeem: (slug: string, txHash: string, address = agentAddress()) =>
    call<{ slug: string; usdcReceived: number; recorded: boolean }>("/redeem", {
      method: "POST",
      body: JSON.stringify({ slug, address, txHash }),
    }),
};

function randomSalt(): bigint {
  return BigInt("0x" + randomBytes(8).toString("hex"));
}

/// 에이전트 키로 CTF 지정가 주문에 서명한다.
///
/// **지정가 전용인 이유**(2026-08-25 결정): 시장가는 클라이언트가 최악 조건에
/// 서명해야 하고, 그 경계를 고르는 것은 슬리피지 정책 — 서버가 아니라 이쪽의
/// 몫이다. 에이전트는 어차피 `p` 와 호가를 비교해 경계 있는 주문을 낸다.
export async function signLimitOrder(args: {
  tokenId: string;
  side: "BUY" | "SELL";
  /// outcome tokens, human units
  size: number;
  /// USDC per share, 0.01..0.99
  price: number;
  chainId: number;
  exchange: `0x${string}`;
}): Promise<SignedOrder> {
  const account = agentAccount();
  const sizeE6 = parseUnits(args.size.toFixed(6), 6);
  const priceE6 = parseUnits(args.price.toFixed(6), 6);
  // verex 의 `limitAmountsE6` 와 **같은 반올림**이어야 한다. BUY 는 올림, SELL 은
  // 내림 — 어긋나면 서명은 유효한데 서버의 금액 검사에서 400 이 난다.
  const usdcE6 = args.side === "BUY" ? (sizeE6 * priceE6 + 999_999n) / 1_000_000n : (sizeE6 * priceE6) / 1_000_000n;

  const order: SignedOrder = {
    salt: randomSalt(),
    maker: account.address,
    signer: account.address,
    taker: "0x0000000000000000000000000000000000000000",
    tokenId: BigInt(args.tokenId),
    makerAmount: args.side === "BUY" ? usdcE6 : sizeE6,
    takerAmount: args.side === "BUY" ? sizeE6 : usdcE6,
    expiration: 0n,
    nonce: 0n,
    feeRateBps: 0n,
    side: args.side === "BUY" ? Side.BUY : Side.SELL,
    signatureType: SignatureType.EOA,
    signature: "0x",
  };
  return signOrder(order, { chainId: args.chainId, verifyingContract: args.exchange }, account);
}

/// bigint 는 JSON 을 건널 수 없다. verex 는 같은 리더로 되읽는다.
function wire(o: SignedOrder) {
  return {
    salt: o.salt.toString(),
    maker: o.maker,
    signer: o.signer,
    taker: o.taker,
    tokenId: o.tokenId.toString(),
    makerAmount: o.makerAmount.toString(),
    takerAmount: o.takerAmount.toString(),
    expiration: o.expiration.toString(),
    nonce: o.nonce.toString(),
    feeRateBps: o.feeRateBps.toString(),
    side: o.side,
    signatureType: o.signatureType,
    signature: o.signature,
  };
}

export type PlaceResult = {
  orderId: string;
  status: string;
  totalTokens: number;
  totalUsdc: number;
  avgPrice: number | null;
  jobId: string | null;
};

/// 서명 + 제출을 한 번에. 서명은 여기서, 체결은 verex 에서.
export async function placeSignedLimitOrder(args: {
  slug: string;
  outcome: string;
  tokenId: string;
  side: "BUY" | "SELL";
  size: number;
  price: number;
}): Promise<PlaceResult> {
  const cfg = await verex.config();
  if (!cfg.exchange) throw new Error("verex has no exchange address configured — is it seeded?");
  const signed = await signLimitOrder({ ...args, chainId: cfg.chainId, exchange: cfg.exchange });
  return call<PlaceResult>("/orders", {
    method: "POST",
    body: JSON.stringify({
      slug: args.slug,
      outcome: args.outcome,
      side: args.side,
      type: "limit",
      amount: args.size,
      price: args.price,
      signedOrder: wire(signed),
    }),
  });
}
