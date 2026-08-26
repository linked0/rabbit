import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { verex } from "@/lib/verex-client";

export const dynamic = "force-dynamic";

// verex 의 마켓 목록을 콘솔에 중계한다.
//
// 브라우저가 verex 를 직접 부르지 않는 이유: verex API 는 로컬 포트(4000)에 있고
// CORS 도 열려 있지 않다. 그리고 `VEREX_API_URL` 은 서버 설정이라 브라우저에
// 노출할 이유가 없다 — 배포 환경이 바뀌어도 이 라우트만 따라간다.
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const markets = await verex.markets();
    return NextResponse.json({
      markets: markets.map((m) => ({
        slug: m.slug,
        title: m.title,
        status: m.status,
        outcomes: m.outcomes.map((o) => ({ label: o.label })),
      })),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e instanceof Error ? e.message : e) }, { status: 503 });
  }
}
