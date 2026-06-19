# Rabbit — Feature Designs

Design + plan **drafts** for the features in [`../tasks/Jun-18-features.md`](../tasks/Jun-18-features.md).
Each feature has its own file; this is the main index. These are for review — refine first,
then summarize the built result into `docs/history/`.

## Target information architecture (one top menu, anchored by Home)
| Menu | Route | Feature doc |
|------|-------|-------------|
| Home | `/` | [main-page.md](main-page.md) |
| Knowledge | `/knowledge` | [knowledge-base.md](knowledge-base.md) |
| Portfolio & Market | `/portfolio` | [portfolio-and-market.md](portfolio-and-market.md) |
| AI Chat | `/chat` | [ai-chat.md](ai-chat.md) |
| Game | `/game` | [game.md](game.md) |
| AP2 Test | `/ap2` | [ap2-test.md](ap2-test.md) |
| Verex | ↗ external | [verex-link.md](verex-link.md) |
| _Cross-cutting_ | — | [common.md](common.md) — navigation/top-menu (Common #1) + CI/CD (Common #2) |

## Roadmap — phase · step schedule
Broken into steps like verex's `docs/plan/README.md §1.4`. Effort = focused AI-assisted
work (not calendar time); if a step runs over, **cut its scope** rather than slipping the next.

| Phase · Step | Key deliverables | Milestone | Est. |
|---|---|---|---|
| **P1 Shell · S1** | Navigation restructure — Home-anchored top menu + active-link highlight | every section reachable from the new menu | 0.5d |
| **P1 Shell · S2** | Home gate (`app/page.tsx`) — card grid + hero image | `/` shows the Home gate | 0.5–1d |
| **P1 Shell · S3** | Knowledge → `/knowledge`; Verex external link | knowledge at `/knowledge`; Verex opens externally | 0.5d |
| **P1 Shell · S4** | CI/CD — GitHub Actions (lint/build/test on PR; deploy on merge) | PRs auto-checked, merge auto-deploys | 0.5–1d |
| **P2 Core · S5** | Merge `/summary` + `/dashboard` → `/portfolio` (Market + Portfolio zones) | one Portfolio & Market page | 1d |
| **P2 Core · S6** | DB persistence — Cloud SQL Postgres + Prisma; holdings schema + CRUD API | holdings survive refresh, keyed by user | 1–2d |
| **P2 Core · S7** | AI Chat — provider selector + small OSS model (Qwen2.5-0.5B) on Cloud Run | pick Local/OpenAI; OSS model answers | 1–2d |
| **P3 Extras · S8** | Game — Unity (`rabbit-hole`) WebGL build embedded in `/game` | sample game playable in `/game` | 2–3d* |
| **P3 Extras · S9** | AP2 Test — x402 "agent pays for data" mock loop | agent pay → retry → data works | 1–2d |
| **P3 Extras · S10** | Polish — error boundaries, a few tests, deploy, history write-up | all features live; history recorded | 1–2d |

\*S8 is gated on your Unity game build. **Total: ~10–15 focused days.**

**Sequencing rules**
- **Navigation first** — every other feature plugs into the new top menu.
- **CI/CD early** (Phase 1) — so Phase 2/3 PRs are auto-checked.
- **Portfolio & Market is the critical path** for real value (it needs the DB) — start Phase 2 with it.
- **Game and AP2 last** — Game is a separate Unity repo (`rabbit-hole`) gated on your game build; AP2 is experimental.
- **Quick wins** you can pull forward anytime: `verex-link` (one external `<a>`) and the app icon (already done).

## Status / prerequisite
Portfolio and Investment Summary are currently **separate** menus (`/dashboard`, `/summary`);
they must be **merged** into *Portfolio & Market* — see [portfolio-and-market.md](portfolio-and-market.md).
