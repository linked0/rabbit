import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { erc20Abi, type Address } from "viem";
import { agentAddress, agentKeyIsPersistent } from "@/lib/agent-wallet";
import { delegationEnvOrNull, publicClientFor, ownerSmartAccount } from "@/lib/delegation";
import { verex } from "@/lib/verex-client";

export const dynamic = "force-dynamic";

// J2 — 콘솔 상단의 프리플라이트.
//
// 이 화면이 있는 이유는 하나다: **가장 유력한 실패가 낡은 exchange 주소**이기
// 때문이다. verex 의 `reset.sh` 는 매번 새 주소로 배포하는데, 캐시된
// `verifyingContract` 로 서명하면 *틀린 메시지에 대한 완벽히 유효한 서명*이 나오고
// 에러 어디에도 구조체 이야기가 없다. 화면에 띄워 두면 40분짜리 추적이 한 번의
// 눈길로 끝난다. delegation framework 주소도 같은 이유로 같이 띄운다.

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const owner = new URL(req.url).searchParams.get("owner") as Address | null;

  // verex 와 delegation 은 **서로 독립적으로** 실패할 수 있고, 각각이 무엇을
  // 막는지 다르다. 하나의 "준비됨" 불빛으로 합치면 무엇을 고쳐야 하는지 사라진다.
  const verexResult = await verex
    .config()
    .then((config) => ({ ok: true as const, config }))
    .catch((e: unknown) => ({ ok: false as const, error: String(e instanceof Error ? e.message : e) }));

  const env = delegationEnvOrNull();
  let ownerAccount: { address: string; deployed: boolean; usdc: number | null } | null = null;
  let agentUsdc: number | null = null;

  if (env && verexResult.ok && verexResult.config.usdc) {
    const client = publicClientFor(env.chainId);
    const usdcAddr = verexResult.config.usdc;
    const read = (who: Address) =>
      client
        .readContract({ address: usdcAddr, abi: erc20Abi, functionName: "balanceOf", args: [who] })
        .then((v) => Number(v) / 1e6)
        .catch(() => null);

    agentUsdc = await read(agentAddress());

    if (owner) {
      const sa = await ownerSmartAccount(owner);
      const code = await client.getCode({ address: sa.address }).catch(() => undefined);
      ownerAccount = {
        address: sa.address,
        deployed: Boolean(code && code !== "0x"),
        usdc: await read(sa.address),
      };
    }
  }

  return NextResponse.json({
    agent: {
      address: agentAddress(),
      // 키가 휘발성이면 이미 부여된 mandate 가 재시작과 함께 고아가 된다.
      // 숨기면 데모가 조용히 거짓말을 하므로 화면이 이걸 봐야 한다.
      keyIsPersistent: agentKeyIsPersistent(),
      usdc: agentUsdc,
    },
    verex: verexResult.ok
      ? {
          reachable: true,
          chainId: verexResult.config.chainId,
          exchange: verexResult.config.exchange,
          usdc: verexResult.config.usdc,
          ctf: verexResult.config.ctf,
          tradingEnabled: verexResult.config.tradingEnabled,
        }
      : { reachable: false, error: verexResult.error },
    delegation: env
      ? {
          deployed: true,
          chainId: env.chainId,
          delegationManager: (env.environment as { DelegationManager: string }).DelegationManager,
          // R-A 가 실제로 기대는 두 컨트랙트. 상한과 만료는 여기서 강제된다.
          erc20TransferAmountEnforcer: (env.environment as { caveatEnforcers: Record<string, string> })
            .caveatEnforcers.ERC20TransferAmountEnforcer,
          timestampEnforcer: (env.environment as { caveatEnforcers: Record<string, string> })
            .caveatEnforcers.TimestampEnforcer,
          // **체인이 다르면 mandate 는 verex 거래를 강제하지 않는다.** 상한이 A 체인
          // 토큰을 지키고 거래가 B 체인에서 일어나면 데모의 주장이 거짓이 된다.
          matchesVerexChain: verexResult.ok ? verexResult.config.chainId === env.chainId : null,
        }
      : { deployed: false, hint: "node scripts/deploy-delegation.mjs" },
    ownerAccount,
  });
}
