import { readFileSync } from "node:fs";
import { createPublicClient, createWalletClient, publicActions, http, defineChain, erc20Abi, parseUnits, encodeFunctionData, type Address, type Hex } from "viem";
import {
  createDelegation,
  createExecution,
  toMetaMaskSmartAccount,
  Implementation,
  ScopeType,
  CaveatType,
  ExecutionMode,
  type Delegation,
} from "@metamask/smart-accounts-kit";
import {
  overrideDeployedEnvironment,
  SIGNABLE_DELEGATION_TYPED_DATA,
  toDelegationStruct,
} from "@metamask/smart-accounts-kit/utils";
import { DelegationManager } from "@metamask/smart-accounts-kit/contracts";
import { agentAccount, agentAddress } from "./agent-wallet";

// J2 / R-A — mandate 를 **체인이 강제하게** 만드는 부분.
//
// 2026-08-26 결정(jay, 옵션 c): 서버가 상한과 만료를 지키는 척하는 대신,
// MetaMask delegation framework 를 로컬 anvil 에 배포하고 두 개의 caveat enforcer 가
// 온체인에서 강제하게 한다 — `ERC20TransferAmountEnforcer`(상한) 와
// `TimestampEnforcer`(만료). 데모의 핵심 문장인 "안전이 신뢰가 아니라 산수"가
// 이 파일에서 비로소 참이 된다.
//
// ERC-7715(`wallet_requestExecutionPermissions`)를 쓰지 **않는** 이유: 그 호출은
// MetaMask 확장이 답하고 DelegationManager 주소도 지갑이 응답으로 알려주므로,
// 확장이 chainId 31337 을 지원해야만 한다. 우리 배포는 CREATE2 도 아니라 주소가
// 지갑의 기대값과 맞을 수도 없다. 반면 delegation 자체는 평범한 EIP-712 이고
// `verifyingContract` 와 `chainId` 를 **우리가 넘긴다** — 그래서 anvil 에서 동작한다.
//
// 콘솔 페이지에 ERC-7715 지원 여부를 실제로 물어보는 버튼(`getSupportedExecutionPermissions`)이
// 있다. 언젠가 31337 이 그 목록에 들어오면 이 파일 대신 그 경로로 갈 수 있다.

/// 배포 산출물. `scripts/deploy-delegation.mjs` 가 쓴다.
const DEPLOYMENT_FILE = process.env.DELEGATION_DEPLOYMENT ?? ".delegation-anvil.json";
const RPC = process.env.ANVIL_RPC_URL ?? "http://127.0.0.1:8545";

type Env = Awaited<ReturnType<typeof loadEnv>>["environment"];

let cached: { chainId: number; environment: ReturnType<typeof identity> } | null = null;
function identity<T>(v: T): T {
  return v;
}

/// 배포 파일을 읽어 SDK 에 등록한다.
///
/// `overrideDeployedEnvironment` 를 부르는 이유: SDK 는 chainId → 주소 표를 들고
/// 있는데 31337 은 그 표에 없다. 등록하지 않으면 `createDelegation` 이 enforcer
/// 주소를 찾지 못한다.
export function loadEnv() {
  if (cached) return cached;
  let raw: string;
  try {
    raw = readFileSync(DEPLOYMENT_FILE, "utf8");
  } catch {
    throw new Error(
      `delegation framework is not deployed (${DEPLOYMENT_FILE} missing). ` +
        `Run: node scripts/deploy-delegation.mjs`,
    );
  }
  const parsed = JSON.parse(raw) as { chainId: number; environment: unknown };
  overrideDeployedEnvironment(parsed.chainId, "1.3.0", parsed.environment as never);
  cached = { chainId: parsed.chainId, environment: parsed.environment as never };
  return cached;
}

/// 배포 여부만 알고 싶을 때(프리플라이트). 던지지 않는다.
export function delegationEnvOrNull() {
  try {
    return loadEnv();
  } catch {
    return null;
  }
}

function chainOf(chainId: number) {
  return defineChain({
    id: chainId,
    name: `local-${chainId}`,
    nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
    rpcUrls: { default: { http: [RPC] } },
  });
}

export function publicClientFor(chainId: number) {
  return createPublicClient({ chain: chainOf(chainId), transport: http(RPC) });
}

/// 시뮬레이션 전용. **msg.sender 가 에이전트여야** enforcer 가 진짜 이유로 거절한다 —
/// 계정을 붙이지 않으면 "위임 대상이 아님"으로 먼저 튕겨 만료를 확인할 수 없다.
function agentClientFor(chainId: number) {
  return createWalletClient({ account: agentAccount(), chain: chainOf(chainId), transport: http(RPC) }).extend(publicActions);
}

