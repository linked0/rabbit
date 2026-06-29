// Task 2 — 투자 정책 시뮬레이션 v1 (forward projection)
// 설계: docs/tasks/jun-19-rabbit-design.md — "Claude가 v1, jay가 UI 리파인".
// v1은 현재 평가액 기준 전방 추정(시나리오 연수익률 + 선택적 DCA). 과거 데이터 백테스트는 후속.

export type Scenario = { key: string; label: string; annualReturnPct: number };

export const DEFAULT_SCENARIOS: Scenario[] = [
  { key: "bear", label: "보수 (Bear)", annualReturnPct: -20 },
  { key: "base", label: "기본 (Base)", annualReturnPct: 20 },
  { key: "bull", label: "낙관 (Bull)", annualReturnPct: 80 },
];

// 현재 평가액을 연 수익률 r로 years년 복리 → 미래 추정액 (= buy & hold 기준선)
export function projectValue(current: number, annualReturnPct: number, years: number): number {
  return current * Math.pow(1 + annualReturnPct / 100, years);
}

// 매월 일정액 추가 매수(DCA): 적립 + 성장. monthly=월 투자액, months=개월
export function projectDCA(
  initial: number,
  monthly: number,
  annualReturnPct: number,
  months: number
): number {
  const r = annualReturnPct / 100 / 12; // 월 수익률
  let v = initial;
  for (let i = 0; i < months; i++) v = v * (1 + r) + monthly;
  return v;
}

// 연도별 곡선 (차트용) — index 0 = 현재
export function projectionSeries(
  current: number,
  annualReturnPct: number,
  years: number
): number[] {
  const out: number[] = [];
  for (let y = 0; y <= years; y++) out.push(projectValue(current, annualReturnPct, y));
  return out;
}
