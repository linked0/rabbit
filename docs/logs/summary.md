# Daily Log Summary

> Research diary across topics — LLM, smart contracts, Unity, TypeScript, security, harness engineering, and so on. Newest first — open to see what's most recent at the top.

---

## 2026-06-15

- **[Verex CTF 마이그레이션 — 코드 분석 계획](2026-06-15/verex-ctf-migration-analysis-plan.md)** · *Analysis · verex · security*
  - verex `ctf-exchange` 브랜치(PR #2, S2.x, 커밋 21개) CTF 스택 전환을 어떤 순서로 리뷰할지 정리한 체크리스트.
  - 최우선 리스크: off-chain EIP-712 주문 해시 parity. 컨트랙트/SDK/CLI/테스트/보안 관점 분리.
  - *"parity" — exact equivalence between two implementations (off-chain vs on-chain hashing).*

## 2026-05-12

- **[TypeScript infer + Rust Borrowing + LLM Tokenizer Session](2026-05-12/typescript-llm-learning-session.md)** · *Learning · typescript · rust · llm*
  - TypeScript `infer` 키워드 (UnwrapPromise, EventArg, DeepReadonly), Rust borrowing 규칙, LLM 토크나이저 & 임베딩 실습 코드 작성.
  - `/Users/jay/work/task/ai/tokenizer-embedding/` — uv 프로젝트, tiktoken + nomic-embed-text.
  - *"under the hood" — referring to the internal workings of something.*

- **[Verex EIP-7702 Features Promoted to Production-Track](2026-05-12/verex-eip-7702-features-promoted.md)** · *Feature · verex*
  - 8개 EIP-7702 후보 중 3개 (one-click betting, auto-claim, gasless onboarding)를 plan §1.4 / §2.2.8 / §11.4 세 곳에 일관되게 격상.
  - *"production-track" — promoted from research/PoC to the production roadmap.*

## 2026-05-11

- **[Verex Plan Restructure (CTF→S2) + Gnosis CTF Research](2026-05-11/verex-plan-restructure-and-gnosis-research.md)** · *Refactor · verex*
  - Plan 재구성 (v2 백본을 W6→S2, Week→Step 단위 전환) + Gnosis CTF research note 작성 (~280줄, 9 섹션).
  - *"put it on rails" — to set up something so it runs predictably without constant intervention.*

## 2026-05-08

- **[Verex v1 Security Audit](2026-05-08/verex-v1-security-audit.md)** · *Refactor · verex*
  - W1 산출물 셀프 보안 감사. HIGH 0 / MEDIUM 1 / LOW 2 / INFO 6. ~70%가 v2 도입으로 자동 해소.
  - *"defense in depth" — multiple independent layers of protection.*

## 2026-05-07

- **[Verex Phase 1 W1 Implementation](2026-05-07/verex-phase1-w1-implementation.md)** · *Feature · verex*
  - contracts + SDK + 신규 CLI. anvil end-to-end (deploy → bet → resolve → claim) M1/M2 통과.
  - *"end-to-end" — covering every step of a process from start to finish.*

## 2026-05-04

- **[Consolidate Logs Section](2026-05-04/consolidate-logs-section.md)** · *Refactor · task*
  - know.html의 "Today's Learnings" + "Dev Logs" 두 섹션을 단일 "Logs" 섹션으로 통합. 흩어진 날짜 폴더를 `docs/logs/` 아래로 모음.
  - *"put your house in order" — to organize your own affairs before doing other things.*

## 2026-05-01

- **[Claude Skills Cleanup](2026-05-01/claude-skills-cleanup.md)** · *Refactor · skills*
  - `coding-principles`와 `summ` 두 skill의 frontmatter / markdown 구조를 표준화. summ 출력 위치를 iCloud로 일시 이전 (이후 task repo로 복귀).
  - *"iron out the kinks" — to fix small problems in something mostly working.*

## 2026-04-02

- **[Source Map Leak Demo Project](2026-04-02/sourcemap-leak-demo.md)** · *Research · security*
  - Claude Code npm 패키지 source map leak 사건 (2026-03-31) 재현 demo. `.map` 파일이 어떻게 원본 TS 노출하는지 + 방지법.
  - *"Let the cat out of the bag" — to accidentally reveal a secret.*

## 2026-03-24

- **[Harness Engineering Applied to Projects](2026-03-24/harness-engineering-applied.md)** · *Technique · harness*
  - Harness Engineering 개념 학습. CPS docs / Linter enforcement / Agent evaluation 3 pillar를 Verex / Web / Task repo에 적용 매핑.
  - *"A chain is only as strong as its weakest link."*

- **[Creating the /summ Skill](2026-03-24/creating-summ-skill.md)** · *Feature · skills*
  - `~/.claude/skills/summ/SKILL.md` 신규 생성. trigger pattern, 7 카테고리 색상 매핑, idiom-of-the-day 섹션, auto-commit 로직 포함.
  - *"Build the ship while sailing it."*

---

> Index under `task/docs/logs/`. Auto-updated by `summ` skill — new entries prepended at the top (newest first). Read in VS Code or via Markdown Viewer browser extension.
