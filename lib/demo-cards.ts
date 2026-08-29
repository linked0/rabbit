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
  // 로컬 docs 안의 상세 페이지 (선택 — jay, 2026-08-13). 있으면 docs/pocs.html 이
  // "Open on jaylabs.xyz →" 대신 "Detail →"로 이 경로를 건다. docs/ 기준 상대 경로.
  docsHref?: string;
  // "지금은 중요하지 않은 것" (jay, 2026-08-14). status 로는 표현이 안 된다 — 이것들도
  // 여전히 계획(soon)이고 언젠가 할 수도 있지만, 지금 목록 위쪽을 차지할 이유가 없다.
  // true 면 목록 본문과 레일에서 별도 "Later" 묶음으로 내려가고, 번호도 그 뒤에 이어진다.
  later?: boolean;
  // 목록 구획 (jay, 2026-08-27) — "Ethereum Protocol / Core Technologies" 와 그 밖의 모든 것.
  // 기본값이 후자이므로 프로토콜·코어 기술 카드에만 group: "protocol" 을 붙인다.
  // 기존 later 플래그는 남겨 두되 더 이상 구획을 가르지 않는다 — Later 묶음은 폐지됐다.
  group?: "protocol" | "economics" | "future";
  // "마지막으로 손본 날" (jay, 2026-08-28) — date 와 다르다. date 는 "그 데모가 동작하게 된
  // 날"이라 아직 안 만든 카드에는 없고, 그래서 인덱스 상위는 늘 오래된 live 데모가 차지했다.
  // reviewed 는 "내가 이 카드를 마지막으로 검토한 날"이라 계획 카드에도 붙는다.
  // index.html 의 PoCs 섹션은 이 값이 가장 최근인 두 장만 싣는다 — 없는 카드는 안 나온다.
  reviewed?: string;
  // "마지막으로 내용이 바뀐 날" (jay, 2026-08-29) — reviewed 와 다르다. reviewed 는 "내가
  // 검토한 날"이라 인덱스 두 장을 고르는 데 쓰고, updated 는 "카드 본문이 실제로 바뀐 날"이라
  // 목록 왼쪽 레일에서 최근 N일 안에 손댄 항목을 분홍색 제목으로 표시하는 데 쓴다.
  // **규칙: 카드를 새로 만들거나 본문(title/description/purpose/howTo/howItWorks)을 고치면
  // 반드시 이 값을 그날 날짜로 갱신한다.** group 추가 같은 형식 변경에는 건드리지 않는다 —
  // 일괄 리팩터까지 세면 목록 전체가 분홍이 되어 표시가 아무것도 뜻하지 않게 된다.
  // 창(N일)이 지나면 표시는 저절로 사라지므로 나중에 지울 필요가 없다.
  updated?: string;
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