/// 소유자의 **스마트 계정** 주소. MetaMask EOA 가 그 소유자다.
///
/// 왜 EOA 를 그대로 쓰지 않나: `redeemDelegations` 는 위임자의 컨텍스트에서
/// 실행돼야 하므로 위임자가 DeleGator 인터페이스를 구현한 컨트랙트여야 한다.
/// EIP-7702 로 EOA 를 업그레이드하는 길도 있지만 anvil 의 Prague 하드포크가
/// 필요하고, Hybrid 스마트 계정은 그 요구 없이 같은 결과를 준다.
///
/// 서명자를 넘기지 않는 이유: 여기서는 주소와 팩토리 인자만 필요하고, 실제
/// 서명은 브라우저의 MetaMask 가 한다(스마트 계정이 ERC-1271 로 검증한다).
export async function ownerSmartAccount(ownerEoa: Address) {
  const { chainId } = loadEnv();
  const client = publicClientFor(chainId);
  return toMetaMaskSmartAccount({
    client,
    implementation: Implementation.Hybrid,
    deployParams: [ownerEoa, [], [], []],
    // 소유자당 하나면 충분하다. 소금을 바꾸면 같은 EOA 로 계정이 여럿 생기고
    // "내 USDC 가 어디 있지"가 즉시 헷갈린다.
    deploySalt: "0x",
  });
}

/// 스마트 계정이 아직 배포되지 않았다면 배포한다.
///
/// 배포는 permissionless 라 누가 가스를 내도 된다 — anvil 에서는 에이전트가 낸다.
/// 반드시 **redeem 이전에** 되어 있어야 한다: 배포되지 않은 계정에는 실행할 코드가
/// 없어서 `redeemDelegations` 가 되돌아간다.
export async function ensureOwnerDeployed(ownerEoa: Address): Promise<{ address: Address; deployed: boolean; txHash: Hex | null }> {
  const { chainId } = loadEnv();
  const account = await ownerSmartAccount(ownerEoa);
  const client = publicClientFor(chainId);
  const code = await client.getCode({ address: account.address });
  if (code && code !== "0x") return { address: account.address, deployed: true, txHash: null };

  const { factory, factoryData } = await account.getFactoryArgs();
  if (!factory || !factoryData) throw new Error("smart account has no factory args — cannot deploy");

  const wallet = createWalletClient({ account: agentAccount(), chain: chainOf(chainId), transport: http(RPC) });
  const txHash = await wallet.sendTransaction({ to: factory, data: factoryData });
  await client.waitForTransactionReceipt({ hash: txHash });
  return { address: account.address, deployed: false, txHash };
}

export type MandateTerms = {
  /// 위임자 = 소유자의 **스마트 계정** 주소(MetaMask EOA 가 아니다).
  delegator: Address;
  /// 상한(USDC, 사람 단위).
  capUsdc: number;
  /// 만료(unix seconds).
  expiresAtSec: number;
  usdc: Address;
};

/// 위임 구조체를 **서버가 만든다.** 브라우저는 서명만 한다.
///
/// 이유는 O1 과 같다 — 서명 대상이 구조체 해시이므로 정의가 둘이면 한쪽이 어긋난
/// 순간 *틀린 메시지에 대한 유효한 서명*이 나오고, 에러는 구조체를 언급하지 않는다.
/// 그래서 정의는 여기 한 곳에만 둔다.
export function buildMandate(t: MandateTerms): Delegation {
  const { environment } = loadEnv();
  return createDelegation({
    environment: environment as never,
    from: t.delegator,
    to: agentAddress(),
    // 상한: 이 위임으로 할 수 있는 일은 "이 토큰을 최대 N 만큼 transfer" 하나뿐이다.
    scope: {
      type: ScopeType.Erc20TransferAmount,
      tokenAddress: t.usdc,
      maxAmount: parseUnits(t.capUsdc.toFixed(6), 6),
    },
    // 만료: 계획서가 money shot 이라 부르는 것. 아무도 취소하지 않아도 이 시각이
    // 지나면 enforcer 가 계속 거절한다. **블록 시간 기준**이고 벽시계와 다르다.
    caveats: [
      {
        type: CaveatType.Timestamp,
        afterThreshold: 0,
        beforeThreshold: t.expiresAtSec,
      },
    ],
  });
}

