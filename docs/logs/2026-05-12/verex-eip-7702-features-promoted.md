# Verex EIP-7702 Features Promoted to Production-Track (2026-05-12)

> **Category**: Feature · **Repo**: verex
>
> EIP-7702 관련 작업이 plan에서 research/PoC 항목으로만 트래킹되던 것을 사용자 대면 feature 3개로 격상. §1.4 / §2.2.8 / §11.4 세 섹션에 일관되게 반영.

---

## What was done (요약)

8개 후보 feature를 product story 일관성 + implementation 비용 기준으로 survey한 뒤 3개 선별:

1. **One-click betting** (S7) — `approve(jUSD)` + `fillOrder` 1 서명. 기존 "배치 tx PoC"를 production track으로 reframe.
2. **Auto-claim** (S7, 신규) — backend scheduler가 resolved 마켓의 `redeemPositions`를 자동 호출. 사용자 EOA에 ONLY `redeemPositions` 허용하는 audit-grade 최소 delegate.
3. **Gasless onboarding** (S8) — Paymaster가 신규 지갑의 첫 N=5 거래 후원. Spend tracker로 N+1번째부터 후원 중단.

세 feature가 같은 EIP-7702 delegation primitive 공유 → 하나 만들면 다른 것 도움. 의도적으로 제외한 것: (4) 시간 한정 세션 / (6) stop-loss / (7) social recovery / (8) 구독 LP — 각각 audit 표면 확장 + UI 작업 추가로 v2 scope 초과.

## 변경된 plan 섹션

- **§1.4 S7 row** — Auto-claim deliverable 추가, batch tx PoC → "One-click betting (production)" reframe
- **§1.4 S8 row** — Paymaster PoC → "Gasless onboarding (production)" + spend tracker deliverable + N+1 cap milestone
- **§2.2.8** — "EIP-7702-enabled features (S7~S8)" sub-section 신설
- **§11.4** — B6 (Auto-claim delegate, HIGH, S7 mid-week) + B7 (Paymaster spend tracker, MEDIUM, S8 시작) 추가

## Idiom of the Day

> *"production-track"* — promoted from research/PoC to the production roadmap. *"3 EIP-7702 features promoted to production-track deliverables."* (Useful pattern — distinguishes "we're exploring" from "we're shipping.")

---

## 깊은 내용은 verex 저장소

이 entry는 task repo workspace 인덱싱용 짧은 pointer. 8개 후보 feature 비교 표, 각 feature의 trade-off, plan 섹션별 변경 내용은:

- 📄 `verex/docs/history/history.md` 의 2026-05-12 항목 (오늘은 별도 dated detail file 없음 — history.md만)
- 📄 `verex/docs/plan/README.md` — §1.4, §2.2.8, §11.4 (변경된 plan 본문)
- 📄 `verex/docs/plan/eip-7702-research.md` — EIP-7702 자체 리서치 노트

[← Back to Daily Log Summary](../summary.md)
