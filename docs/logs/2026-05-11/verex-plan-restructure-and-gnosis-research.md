# Verex Plan Restructure (CTF→S2) + Gnosis CTF Research (2026-05-11)

> **Category**: Refactor · **Repo**: verex
>
> 두 갈래의 큰 작업: (1) plan 재구성 — v2 (CTF) 백본을 W6 → S2로 당기고 단위를 Week → Step으로 변경, (2) Gnosis CTF research note 작성 (~280줄, 9 섹션).

---

## What was done (요약)

### Plan 재구성

- **CTF v2 백본을 S2로** — 운영자 prior CTF 경험 반영, v1 (W1 parimutuel)을 1주짜리 scaffold로 격하.
- **Week → Step 단위 전환** — AI assistance 하에 W1이 1일에 끝났던 경험에서 출발. 새 컬럼 "예상 시간 (AI 포함)" 1~5일 range. 합산 ~25–35일 집중 작업.
- **§1.4, §1.3, §2.2.1, §2.2.6, §4, §4.5, §11.2, §11.3** 모두 새 어조로 재작성. 모든 산출물 / 마일스톤 GFM `- [x]` / `- [ ]` 체크박스 적용.

### Gnosis CTF research note

- **9 섹션, ~280줄** — mental model, 5 핵심 함수, position ID 유도, events, Polymarket 사용 패턴, CTF vs Exchange 경계, open questions, S2.2~S2.6 매핑, 추천 reading order.
- **소스 cross-reference**: Gnosis ConditionalTokens.sol + CTHelpers.sol + Polymarket AssetOperations.sol.

### Q&A 세션 (research note 보충)

- position/collection/indexSet 정밀 정의
- "event"는 컨트랙트 레이어에 없고 UI/DB 메타데이터
- `parentCollectionId`가 conditional positions용이지만 production에선 hard-code `bytes32(0)`
- Idempotent 개념과 SDK가 비-idempotent primitive를 idempotent 인터페이스로 wrap해야 한다는 패턴
- NegRisk Adapter 발명 mental process 6 move

## Idiom of the Day

> *"put it on rails"* — to set up something so it runs predictably without constant intervention. *"Restructuring plan to put S2 work on rails for tomorrow."* (Common metaphor — once on rails, it goes by itself.)

---

## 깊은 내용은 verex 저장소

이 entry는 task repo workspace 인덱싱용 짧은 pointer. 자세한 결정 배경, 섹션별 변경, Q&A 인사이트는:

- 📄 `verex/docs/plan/gnosis-ctf-research.md` — research note 자체 (S2.1 reading note)
- 📄 `verex/docs/history/2026-05-11-plan-restructure-and-gnosis-research.md` — 7 섹션 detail (결정 표, 섹션별 변경, Q&A 표, 브랜치/커밋 상태, 내일 진입 예정, 재현 절차)
- 📄 `verex/docs/history/history.md` 의 2026-05-11 항목

[← Back to Daily Log Summary](../summary.md)
