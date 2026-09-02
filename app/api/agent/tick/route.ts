import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { runAgentTick, type TickSettings } from "@/lib/agent-tick";

export const dynamic = "force-dynamic";

// J2 / R-C — 틱 라우트. 판단 로직은 lib/agent-tick.ts 로 옮겨졌다 (jay, 2026-09-02,
// R-F): 스케줄러가 사람의 세션 없이 같은 함수를 불러야 해서다. 이 라우트는 이제
// auth 와 HTTP 만 안다.
//
// 얇은 껍데기 하나를 두는 이유(2026-08-28): 관측·추정·주문은 전부 던질 수 있고,
// 감싸지 않으면 Next 가 **본문 없는 500** 을 보낸다. 브라우저에는
// `Unexpected end of JSON input` 으로만 도착해 원인이 파서 에러로 위장된다.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  try {
    const s = ((await req.json().catch(() => ({}))) ?? {}) as TickSettings;
    const r = await runAgentTick(s);
    if ("error" in r) return NextResponse.json({ error: r.error }, { status: r.status });
    return NextResponse.json(r);
  } catch (e) {
    const message = String(e instanceof Error ? e.message : e);
    console.error("[agent/tick]", e);
    return NextResponse.json({ error: `tick failed: ${message}` }, { status: 500 });
  }
}

// GET /api/agent/tick — 저널 (최신순). skip 이 기본으로 보여야 한다.
//
// 인용한 뉴스 id 를 **헤드라인과 출처로 되돌려** 함께 보낸다. R-E 의 요구가
// "resolvable to headline + source"인 이유는, id 목록만 보이는 저널은 감사할 수
// 없기 때문이다. 삭제된 항목은 조용히 빠지는 게 아니라 `missing` 으로 남는다 —
// "인용한 증거가 사라졌다"는 사실 자체가 기록되어야 한다.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? "50"), 200);
  const ticks = await prisma.agentTick.findMany({ orderBy: { createdAt: "desc" }, take: limit });

  const ids = [...new Set(ticks.flatMap((t) => t.citedNewsIds))];
  const news = ids.length
    ? await prisma.newsItem.findMany({
        where: { id: { in: ids } },
        select: { id: true, headline: true, source: true, publishedAt: true },
      })
    : [];
  const byId = new Map(news.map((n) => [n.id, n]));

  return NextResponse.json({
    ticks: ticks.map((t) => ({
      ...t,
      cited: t.citedNewsIds.map((id) => {
        const n = byId.get(id);
        return n
          ? { id, headline: n.headline, source: n.source, publishedAt: n.publishedAt.toISOString(), missing: false }
          : { id, headline: null, source: null, publishedAt: null, missing: true };
      }),
    })),
  });
}
