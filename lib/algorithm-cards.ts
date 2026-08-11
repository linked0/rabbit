// Algorithms (/algorithms) 허브 — 상단 메뉴 (jay, 2026-08-11).
//
// 카드 본문을 til-cards.ts 에서 옮겨 적지 않고 **키로 고른다**. 옮겨 적으면 같은 내용이 두
// 파일에 살면서 한쪽만 고쳐지는 날이 오고, 이 카드들은 본문이 길어서 옮기는 과정 자체가
// 오타 위험이다. 소스는 여전히 한 곳이고, 여기서 갈리는 건 "어느 허브에 뜨는가" 뿐이다.
//
// 카드를 알고리즘 쪽으로 옮기려면 아래 배열에 key 하나만 추가하면 된다 — /poc 는
// 자동으로 그 카드를 빼고 그린다.

import type { DemoCard } from "./demo-cards";
import { TIL_CARDS } from "./til-cards";

/// 알고리즘/수학 허브로 보낼 카드 키.
/// LMSR 카드는 여기서 뺐다 (jay, 2026-08-11) — 라이브로 간다. 남은 둘은 아직 만들지 않은
/// 수학 노트라, 결과적으로 알고리즘 허브는 "이해했지만 아직 코드가 없는 것"이 됐다.
export const ALGORITHM_KEYS = [
  "geometric-series-dcf",
  "amortized-potential-function",
] as const;

const keySet = new Set<string>(ALGORITHM_KEYS);

export const ALGORITHM_CARDS: DemoCard[] = TIL_CARDS.filter((c) => keySet.has(c.key));

/// /poc 의 TIL 자리에 남는 것들 — 알고리즘 허브로 간 카드는 제외.
export const TIL_REMAINING: DemoCard[] = TIL_CARDS.filter((c) => !keySet.has(c.key));
