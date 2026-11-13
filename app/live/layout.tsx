import LiveRail from "./LiveRail";
import { liveCards, railLabel } from "@/lib/live-cards";
import { getLang } from "@/lib/lang";
import { pick } from "@/lib/i18n";

// Demo section shell (jay, 2026-10-29): a card list on the left of every /live page.
// Each page still renders its own <Nav/> + <main>; .live-shell is a grid that puts the
// rail beside both, so no page had to change. Cards whose page lives outside /live
// (/market, /xyz, /til/…) are listed too, but the rail does not follow you there.
export default function LiveLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  const items = liveCards().map((c) => ({
    key: c.key,
    href: c.href ?? `/poc/${c.key}`,
    label: railLabel(pick(lang, c.titleKo, c.title)),
    // Bird View 아래의 세 시나리오 (jay, 2026-11-13: "these three are under the Bird View as sub menus").
    // 각 항목은 /live/stack?s=… 로 그 시나리오의 판을 바로 펼친다.
    subs: c.key === "agent-stack" ? [
      { key: "agentic", href: "/live/stack?s=agentic", label: pick(lang, "에이전트 결제", "Agentic payment") },
      { key: "canton", href: "/live/stack?s=canton", label: "Canton" },
      { key: "relay", href: "/live/stack?s=relay", label: pick(lang, "AiTM 중계 피싱", "AiTM relay phishing") },
    ] : undefined,
  }));
  return (
    // Rail after the page in the DOM: the grid areas place it on the left (or as a strip under
    // the header on a phone), while tab and screen-reader order stay header → page → rail.
    <div className="live-shell">
      {children}
      <LiveRail title={"Jayverse"} allLabel={pick(lang, "전체 보기", "All demos")} items={items} />
    </div>
  );
}
