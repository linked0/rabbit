import Link from "next/link";
import type { DemoCard } from "@/lib/demo-cards";
import { pick } from "@/lib/i18n";
import type { Lang } from "@/lib/i18n";

// Shared card for the demo-hub menus (PoCs /etc, TIL /til) — same visual format for both.
export default function Card({
  card,
  lang,
  noteLabel = { en: "How to run", ko: "실행 방법" },
  from,
}: {
  card: DemoCard;
  lang: Lang;
  noteLabel?: { en: string; ko: string };
  // 어느 허브에서 열렸는지 — 상세 페이지의 BackLink 가 온 곳으로 돌려보내는 데 쓴다
  // ("live" 만 존재, 2026-08-11). 기본 허브(/poc)는 BackLink 기본값과 같아 표시가 필요 없다.
  from?: "live";
}) {
  const isLive = card.status === "live";
  const isDone = card.status === "done"; // 완료 — 사고 실험·구현이 끝났고, 상시 데모는 아님 (2026-08-12)
  // 아직 "soon"인데 열어볼 페이지는 있는 경우 = 논의용 목업 (/live/agent, 2026-08-06).
  // 배지를 "라이브"로 올리면 동작하지 않는 걸 동작한다고 말하는 셈이고, "준비 중"인데 눌리면
  // 눌린다는 걸 아무도 모른다. 그래서 세 번째 상태를 만든다 — 눌리지만 라이브는 아니다.
  // 전용 페이지가 없는 카드도 상세로 간다 — /poc/[key] 가 카드 데이터를 그대로 펼친다
  // (jay, 2026-08-11). 이 fallback 이 생기면서 "눌리지 않는 카드"는 사라졌다.
  const href = (card.href ?? `/poc/${card.key}`) + (from ? `?from=${from}` : "");
  // 배지는 오직 status 로 정한다 (jay, 2026-08-12). 예전엔 "soon + href = 목업"이라는
  // 추론을 썼는데, 페이지가 있다는 것과 목업이라는 것은 결국 다른 이야기였다 — DVT 는
  // 읽을 페이지가 있지만 목업이 아니라 계획이고, 게임·에이전트는 페이지가 있고 이제 완료다.
  // 추론을 지우고 데이터가 직접 말하게 한다: 라이브 · 완료 · 준비 중 세 가지뿐.
  const body = (
    <>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div className="value" style={{ fontSize: 16 }}>
          {pick(lang, card.titleKo, card.title)}
        </div>
        <span
          className={`poc-badge ${isLive ? "poc-badge-live" : isDone ? "poc-badge-done" : "poc-badge-soon"}`}
        >
          {isLive
            ? pick(lang, "라이브", "Live")
            : isDone
              ? pick(lang, "완료", "Done")
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

  // 모든 카드가 열린다 — 전용 페이지가 없으면 /poc/[key] 상세로 (2026-08-11).
  // 상태는 배지가 말한다: 라이브(초록) · 완료(하늘) · 준비 중(회색).
  return (
    <Link href={href} className="kpi poc-card">
      {body}
    </Link>
  );
}
