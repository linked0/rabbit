import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

// J2 / R-I — 에이전트가 읽는 증거 저장소.
//
// 이 라우트가 "뉴스 입력창"이 아니라 저장소인 이유는 계획서에 적힌 그대로다:
// LLM 추정은 프롬프트 텍스트가 아니라 **행**을 읽어야 하고, 저널이 인용한 증거는
// 나중에도 해석돼야 한다. 그리고 그어둔 선 — **헤드라인은 증거, 입장은 조종**.
// 여기 들어오는 것은 사실 진술이어야지 "강세로 봐" 같은 지시여선 안 된다.
// 그 구분이 데모의 주장("에이전트가 스스로 견해를 형성한다")을 지킨다.

async function requireEmail(): Promise<string | null> {
  const session = await auth();
  return session?.user?.email ?? null;
}

type NewsRow = {
  id: string;
  marketSlug: string;
  headline: string;
  body: string | null;
  source: string | null;
  publishedAt: string;
  enteredAt: string;
  origin: string;
};

function toRow(n: {
  id: string;
  marketSlug: string;
  headline: string;
  body: string | null;
  source: string | null;
  publishedAt: Date;
  enteredAt: Date;
  origin: string;
}): NewsRow {
  return {
    id: n.id,
    marketSlug: n.marketSlug,
    headline: n.headline,
    body: n.body,
    source: n.source,
    publishedAt: n.publishedAt.toISOString(),
    enteredAt: n.enteredAt.toISOString(),
    origin: n.origin,
  };
}

// GET /api/agent/news?marketSlug=…&withinHours=…
// withinHours 는 O7(뉴스 노후화)의 임시 손잡이다 — 기본값 없이 두면 3주 전
// 헤드라인이 영원히 p 를 움직인다. 기본은 전체이고, 추정 경로(R-D)가 창을 건다.
export async function GET(req: NextRequest) {
  const email = await requireEmail();
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const marketSlug = req.nextUrl.searchParams.get("marketSlug");
  const withinHours = Number(req.nextUrl.searchParams.get("withinHours") ?? "");

  const news = await prisma.newsItem.findMany({
    where: {
      ...(marketSlug ? { marketSlug } : {}),
      ...(Number.isFinite(withinHours) && withinHours > 0
        ? { publishedAt: { gte: new Date(Date.now() - withinHours * 3_600_000) } }
        : {}),
    },
    orderBy: { publishedAt: "desc" },
  });
  return NextResponse.json({ news: news.map(toRow) });
}

// POST /api/agent/news — 항목 1건 추가.
export async function POST(req: NextRequest) {
  const email = await requireEmail();
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as {
    marketSlug?: string;
    headline?: string;
    body?: string;
    source?: string;
    publishedAt?: string;
  } | null;

  if (!body?.marketSlug?.trim() || !body?.headline?.trim()) {
    return NextResponse.json({ error: "marketSlug and headline are required" }, { status: 400 });
  }
  // publishedAt 이 없으면 "지금"이다. 지어내지 않고 명시적으로 지금을 쓴다 —
  // 발행 시각을 추측해 넣으면 O7 의 창 계산이 조용히 틀어진다.
  const publishedAt = body.publishedAt ? new Date(body.publishedAt) : new Date();
  if (Number.isNaN(publishedAt.getTime())) {
    return NextResponse.json({ error: "publishedAt is not a valid date" }, { status: 400 });
  }

  const created = await prisma.newsItem.create({
    data: {
      marketSlug: body.marketSlug.trim(),
      headline: body.headline.trim(),
      body: body.body?.trim() || null,
      source: body.source?.trim() || null,
      publishedAt,
      origin: "operator",
    },
  });
  return NextResponse.json(toRow(created), { status: 201 });
}

// DELETE /api/agent/news?id=…
//
// 삭제는 지우기만 하고 저널은 건드리지 않는다. 이미 이 항목을 인용한 추정 행은
// 남아 있고, 그 인용은 이제 존재하지 않는 id 를 가리킨다 — 저널이 거짓말하게
// 두느니 "인용한 증거가 삭제됨"으로 읽히는 편이 정직하다.
export async function DELETE(req: NextRequest) {
  const email = await requireEmail();
  if (!email) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

  const deleted = await prisma.newsItem.deleteMany({ where: { id } });
  if (deleted.count === 0) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ deleted: id });
}
