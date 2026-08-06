import Nav from "../Nav";
import Card from "../DemoCard";
import { TIL_CARDS } from "@/lib/til-cards";
import { sortDemoCards } from "@/lib/demo-cards";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// Target IA: TIL (/til) — "Today I Learned" code-demo hub, same card format as PoCs (/poc).
// Each card re-implements something from a day's learning (math formula, algorithm, or a
// recommended-service integration) as standalone code — not a sync of the private daily report.
export default function TilPage() {
  const lang = getLang();
  return (
    <>
      <Nav />
      <main>
        <h1>
          TIL <span className="sub">{pick(lang, "오늘 배운 것", "Today I Learned")}</span>
        </h1>
        <p className="sub">
          {pick(
            lang,
            "일상적으로 배우는 것을 코드로 다시 구현한 모음 — 수학 공식, 알고리즘, 추천 서비스 연동.",
            "Things learned along the way, re-implemented as code — math formulas, algorithms, recommended-service integrations."
          )}
        </p>
        <div className="poc-grid">
          {sortDemoCards(TIL_CARDS).map((card) => (
            <Card
              key={card.key}
              card={card}
              lang={lang}
              noteLabel={{ en: "Source", ko: "출처" }}
            />
          ))}
        </div>
      </main>
    </>
  );
}
