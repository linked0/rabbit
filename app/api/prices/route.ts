import { NextRequest, NextResponse } from "next/server";

// CoinGecko 현재가 프록시 (브라우저 CORS 회피 + 키 불필요)
// GET /api/prices?ids=bitcoin,ethereum&vs=usd
// 응답: { "bitcoin": 64000, "ethereum": 3200 }
export async function GET(req: NextRequest) {
  const ids = req.nextUrl.searchParams.get("ids")?.trim();
  const vs = req.nextUrl.searchParams.get("vs")?.trim() || "usd";

  if (!ids) {
    return NextResponse.json({ error: "ids 파라미터가 필요합니다." }, { status: 400 });
  }

  const url =
    `https://api.coingecko.com/api/v3/simple/price` +
    `?ids=${encodeURIComponent(ids)}&vs_currencies=${encodeURIComponent(vs)}`;

  try {
    const res = await fetch(url, {
      headers: { accept: "application/json" },
      // 60초 캐시 (무료 API rate limit 보호)
      next: { revalidate: 60 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `CoinGecko 오류: ${res.status}` },
        { status: 502 }
      );
    }
    const data = (await res.json()) as Record<string, Record<string, number>>;
    // { bitcoin: { usd: 64000 } } → { bitcoin: 64000 } 로 평탄화
    const flat: Record<string, number> = {};
    for (const [id, obj] of Object.entries(data)) {
      const price = obj?.[vs];
      if (typeof price === "number") flat[id] = price;
    }
    return NextResponse.json(flat);
  } catch (e) {
    return NextResponse.json(
      { error: "시세 조회 실패", detail: String(e) },
      { status: 500 }
    );
  }
}
