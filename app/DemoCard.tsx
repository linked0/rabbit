import Link from "next/link";
import type { DemoCard } from "@/lib/demo-cards";
import { pick } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

// Shared card for the demo-hub menus (PoCs /etc, TIL /til) — same visual format for both.
export default function Card({
  card,
  lang,
  noteLabel = { en: "How to run", ko: "실행 방법" },
}: {
  card: DemoCard;
  lang: Lang;
  noteLabel?: { en: string; ko: string };
}) {
  const isLive = card.status === "live";
  const body = (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div className="value" style={{ fontSize: 16 }}>
          {pick(lang, card.titleKo, card.title)}
        </div>
        <span className={`poc-badge ${isLive ? "poc-badge-live" : "poc-badge-soon"}`}>
          {isLive ? pick(lang, "라이브", "Live") : pick(lang, "준비 중", "Coming soon")}
        </span>
      </div>
      <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>
        {pick(lang, card.descriptionKo, card.description)}
      </div>
      <div className="poc-howto">
        <span className="label">{pick(lang, noteLabel.ko, noteLabel.en)}</span>
        <div style={{ fontSize: 12.5, marginTop: 2 }}>{pick(lang, card.howToKo, card.howTo)}</div>
      </div>
    </>
  );

  if (isLive && card.href) {
    return (
      <Link href={card.href} className="kpi poc-card">
        {body}
      </Link>
    );
  }
  return <div className="kpi poc-card poc-card-disabled">{body}</div>;
}
