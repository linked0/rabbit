import { POC_CARDS } from "./poc-cards";
import { TIL_CARDS } from "./til-cards";
import { sortDemoCards, type DemoCard } from "./demo-cards";

// The Demo (/live) card order, shared by the grid on /live and the left rail on every
// /live/* page (jay, 2026-10-29: "make the demo page like this" — a card list panel).
// Moved out of app/live/page.tsx so the two lists cannot drift apart.
//
// 라이브는 **카테고리가 아니라 필터**다 (jay, 2026-08-11) — 모든 카드 소스에서 status === "live" 를 모은다.

// 오디터만 자리를 지정한다 (jay, 2026-09-15: "여섯 번째"). 날짜를 조작해 순서를 만들지
// 않는 이유: `date` 는 "그 데모가 동작하게 된 날"이라는 뜻이 정해져 있고(lib/demo-cards.ts),
// 그 뜻을 순서 조절에 쓰기 시작하면 /poc·docs 등 같은 필드를 읽는 다른 화면이 조용히
// 틀어진다. 자리만 원하는 것이므로 자리만 옮긴다.
const AUDITOR_SLOT = 5; // 0-based → 여섯 번째

export function liveCards(): DemoCard[] {
  const live = sortDemoCards([...POC_CARDS, ...TIL_CARDS].filter((c) => c.status === "live"));
  const i = live.findIndex((c) => c.key === "authority-auditor");
  if (i < 0) return live; // 카드가 없거나 live 가 아니면 그대로 — 자리 지정은 보너스지 요구사항이 아니다
  const out = [...live];
  const [auditor] = out.splice(i, 1);
  out.splice(Math.min(AUDITOR_SLOT, out.length), 0, auditor);
  return out;
}

/// The rail shows the short name: a card title's part before " — " ("The fake letter",
/// "Settlement Agent"), or the whole title when it has no subtitle.
export function railLabel(title: string): string {
  return title.split(" — ")[0];
}
