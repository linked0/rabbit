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
  // 아직 "soon"인데 열어볼 페이지는 있는 경우 = 논의용 목업 (/poc/agent, 2026-08-06).
  // 배지를 "라이브"로 올리면 동작하지 않는 걸 동작한다고 말하는 셈이고, "준비 중"인데 눌리면
  // 눌린다는 걸 아무도 모른다. 그래서 세 번째 상태를 만든다 — 눌리지만 라이브는 아니다.
  const isPreview = !isLive && !!card.href;
  const body = (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div className="value" style={{ fontSize: 16 }}>
          {pick(lang, card.titleKo, card.title)}
        </div>
        <span className={`poc-badge ${isLive ? "poc-badge-live" : "poc-badge-soon"}`}>
          {isLive
            ? pick(lang, "라이브", "Live")
            : isPreview
              ? pick(lang, "목업", "Mock")
              : pick(lang, "준비 중", "Coming soon")}
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

  // href가 있으면 연다 — 라이브든 목업이든. 상태는 배지가 말하고, 링크 여부는 페이지 존재가 정한다.
  if (card.href) {
    return (
      <Link href={card.href} className="kpi poc-card">
        {body}
      </Link>
    );
  }
  return <div className="kpi poc-card poc-card-disabled">{body}</div>;
}
