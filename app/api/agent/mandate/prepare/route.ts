import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { isAddress, type Address } from "viem";
import { ensureOwnerDeployed, buildMandate, mandateTypedData, loadEnv } from "@/lib/delegation";
import { verex } from "@/lib/verex-client";

export const dynamic = "force-dynamic";

// J2 / R-A — 서명 **직전** 준비.
//
// 위임 구조체를 브라우저가 아니라 여기서 만든다. 이유는 O1 과 똑같다: 서명 대상이
// 구조체 해시라, 정의가 두 벌이면 한 글자만 어긋나도 *틀린 메시지에 대한 유효한
// 서명*이 나오고 에러는 구조체를 언급하지 않는다. 브라우저는 받은 것에 서명만 한다.
//
// 부수적으로 여기서 두 가지를 해 둔다 — 스마트 계정 배포와 자금 투입. 둘 다
// 서명 이후에 하면 "위임은 유효한데 뽑을 게 없다"는 상태가 되고, 그건 저널에서
// 만료·소진과 구별되지 않는다.

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    owner?: string;
    capUsdc?: number;
    expiresAt?: string;
  } | null;

  if (!body?.owner || !isAddress(body.owner)) {
    return NextResponse.json({ error: "owner must be an address" }, { status: 400 });
  }
  if (!(typeof body.capUsdc === "number" && body.capUsdc > 0)) {
    return NextResponse.json({ error: "capUsdc must be > 0" }, { status: 400 });
  }
  const expiresAt = new Date(body.expiresAt ?? "");
  if (Number.isNaN(expiresAt.getTime())) {
    return NextResponse.json({ error: "expiresAt is not a valid date" }, { status: 400 });
  }
  if (expiresAt.getTime() <= Date.now()) {
    return NextResponse.json({ error: "expiresAt is already in the past" }, { status: 400 });
  }

  let env: ReturnType<typeof loadEnv>;
  try {
    env = loadEnv();
  } catch (e) {
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e) }, { status: 503 });
  }

  const config = await verex.config().catch(() => null);
  if (!config?.usdc) {
    return NextResponse.json({ error: "verex is unreachable or unseeded — no USDC address" }, { status: 503 });
  }
  // 체인이 다르면 상한은 다른 체인의 토큰을 지키고 거래는 여기서 일어난다.
  // 그 조합에서는 "체인이 막는다"가 거짓이므로 아예 시작하지 않는다.
  if (config.chainId !== env.chainId) {
    return NextResponse.json(
      { error: `chain mismatch: verex is on ${config.chainId}, delegation framework on ${env.chainId}` },
      { status: 409 },
    );
  }

  const owner = body.owner as Address;

  // 여기부터는 체인과 네트워크다 — 배포·faucet·구조체 생성 전부 던질 수 있다.
  // 감싸지 않으면 Next 가 **본문 없는 500** 을 보내고, 브라우저에는 그것이
  // `Unexpected end of JSON input` 으로만 도착한다 (2026-08-28, jay 가 여기서
  // 막혔다). verex 의 `/faucet` 과 같은 처방: 진단을 프레임워크가 대신
  // 요약하게 두지 말고, 실패한 이유를 그대로 실어 보낸다.
  try {
    const account = await ensureOwnerDeployed(owner);

    // V-B 의 주소 지정 faucet 을 그대로 쓴다 — Phase 1 에서 만든 조각이 여기 맞물린다.
    // 금액은 verex 쪽 고정값이다. 상한과 맞추지 않는 이유: 상한은 **뽑을 수 있는**
    // 한도이고 잔고는 **있는** 돈이라 서로 다른 것이며, 둘이 어긋나는 상태
    // ("한도는 남았는데 잔고가 없음")가 실제로 존재한다는 걸 화면이 보여줘야 한다.
    const funded = await verex.faucet(account.address).catch(() => null);

    const delegation = buildMandate({
      delegator: account.address,
      capUsdc: body.capUsdc,
      expiresAtSec: Math.floor(expiresAt.getTime() / 1000),
      usdc: config.usdc,
    });

    return NextResponse.json({
      smartAccount: {
        address: account.address,
        justDeployed: !account.deployed,
        deployTxHash: account.txHash,
        usdc: funded?.usdc ?? null,
      },
      delegation,
      // 브라우저는 이걸 그대로 `eth_signTypedData_v4` 에 넣는다.
      typedData: mandateTypedData(delegation),
    });
  } catch (e) {
    const message = String(e instanceof Error ? e.message : e);
    console.error("[mandate/prepare]", e);
    return NextResponse.json({ error: `mandate prepare failed: ${message}` }, { status: 500 });
  }
}
