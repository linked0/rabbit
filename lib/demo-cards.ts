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
  // Mermaid sequence-diagram definition (optional — only where a real flow exists to diagram).
  diagram?: string;
};

// "live" 카드가 항상 "soon" 카드보다 앞에 오도록 정렬 (jay, 2026-08-04) — 카드 상태가
// 바뀔 때마다 배열 순서를 손으로 맞출 필요 없게, 각 그룹 내 원래 순서는 그대로 유지(stable sort).
export function liveFirst(cards: DemoCard[]): DemoCard[] {
  return [...cards].sort((a, b) => (a.status === b.status ? 0 : a.status === "live" ? -1 : 1));
}
