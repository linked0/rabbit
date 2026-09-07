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
  /// verex 배포자·MM·faucet 서명자. 참여자 패널이 잔고를 보여주는 데 쓴다.
  operator: `0x${string}` | null;
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

// ── Jayverse AA (docs/features/jayverse-aa.md §6) — /markets 의 견적 + 배치 콜 인코딩 ──
//
// 문서의 lib/verex.ts 항목이 여기 있는 이유: "이미 동등한 클라이언트가 있으면 확장"
// — 이 파일이 콘솔이 쓰는 verex REST 클라이언트라서 목록/호가는 위의 `verex` 를
// 그대로 쓰고, 아래는 /markets 전용의 견적 계산과 calldata 인코딩만 더한다.
// (lib/verex.ts 는 verexUrl() 링크 헬퍼라 이름만 겹치는 다른 파일이다.)

import { encodeFunctionData } from "viem";
import { CTFExchangeAbi, MockUSDCAbi } from "@verex/sdk";
import type { EncodedCall } from "./aa-bet";

export type VerexQuote = {
  slug: string;
  outcome: string;
  tokenId: string;
  /// USDC per share, 시장가 스냅샷 (book mid 우선, 없으면 outcome price)
  price: number;
  /// 사용자가 태우는 USDC (human units)
  usdc: number;
  /// usdc / price — 받게 될 outcome tokens (human units)
  shares: number;
};

/// 베팅 견적 — 마켓의 outcome 가격(호가 mid 우선)으로 USDC → shares 를 계산한다.
/// v1 은 스냅샷 견적이다: 체결 시점의 슬리피지 경계는 open question 3 과 함께 온다.
export async function quoteBet(slug: string, outcome: string, usdc: number): Promise<VerexQuote> {
  const market = await verex.market(slug);
  const o = market.outcomes.find((x) => x.label.toLowerCase() === outcome.toLowerCase());
  if (!o) throw new Error(`market ${slug} has no outcome "${outcome}"`);
  let price = o.price;
  try {
    const book = await verex.book(slug, o.label);
    if (book.mid != null && book.mid > 0) price = book.mid;
  } catch {
    // 호가가 없으면 outcome price 로 견적 — 견적 실패가 베팅 자체를 막을 이유는 없다.
  }
  if (!(price > 0 && price < 1)) throw new Error(`no usable price for ${slug}/${outcome}`);
  return { slug, outcome: o.label, tokenId: o.tokenId, price, usdc, shares: usdc / price };
}

/// executeBatch 의 두 콜을 인코딩한다: [approve(USDC→exchange, 정확히 cost), placeOrder].
///
/// approve 는 **정확한 금액**이다 (open question 4 의 v1 답: 매번 배치에 exact approve —
/// 원자적이고 blast radius 가 없다; 무한 allowance 는 나중 문제).
///
/// placeOrder 레그의 실상 (open question 3, 2026-09-07 verex 소스로 확인): CTFExchange 에는
/// placeOrder 가 없다. verex 는 EIP-712 서명 주문을 POST /orders 로 받아 오퍼레이터가
/// matchOrders 로 체결한다 — 트레이더 쪽에서 부를 수 있는 온체인 주문 함수가 없다.
/// 그래서 v1 은 문서 §4 의 "CLOB fill" 형태인 fillOrder(order, fillAmount) 를 스마트
/// 계정의 BUY 주문 구조체(서명 자리는 컨트랙트 서명용 placeholder)로 인코딩한다.
/// 실제 거래소에서는 이 레그가 revert 하고 — 배치가 원자적이라 approve 도 함께
/// 되돌아간다(§3 error 상태의 "nothing was spent"). 체결까지 가려면 verex 가
/// EIP-1271(POLY_GNOSIS_SAFE) 주문 접수 또는 체결 가능한 서명 주문 노출로 답해야 한다.
export function encodeBetCalls(args: {
  cfg: VerexConfig;
  quote: VerexQuote;
  /// 스마트 계정 주소 — maker/signer 로 들어간다
  account: `0x${string}`;
}): { approve: EncodedCall; placeOrder: EncodedCall } {
  const { cfg, quote, account } = args;
  if (!cfg.exchange || !cfg.usdc) throw new Error("verex config has no exchange/usdc address");

  const usdcE6 = parseUnits(quote.usdc.toFixed(6), 6);
  const priceE6 = parseUnits(quote.price.toFixed(6), 6);
  // BUY 올림 — 위 signLimitOrder 의 반올림 규약과 동일해야 한다.
  const sharesE6 = (usdcE6 * 1_000_000n) / priceE6;

  const approve: EncodedCall = {
    to: cfg.usdc,
    data: encodeFunctionData({
      abi: MockUSDCAbi,
      functionName: "approve",
      args: [cfg.exchange, usdcE6],
    }),
  };

  const order = {
    salt: randomSalt(),
    maker: account,
    signer: account,
    taker: "0x0000000000000000000000000000000000000000" as const,
    tokenId: BigInt(quote.tokenId),
    makerAmount: usdcE6,
    takerAmount: sharesE6,
    expiration: 0n,
    nonce: 0n,
    feeRateBps: 0n,
    side: Side.BUY,
    signatureType: SignatureType.POLY_GNOSIS_SAFE, // 컨트랙트 계정 서명 (EIP-1271)
    signature: "0x" as const,
  };
  const placeOrder: EncodedCall = {
    to: cfg.exchange,
    data: encodeFunctionData({
      abi: CTFExchangeAbi,
      functionName: "fillOrder",
      args: [order, usdcE6],
    }),
  };
  return { approve, placeOrder };
}
