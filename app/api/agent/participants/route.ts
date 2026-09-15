import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { createPublicClient, http, erc20Abi, formatEther, type Address } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { agentAddress } from "@/lib/agent-wallet";
import { verex } from "@/lib/verex-client";

export const dynamic = "force-dynamic";

// J2 — 참여자 잔고 (jay, 2026-09-02). 세 역할이 한 화면에 없으면 "돈이 어디 있지"가
// 매번 cast 조회가 된다: operator(verex 배포자·MM), user(위임하는 소유자), agent.
// 주소의 출처는 각자 다르다 — operator 는 verex /config 가, user 는 .env 의
// USER_PRIVATE_KEY(없으면 브라우저의 MetaMask)가, agent 는 이 서버가 안다.

const RPC = process.env.ANVIL_RPC_URL ?? "http://127.0.0.1:8545";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // 사용자 주소의 출처는 둘이고 env 가 이긴다 (jay, 2026-09-02): USER_PRIVATE_KEY 가
  // 설정돼 있으면 지갑을 연결하기 전에도 잔고와 펀딩 버튼이 살아 있어야 한다.
  const fromEnv = process.env.USER_PRIVATE_KEY?.trim();
  let userAddr: Address | null = null;
  if (fromEnv) {
    try {
      userAddr = privateKeyToAccount(fromEnv as `0x${string}`).address;
    } catch {
      // 잘못 붙여넣은 키는 조용히 무시하지 않는다 — user 행이 왜 비었는지 말해야 한다.
      return NextResponse.json({ error: "USER_PRIVATE_KEY is set but not a valid 0x… private key" }, { status: 500 });
    }
  }
  const owner = userAddr ?? (new URL(req.url).searchParams.get("owner") as Address | null);

  try {
    const cfg = await verex.config().catch(() => null);
    const pub = createPublicClient({ transport: http(RPC) });
    const chainId = await pub.getChainId();

    const balancesOf = async (address: Address) => {
      const eth = await pub.getBalance({ address }).then((v) => Number(formatEther(v))).catch(() => null);
      const jusd = cfg?.jusd
        ? await pub
            .readContract({ address: cfg.jusd, abi: erc20Abi, functionName: "balanceOf", args: [address] })
            .then((v) => Number(v) / 1e6)
            .catch(() => null)
        : null;
      return { eth, jusd };
    };

    const rows: { role: string; address: Address | null; eth: number | null; jusd: number | null }[] = [];
    rows.push(
      cfg?.operator
        ? { role: "operator", address: cfg.operator, ...(await balancesOf(cfg.operator)) }
        : { role: "operator", address: null, eth: null, jusd: null },
    );
    rows.push(owner ? { role: "user", address: owner, ...(await balancesOf(owner)) } : { role: "user", address: null, eth: null, jusd: null });
    rows.push({ role: "agent", address: agentAddress(), ...(await balancesOf(agentAddress())) });

    return NextResponse.json({ chainId, rows });
  } catch (e) {
    const message = String(e instanceof Error ? e.message : e);
    return NextResponse.json({ error: `participants failed: ${message}` }, { status: 500 });
  }
}
