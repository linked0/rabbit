import Link from "next/link";
import Nav from "../Nav";
import Card from "../DemoCard";
import SessionKeyMark from "../home/SessionKeyMark";
import { POC_CARDS, FEATURED_POC_KEY } from "@/lib/poc-cards";
import { sortDemoCards } from "@/lib/demo-cards";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// Target IA: PoCs (/poc) — consolidated demo hub. Design: docs/tasks/current-plan.md §7.
// Card grid replaces separate top-nav slots for each technical demo (Market/XYZ folded in here).
export default function EtcPage() {
  const lang = getLang();
  // 상단 피처드 — /projects 와 같은 구조(피처드 한 장 + 아래 전체 목록), jay 요청 2026-08-06.
  // 어느 카드인지는 lib/poc-cards.ts 의 FEATURED_POC_KEY 하나가 정한다(홈의 "대표 작업"과 공유).
  const featured = POC_CARDS.find((c) => c.key === FEATURED_POC_KEY);
  // 피처드로 올라간 카드는 아래 그리드에서 뺀다 — 한 화면에 같은 카드가 두 번 나오면
  // 피처드가 "고른 것"이 아니라 "복사된 것"으로 보인다.
  const rest = sortDemoCards(POC_CARDS.filter((c) => c.key !== featured?.key));

  return (
    <>
      <Nav />
      <main>
        <h1>{pick(lang, "PoCs", "PoCs")}</h1>
        <p className="sub">
          {pick(
            lang,
            "기술 데모/실험 모음 — 각 카드는 실제로 돌려볼 수 있는 페이지로 연결됩니다.",
            "Technical demos and experiments — each card links to a real page you can try."
          )}
        </p>

        {featured?.href && (
          <section className="panel">
            <h2>{pick(lang, "피처드", "Featured")}</h2>
            <Link href={featured.href} className="kpi featured-card featured-card-poc">
              <div className="featured-mark-wrap">
                <SessionKeyMark />
              </div>
              <div style={{ flex: 1, minWidth: 220 }}>
                <div className="label">
                  {featured.status === "live"
                    ? pick(lang, "라이브", "Live")
                    : pick(lang, "목업", "Mock")}
                </div>
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
            <Card key={card.key} card={card} lang={lang} />
          ))}
        </div>
      </main>
    </>
  );
}
