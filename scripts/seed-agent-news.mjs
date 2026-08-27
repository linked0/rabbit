#!/usr/bin/env node
// J2 — the demo's evidence, seeded (jay, 2026-08-27).
//
// 계획서 §"The scenario" 는 뉴스 → 추정 → 규칙 → verex 주문을 설명하지만, 뉴스
// 저장소는 비어서 시작한다. 그래서 지금까지 그 흐름을 보려면 헤드라인을 손으로
// 쳐 넣고 기대하는 수밖에 없었다. 이 스크립트가 그 자리를 채운다.
//
// **두 마켓을 함께 심는 이유**(jay 결정, 2026-08-27): 데모는 두 절반을 모두
// 보여야 한다.
//
//   A. us-federal-stablecoin-law-2026 — 헤드라인이 직접 물리는 마켓. p 가
//      호가를 충분히 넘어 규칙이 발동한다 → TRADED 를 기대한다.
//   B. eth-above-10k-2026 — 규제 헤드라인이 가격 마켓에 **간접적으로만** 닿는다.
//      p 가 조금 움직이고, 규칙이 올바르게 아무것도 하지 않는다 → SKIP_EDGE.
//
// B 가 더 중요한 절반이다. 계획서가 내세우는 주장이 "에이전트가 거래한다"가
// 아니라 "판단이 판단으로 읽힌다"이기 때문이다. 거절하는 행이 근거와 인용
// 증거를 달고 남는 것이 그 주장의 증거다.
//
// **기대일 뿐 보장이 아니다.** 판정은 LLM 이 p 를 어디에 두느냐에 달렸고, 그건
// 실행할 때마다 다를 수 있다. 원하는 판정이 나오게 임계치를 만지는 순간 데모는
// 증거가 아니라 연출이 된다 — 나온 대로 읽는다.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const MIN = 60 * 1000;

// publishedAt 은 **지금 기준 상대값**이다. 고정 날짜로 심으면 O7 의 창
// (withinHours) 밖으로 밀려나 며칠 뒤엔 추정이 아예 읽지 않는다.
const CASES = [
  {
    slug: "us-federal-stablecoin-law-2026",
    market: "Will the US enact a federal stablecoin law in 2026?",
    expect: "TRADED (BUY Yes) — three headlines pointing one way should carry p past the ask",
    news: [
      {
        headline: "Senate Banking Committee advances federal stablecoin bill 18–6",
        body: "The bipartisan margin was wider than expected, and both ranking members signalled support for a floor vote this session.",
        source: "Reuters",
        agoMin: 90,
      },
      {
        headline: "House leadership schedules floor vote on the stablecoin framework for next month",
        body: "Leadership aides say the calendar slot is firm, which removes the procedural delay that stalled the previous session's attempt.",
        source: "Bloomberg",
        agoMin: 55,
      },
      {
        headline: "Treasury Secretary calls stablecoin legislation 'a 2026 priority'",
        body: "Prepared remarks name the payment-stablecoin bill specifically rather than market structure generally.",
        source: "WSJ",
        agoMin: 20,
      },
    ],
  },
  {
    slug: "eth-above-10k-2026",
    market: "Will ETH close above $10,000 in 2026?",
    expect: "SKIP_EDGE — real signal, indirect link, not worth acting on",
    news: [
      {
        headline: "The CLARITY Act has not been approved by the Senate before recess",
        body: "Market-structure legislation slips again. The read-through to ETH's price is real but indirect: slower regulatory clarity means slower institutional allocation, not a change in ETH's supply or demand today.",
        source: "Reuters",
        agoMin: 40,
      },
    ],
  },
];

async function main() {
  const now = Date.now();
  for (const c of CASES) {
    // 멱등성: 같은 헤드라인을 다시 심지 않는다. 지우고 다시 넣는 이유는
    // publishedAt 이 상대값이라 갱신돼야 하기 때문이다.
    const headlines = c.news.map((n) => n.headline);
    const { count } = await prisma.newsItem.deleteMany({
      where: { marketSlug: c.slug, headline: { in: headlines } },
    });

    await prisma.newsItem.createMany({
      data: c.news.map((n) => ({
        marketSlug: c.slug,
        headline: n.headline,
        body: n.body,
        source: n.source,
        publishedAt: new Date(now - n.agoMin * MIN),
        // origin 은 operator 다 — feed 가 아니다. 사람이 넣은 것이 맞고,
        // 계획서의 "이 데모는 에이전트가 뉴스를 *발견*하는 것을 증명하지
        // 않는다"가 그대로 성립해야 한다. 스크립트로 넣었다고 자동 수집이
        // 되는 것은 아니다.
        origin: "operator",
      })),
    });

    console.log(`\n${c.slug}  —  ${c.market}`);
    console.log(`  ${c.news.length} headline(s) seeded${count ? ` (replaced ${count})` : ""}`);
    for (const n of c.news) console.log(`    · ${n.headline}  [${n.source}, ${n.agoMin}m ago]`);
    console.log(`  expect: ${c.expect}`);
  }

  console.log(
    "\nNow open http://localhost:3100/live/agent/console, grant a mandate, and tick each market.\n" +
      "Whatever verdict comes out is the demo — do not tune the threshold until it says what you want.\n",
  );
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e.message);
    await prisma.$disconnect();
    process.exit(1);
  });
