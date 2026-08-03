import Nav from "../Nav";
import Card from "../DemoCard";
import { POC_CARDS } from "@/lib/poc-cards";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// Target IA: PoCs (/etc) — consolidated demo hub. Design: docs/tasks/current-plan.md §7.
// Card grid replaces separate top-nav slots for each technical demo (Market/XYZ folded in here).
export default function EtcPage() {
  const lang = getLang();
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
        <div className="poc-grid">
          {POC_CARDS.map((card) => (
            <Card key={card.key} card={card} lang={lang} />
          ))}
        </div>
      </main>
    </>
  );
}
