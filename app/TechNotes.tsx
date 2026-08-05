import type { DemoCard } from "@/lib/demo-cards";
import { pick } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";
import MermaidDiagram from "./MermaidDiagram";

// 페이지 하단 "기술 노트" 섹션 — 카드 그리드의 짧은 설명과 별개로, 목적·동작 방식을 자세히
// 기록해 방문한 채용 담당자가 실제 구현 이해도를 볼 수 있게 한다 (jay, 2026-08-04).
export default function TechNotes({ cards, lang }: { cards: DemoCard[]; lang: Lang }) {
  return (
    <section id="tech-notes" style={{ marginTop: 48 }}>
      <h2>{pick(lang, "기술 노트", "Technical Notes")}</h2>
      <p className="sub">
        {pick(
          lang,
          "각 항목이 실제로 무엇을 보여주고 어떻게 동작하는지 — 위 카드보다 자세한 기술 설명입니다.",
          "What each item actually demonstrates and how it works — more detail than the cards above."
        )}
      </p>
      {cards.map((card) => {
        const isLive = card.status === "live";
        return (
          <div key={card.key} className="panel" style={{ marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <strong>{pick(lang, card.titleKo, card.title)}</strong>
              <span className={`poc-badge ${isLive ? "poc-badge-live" : "poc-badge-soon"}`}>
                {isLive ? pick(lang, "라이브", "Live") : pick(lang, "준비 중", "Planned")}
              </span>
            </div>
            <p style={{ marginTop: 10 }}>
              <strong>{pick(lang, "목적: ", "Purpose: ")}</strong>
              {pick(lang, card.purposeKo, card.purpose)}
            </p>
            <p style={{ marginTop: 8 }}>
              <strong>{pick(lang, "동작 방식: ", "How it works: ")}</strong>
              {pick(lang, card.howItWorksKo, card.howItWorks)}
            </p>
            {card.diagrams?.map((d) => (
              <figure key={d.title} style={{ margin: "16px 0 0" }}>
                <figcaption className="sub" style={{ fontSize: 13, marginBottom: 4 }}>
                  {pick(lang, d.titleKo, d.title)}
                </figcaption>
                <MermaidDiagram definition={d.src} />
              </figure>
            ))}
          </div>
        );
      })}
    </section>
  );
}
