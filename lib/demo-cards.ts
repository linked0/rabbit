// Shared card shape for the demo-hub menus (PoCs /etc, TIL /til).
// ko/en bilingual, same pattern as lib/home-content.ts's PROJECTS.

export type DemoCard = {
  key: string;
  title: string;
  titleKo: string;
  description: string;
  descriptionKo: string;
  // "done" (2026-08-12, jay): 사고 실험·구현이 끝났지만 상시 구동 데모는 아닌 것 —
  // "라이브"(지금 돌아감)도 "준비 중"(아직 안 만듦)도 아닌 세 번째 완결 상태.
  status: "live" | "soon" | "done";
  href?: string; // omitted while "soon" and no page exists yet
  // 구현 날짜 (YYYY-MM-DD) — 카드 정렬 기준 (jay, 2026-08-06). "카드를 만든 날"이 아니라
  // "그 데모가 실제로 동작하게 된 날"을 적는다 — 예를 들어 AP2는 "곧 공개" 스텁이 6월부터
  // 있었지만 Stripe 결제가 실제로 도는 건 08-04이므로 08-04.
  // 아직 구현되지 않은 "soon" 카드는 비워둔다 — 없는 날짜를 지어내지 않는다.
  date?: string;
  howTo: string;
  howToKo: string;
  // Longer technical write-up rendered in the "Technical Notes" section at the page bottom
  // (jay, 2026-08-04) — portfolio-facing detail, separate from the short card-grid copy above.
  purpose: string;
  purposeKo: string;
  howItWorks: string;
  howItWorksKo: string;
  // Mermaid 흐름도 (선택 — 실제로 그릴 흐름이 있는 카드에만).
  // 배열인 이유: 한 데모에 성격이 다른 그림이 둘 이상 필요할 수 있다 —
  // 예를 들어 AA는 "전체 수명주기"와 "행사 한 건의 호출 경로"가 답하는 질문이 다르다 (jay, 2026-08-05).
  diagrams?: DemoDiagram[];
};

export type DemoDiagram = {
  title: string;
  titleKo: string;
  src: string; // mermaid 정의
};

// 카드 정렬 — 두 기준을 순서대로 적용한다:
//   ① "live"가 "soon"보다 앞 (jay, 2026-08-04) — 아직 못 여는 카드가 동작하는 데모를 밀어내면 안 된다.
//   ② 같은 그룹 안에서는 구현 날짜 최신순 (jay, 2026-08-06) — 최근 작업이 위로 온다.
// 날짜가 없는 카드(아직 구현 전)는 날짜가 있는 카드 뒤로 가고, 자기들끼리는 배열 순서 유지.
// 상태와 날짜만 보므로, 카드가 바뀌어도 배열 순서를 손으로 맞출 필요는 여전히 없다.
export function sortDemoCards(cards: DemoCard[]): DemoCard[] {
  // live → done → soon: 동작하는 것, 끝난 것, 아직인 것 순.
  const rank = { live: 0, done: 1, soon: 2 } as const;
  return [...cards].sort((a, b) => {
    if (a.status !== b.status) return rank[a.status] - rank[b.status];
    if (a.date && b.date) return b.date.localeCompare(a.date); // ISO 문자열이라 사전순 = 시간순
    if (a.date) return -1;
    if (b.date) return 1;
    return 0;
  });
}