/// 브라우저가 MetaMask 로 서명할 EIP-712 페이로드. 서버가 만들어 내려보낸다.
///
/// **salt 를 문자열로 내린다** (2026-08-28). `toDelegationStruct` 는 salt 를
/// `bigint` 로 돌려주는데, JSON 에는 bigint 가 없다 — `NextResponse.json()` 이
/// `TypeError: Do not know how to serialize a BigInt` 을 던지고, Next 는 **본문
/// 없는 500** 을 보낸다. 브라우저에는 그것이 `Unexpected end of JSON input` 으로만
/// 도착해서, 서명 한 번 해 보지도 못한 채 원인이 파서 에러로 위장됐다.
///
/// 문자열이어도 서명은 같다: `eth_signTypedData_v4` 는 uint256 을 10진 문자열로
/// 받고, 해시는 값에 대해 계산되지 표현에 대해 계산되지 않는다.
export function mandateTypedData(delegation: Delegation) {
  const { chainId, environment } = loadEnv();
  const struct = toDelegationStruct({ ...delegation, signature: "0x" });
  return {
    domain: {
      chainId,
      name: "DelegationManager",
      version: "1",
      verifyingContract: (environment as { DelegationManager: Address }).DelegationManager,
    },
    types: SIGNABLE_DELEGATION_TYPED_DATA,
    primaryType: "Delegation" as const,
    message: { ...struct, salt: struct.salt.toString() },
  };
}

/// 위임을 행사한다 — 소유자 스마트 계정에서 에이전트로 USDC 를 옮긴다.
///
/// **여기가 강제 지점이다.** 상한을 넘기거나 만료 뒤에 부르면 enforcer 가
/// revert 시킨다. 서버 코드가 착해서가 아니라 컨트랙트가 산수를 해서 막는다.
/// 실제로 보내지 않고 **체인에 물어보기만** 한다.
///
/// 만료된 mandate 로 틱이 돌 때 쓴다. DB 의 만료 시각만 보고 "체인이 거절했다"고
/// 저널에 적으면 그건 거짓말이다 — 묻지도 않았으니까. 시뮬레이션은 가스도 들지
/// 않고 enforcer 의 실제 거절 사유를 돌려주므로, 저널이 참말을 하게 된다.
export async function simulateMandateDraw(args: {
  delegation: Delegation;
  usdc: Address;
  amountUsdc: number;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const { chainId, environment } = loadEnv();
  const manager = (environment as { DelegationManager: Address }).DelegationManager;
  const execution = createExecution({
    target: args.usdc,
    callData: encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [agentAddress(), parseUnits(args.amountUsdc.toFixed(6), 6)],
    }),
  });
  try {
    await DelegationManager.simulate.redeemDelegations({
      client: agentClientFor(chainId),
      delegationManagerAddress: manager,
      delegations: [[args.delegation]],
      modes: [ExecutionMode.SingleDefault],
      executions: [[execution]],
    });
    return { ok: true };
  } catch (e) {
    const decoded = DelegationManager.decode.redeemDelegationsError(e);
    return { ok: false, reason: decoded ? JSON.stringify(decoded) : String(e).slice(0, 200) };
  }
}

export async function redeemMandate(args: {
  delegation: Delegation;
  usdc: Address;
  amountUsdc: number;
}): Promise<Hex> {
  const { chainId, environment } = loadEnv();
  const manager = (environment as { DelegationManager: Address }).DelegationManager;

  // 위임이 허락하는 유일한 행동: 이 토큰을 에이전트에게 transfer.
  const execution = createExecution({
    target: args.usdc,
    callData: encodeFunctionData({
      abi: erc20Abi,
      functionName: "transfer",
      args: [agentAddress(), parseUnits(args.amountUsdc.toFixed(6), 6)],
    }),
  });

  const wallet = createWalletClient({ account: agentAccount(), chain: chainOf(chainId), transport: http(RPC) });
  try {
    const txHash = await DelegationManager.execute.redeemDelegations({
      client: wallet,
      delegationManagerAddress: manager,
      delegations: [[args.delegation]],
      modes: [ExecutionMode.SingleDefault],
      executions: [[execution]],
    });
    await publicClientFor(chainId).waitForTransactionReceipt({ hash: txHash });
    return txHash;
  } catch (e) {
    // enforcer 가 거절하면 그 **이름**이 나와야 한다. "transaction reverted" 로는
    // 상한에 걸린 건지 만료된 건지 구별할 수 없고, 그 구별이 이 데모의 전부다.
    const decoded = DelegationManager.decode.redeemDelegationsError(e);
    if (decoded) throw new Error(`delegation refused on-chain: ${JSON.stringify(decoded)}`);
    throw e;
  }
}

export type { Env };
