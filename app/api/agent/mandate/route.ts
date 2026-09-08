import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { agentAddress, agentAddressOrNull, agentKeyIsPersistent } from "@/lib/agent-wallet";
import { verex } from "@/lib/verex-client";
import { delegationEnvOrNull, storedDelegator } from "@/lib/delegation";

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

  // 이 라우트는 **읽기** 경로다 — 패널을 처음 채운다. `agentAddress()` 는 키가 없으면
  // (키 없는 배포, 재시작 직후) 던지는데, 여기서 던지면 응답이 통째로 500 이 되고 패널은
  // 주소까지 잃어 "not loaded yet" 만 남는다 — 프리플라이트·참여자가 던지지 않는
  // `agentAddressOrNull()` 을 쓰는 바로 그 이유다 (jay, 2026-09-08). 읽기 경로도 통일한다:
  // 주소가 없으면 500 대신 그 사실을 그대로 내보내고, 왜 없는지는 아래 note 로 말한다.
  const agent = agentAddressOrNull();

  // DB 가 죽어도 라우트 전체를 500 으로 만들지 않는다 (jay, 2026-09-07). 예전에는 이
  // 호출이 던지면 응답이 통째로 사라져서, 패널은 에이전트 주소까지 잃고 "agent address
  // is not loaded yet" 만 남았다 — 참여자 표(다른 라우트)는 멀쩡한데. 주소·USDC 는
  // env/verex 소관이므로 그대로 주고, 무엇이 빠졌는지는 mandateError 로 말한다.
  let mandate: Awaited<ReturnType<typeof prisma.mandate.findFirst>> = null;
  let mandateError: string | null = null;
  if (agent) {
    try {
      mandate = await prisma.mandate.findFirst({
        where: { agent, revokedAt: null },
        orderBy: { createdAt: "desc" },
      });
    } catch (e) {
      mandateError = `mandate DB unavailable — ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`;
    }
  }

  const env = await delegationEnvOrNull();
  // ERC-7715 권한은 **어느 토큰**에 대한 상한인지 지갑에 알려줘야 한다. 그 주소의
  // 출처는 언제나 verex 다 — 여기서 굳이 한 번 더 정의하면 두 정의가 갈라진다.
  const cfg = await verex.config().catch(() => null);

  return NextResponse.json({
    usdc: cfg?.usdc ?? null,
    chainId: cfg?.chainId ?? env?.chainId ?? null,
    // 브라우저에 나가는 유일한 것. 개인키는 서버에 있고, 페이지는 이 사실을
    // "testnet-grade"로 표시해야 한다 — 숨기면 데모가 정직하지 않다.
    agentAddress: agent,
    agentKeyIsPersistent: agentKeyIsPersistent(),
    delegationDeployed: Boolean(env),
    // 키가 없으면 그 사실을 loadErr 자리로 보내, 패널이 "왜 비었는지"를 말하게 한다.
    mandateError:
      mandateError ??
      (agent
        ? null
        : "AGENT_PRIVATE_KEY is not set on the server — the console has no agent address to grant to."),
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
          delegator: storedDelegator(mandate.delegation),
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
    /// 두 가지 중 하나가 온다:
    ///   • `/prepare` 가 만든 구조체 + 브라우저 서명 (31337 경로)
    ///   • 지갑이 ERC-7715 로 발급한 `{ kind, context, delegationManager }` (표준 체인)
    /// 없으면 mandate 는 DB 행일 뿐이고 GET 의 `onChain` 이 false 가 된다.
    delegation?: Record<string, unknown>;
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
  // 온체인 강제가 없는데 있는 것처럼 저장하지 않는다. 두 모양 각각에 대해
  // "이게 정말 체인에서 강제되는가"를 만족하는 최소 조건을 확인한다.
  if (body.delegation) {
    const d = body.delegation;
    const isErc7715 = typeof d.context === "string" && typeof d.delegationManager === "string";
    if (!isErc7715 && !d.signature) {
      return NextResponse.json({ error: "delegation has no signature" }, { status: 400 });
    }
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
