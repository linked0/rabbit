// Shared card shape for the demo-hub menus (PoCs /etc, TIL /til).
// ko/en bilingual, same pattern as lib/home-content.ts's PROJECTS.

export type DemoCard = {
  key: string;
  title: string;
  titleKo: string;
  description: string;
  descriptionKo: string;
  status: "live" | "soon";
  href?: string; // omitted while "soon" and no page exists yet
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

// "live" 카드가 항상 "soon" 카드보다 앞에 오도록 정렬 (jay, 2026-08-04) — 카드 상태가
// 바뀔 때마다 배열 순서를 손으로 맞출 필요 없게, 각 그룹 내 원래 순서는 그대로 유지(stable sort).
export function liveFirst(cards: DemoCard[]): DemoCard[] {
  return [...cards].sort((a, b) => (a.status === b.status ? 0 : a.status === "live" ? -1 : 1));
}
