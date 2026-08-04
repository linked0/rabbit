// AP2 §2 목업 데이터 — "agent buys data, settles via Stripe" 시나리오의 판매 대상.
// 설계: docs/tasks/current-plan.md §2.
export const AP2_PRODUCT = {
  id: "ap2-premium-insight",
  titleKo: "프리미엄 시장 인사이트",
  titleEn: "Premium Market Insight",
  descriptionKo: "에이전트가 구매하는 목업 프리미엄 데이터 — 실제 시세 조언이 아닙니다.",
  descriptionEn: "Mock premium data an agent purchases — not real market advice.",
  amountCents: 50, // $0.50 test-mode charge
  currency: "usd",
  // 결제 성공 후 공개되는 목업 콘텐츠.
  contentKo: "\"가장 좋은 진입 시점은, 이미 확신이 든 다음이 아니라 그 전이다.\" — rabbit AP2 데모",
  contentEn: "\"The best entry is before conviction, not after it.\" — rabbit AP2 demo",
};
