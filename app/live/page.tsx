import Link from "next/link";
import Nav from "../Nav";
import Card from "../DemoCard";
import SessionKeyMark from "../home/SessionKeyMark";
import { POC_CARDS, FEATURED_POC_KEY } from "@/lib/poc-cards";
import { TIL_CARDS } from "@/lib/til-cards";
import { sortDemoCards } from "@/lib/demo-cards";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// Live (/live) — 실제로 돌아가는 것만 (jay, 2026-08-11).
//
// 왜 나눴나: /poc 한 곳에 라이브·목업·준비 중이 섞여 있으면, 방문자가 "돌아가는 게 뭐냐"에
// 답하려면 배지를 하나씩 읽어야 한다. 카탈로그가 12장을 넘어가면서 그게 실제로 부담이 됐다.
// 이제 이 페이지가 그 질문 하나만 답하고, /poc 는 "무엇을 만들고 있나"를 답한다.
//
// 라이브는 **카테고리가 아니라 필터**다 (jay, 2026-08-11 — LMSR 카드가 live 인데 여기
// 안 뜬다는 지적). 그래서 특정 파일이 아니라 모든 카드 소스에서 status === "live" 를 모은다.
// PoCs 든 알고리즘이든 어느 허브가 그 카드를 "소유"하든, 돌아가면 여기 뜬다 — 같은 카드가
// 두 곳에 보이는 건 중복이 아니라 필터의 정의다.
export default function LivePage() {
  const lang = getLang();
  const live = sortDemoCards([...POC_CARDS, ...TIL_CARDS].filter((c) => c.status === "live"));
  const featured = live.find((c) => c.key === FEATURED_POC_KEY);
  const rest = live.filter((c) => c.key !== featured?.key);

  return (
    <>
      <Nav />
      <main>
        <h1>{pick(lang, "라이브", "Live")}</h1>
        <p className="sub">
          {pick(
            lang,
            "지금 실제로 돌아가는 것들 — 전부 열어서 직접 해볼 수 있습니다. 만들고 있는 것과 계획은 PoCs 에 있습니다.",
            "What actually runs right now — every card here opens something you can use. Work in progress and plans live under PoCs."
          )}
        </p>

        {featured?.href && (
          <section className="panel">
            <h2>{pick(lang, "피처드", "Featured")}</h2>
            <Link href={`${featured.href}?from=live`} className="kpi featured-card featured-card-poc">
              <div className="featured-mark-wrap">
                <SessionKeyMark />
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div className="label">{pick(lang, "라이브", "Live")}</div>
                <div className="value" style={{ fontSize: 18 }}>
                  {pick(lang, featured.titleKo, featured.title)}
                </div>
                <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>
                  {pick(lang, featured.descriptionKo, featured.description)}
                </div>
                <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
                  {pick(lang, featured.howToKo, featured.howTo)}
                </div>
              </div>
            </Link>
          </section>
        )}

        <div className="poc-grid">
          {rest.map((card) => (
            <Card key={card.key} card={card} lang={lang} from="live" />
          ))}
        </div>
      </main>
    </>
  );
}
