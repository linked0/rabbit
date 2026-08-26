import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { agentAddress, agentKeyIsPersistent } from "@/lib/agent-wallet";
import { delegationEnvOrNull } from "@/lib/delegation";

export const dynamic = "force-dynamic";

// J2 / R-A — mandate: grant · fund · revoke.
//
// 서명은 브라우저에서 일어난다(MetaMask 가 EIP-712 Delegation 에 서명한다). 이
// 라우트는 **기록**한다 — 체인이 진실이고 이 행은 거울이다. 서버가 소유자 대신
// 서명할 수 있었다면 데모의 주장 자체가 없어진다.
//
// ERC-7715 팝업이 아니라 typed-data 서명인 이유는 `lib/delegation.ts` 상단에 있다:
// 그 호출은 MetaMask 확장이 답하므로 확장이 chainId 31337 을 지원해야 하는데,
// 우리는 프레임워크를 직접 배포했으므로 주소도 지갑의 기대값과 다르다.
//
// 상한과 만료 **둘 다**를 받는 이유: 상한만으로는 "언제까지"가 없고, 계획서가
// money shot 이라 부르는 것은 만료 쪽이다 — 마감이 지나면 아무도 취소하지
// 않아도 체인이 계속 거절한다.

// GET /api/agent/mandate — 현재 상태 (+ 에이전트 주소).
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const mandate = await prisma.mandate.findFirst({
    where: { agent: agentAddress(), revokedAt: null },
    orderBy: { createdAt: "desc" },
  });

  const env = delegationEnvOrNull();

  return NextResponse.json({
    // 브라우저에 나가는 유일한 것. 개인키는 서버에 있고, 페이지는 이 사실을
    // "testnet-grade"로 표시해야 한다 — 숨기면 데모가 정직하지 않다.
    agentAddress: agentAddress(),
    agentKeyIsPersistent: agentKeyIsPersistent(),
    delegationDeployed: Boolean(env),
    mandate: mandate
      ? {
          id: mandate.id,
          owner: mandate.owner,
          capUsdc: Number(mandate.capUsdc),
          drawnUsdc: Number(mandate.drawnUsdc),
          remainingUsdc: Number(mandate.capUsdc) - Number(mandate.drawnUsdc),
          expiresAt: mandate.expiresAt.toISOString(),
          // 만료와 소진은 **다른 상태**다. 하나로 뭉치면 화면에서 구별할 수 없다.
          expired: mandate.expiresAt.getTime() <= Date.now(),
          exhausted: Number(mandate.drawnUsdc) >= Number(mandate.capUsdc),
          createdAt: mandate.createdAt.toISOString(),
          /// 위임이 온체인 강제를 받는가. false 면 이 mandate 는 DB 행일 뿐이고,
          /// 화면은 그렇게 말해야 한다 — "체인이 막는다"를 근거 없이 주장하면
          /// 이 데모가 증명하려는 바로 그 지점이 거짓이 된다.
          onChain: mandate.delegation !== null,
          delegator: (mandate.delegation as { delegator?: string } | null)?.delegator ?? null,
        }
      : null,
  });
}

// POST /api/agent/mandate — 브라우저가 서명한 위임을 기록.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    owner?: string;
    capUsdc?: number;
    expiresAt?: string;
    /// `/prepare` 가 만들어 준 구조체에 브라우저가 서명을 채워 되돌려준 것.
    /// 없으면 mandate 는 DB 행일 뿐이고 GET 의 `onChain` 이 false 가 된다.
    delegation?: { signature?: string } & Record<string, unknown>;
  } | null;

  if (!body?.owner || typeof body.capUsdc !== "number" || !body.expiresAt) {
    return NextResponse.json({ error: "owner, capUsdc and expiresAt are required" }, { status: 400 });
  }
  if (!(body.capUsdc > 0)) {
    return NextResponse.json({ error: "capUsdc must be > 0" }, { status: 400 });
  }
  const expiresAt = new Date(body.expiresAt);
  if (Number.isNaN(expiresAt.getTime())) {
    return NextResponse.json({ error: "expiresAt is not a valid date" }, { status: 400 });
  }
  if (expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "expiresAt is already in the past" }, { status: 400 });
  }
  // 서명 없는 위임을 저장하면 온체인 강제가 없는데 있는 것처럼 보인다.
  // 서명이 붙어 오면 반드시 채워져 있어야 한다.
  if (body.delegation && !body.delegation.signature) {
    return NextResponse.json({ error: "delegation has no signature" }, { status: 400 });
  }

  // 새 mandate 를 부여하면 이전 것은 닫는다. 두 개가 동시에 살아 있으면
  // "남은 예산"이 어느 쪽 것인지 말할 수 없고, 저널의 숫자가 의미를 잃는다.
  await prisma.mandate.updateMany({
    where: { agent: agentAddress(), revokedAt: null },
    data: { revokedAt: new Date() },
  });

  const mandate = await prisma.mandate.create({
    data: {
      owner: body.owner,
      agent: agentAddress(),
      capUsdc: body.capUsdc,
      expiresAt,
      delegation: (body.delegation ?? undefined) as never,
    },
  });
  return NextResponse.json({ id: mandate.id }, { status: 201 });
}

// DELETE /api/agent/mandate — 취소.
//
// 취소는 만료와 **다른 사건**이다. 사람이 껐다는 사실이 저널에 남아야, 만료
// 실행(R-H)에서 "아무도 취소하지 않았는데 체인이 거절했다"는 주장이 성립한다.
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const revoked = await prisma.mandate.updateMany({
    where: { agent: agentAddress(), revokedAt: null },
    data: { revokedAt: new Date() },
  });
  if (revoked.count === 0) return NextResponse.json({ error: "no active mandate" }, { status: 404 });
  return NextResponse.json({ revoked: revoked.count });
}
