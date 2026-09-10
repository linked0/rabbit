import { prepareTransaction, type ThirdwebClient } from "thirdweb";
import { sepolia } from "thirdweb/chains";
import type { Account } from "thirdweb/wallets";
import {
  bundleUserOp,
  createAndSignUserOp,
  getUserOpReceiptRaw,
  waitForUserOpReceipt,
} from "thirdweb/wallets/smart";
import type { AaBundlerEnv } from "./aa-bundler";

// Jayverse AA §6 — 배치 UserOp 전송. 설계: docs/features/jayverse-rabbit.md §4·§6.
//
// /live/aa 의 useSendBatchTransaction 을 그대로 안 쓰는 이유: 그 경로는 UserOp 해시를
// 삼키고 온체인 tx 해시만 돌려준다(thirdweb 내부에서 영수증까지 기다린 뒤 반환).
// §3 드로어는 "bundling" 단계에서 UserOp 해시를 먼저 보여줘야 하므로, 같은 스마트
// 계정 스택의 저수준 API(createAndSignUserOp → bundleUserOp → waitForUserOpReceipt)로
// 단계를 쪼갠다. 팩토리·EntryPoint 기본값이 ConnectButton 의 accountAbstraction 과
// 같아서 주소도 동일하게 나온다.

/// API 라우트가 인코딩해 내려주는 콜 하나. value 는 JSON 을 건너므로 string.
export type EncodedCall = {
  to: `0x${string}`;
  data: `0x${string}`;
  value?: string;
};

export type AaBetPhase =
  | { phase: "signing" } // MetaMask 팝업 — UserOp 해시에 오너 EOA 가 서명
  | { phase: "bundling"; userOpHash: `0x${string}` } // 번들러 제출 후 영수증 대기
  | { phase: "success"; userOpHash: `0x${string}`; transactionHash: `0x${string}` };

export type AaBetResult = {
  userOpHash: `0x${string}`;
  transactionHash: `0x${string}`;
};

/// executeBatch([approve, placeOrder]) 를 하나의 UserOperation 으로 보낸다.
/// adminAccount 는 오너 EOA(MetaMask) — 스마트 계정이 아니라 그 소유자가 서명한다.
export async function sendAaBet(args: {
  client: ThirdwebClient;
  adminAccount: Account;
  env: AaBundlerEnv;
  calls: EncodedCall[];
  onPhase?: (p: AaBetPhase) => void;
}): Promise<AaBetResult> {
  const { client, adminAccount, env, calls, onPhase } = args;

  // §7 — 로컬 anvil 은 브라우저에서 못 보낸다: thirdweb 번들러는 chainId 로 라우팅하고
  // anvil 은 Sepolia 의 chainId 를 흉내내므로 진짜 Sepolia 로 가버린다. 로컬 검증은
  // 셀프 릴레이 스크립트가 담당한다(번들러를 구현하지 않는다는 §7 결정).
  if (env.mode === "self-relay") {
    throw new Error(
      "AA_MODE=local: the browser path has no bundler — run `node scripts/aa-self-relay.mjs` " +
        "to relay a UserOp through EntryPoint.handleOps on anvil instead.",
    );
  }

  const chain = sepolia;
  const transactions = calls.map((c) =>
    prepareTransaction({
      to: c.to,
      data: c.data,
      value: BigInt(c.value ?? "0"),
      chain,
      client,
    }),
  );

  onPhase?.({ phase: "signing" });
  // 계정 미배포면 initCode 가 자동으로 들어간다 — §4 의 counterfactual deploy.
  const signedUserOp = await createAndSignUserOp({
    transactions,
    adminAccount,
    client,
    smartWalletOptions: { chain, sponsorGas: env.sponsorGas },
  });

  const bundlerOptions = { chain, client };
  const userOpHash = await bundleUserOp({ userOp: signedUserOp, options: bundlerOptions });
  onPhase?.({ phase: "bundling", userOpHash });

  const receipt = await waitForUserOpReceipt({ ...bundlerOptions, userOpHash });

  // 번들 tx 성공 ≠ UserOp 성공: 내부 콜이 되돌아도 번들 tx 는 성공으로 남는다.
  // 원자성(§4)을 정직하게 보고하려면 UserOperationEvent 의 success 를 봐야 한다.
  const raw = await getUserOpReceiptRaw({ ...bundlerOptions, userOpHash });
  if (raw && !raw.success) {
    throw new Error(
      `UserOp reverted atomically — nothing was spent (userOpHash ${userOpHash}).`,
    );
  }

  const result: AaBetResult = { userOpHash, transactionHash: receipt.transactionHash };
  onPhase?.({ phase: "success", ...result });
  return result;
}
