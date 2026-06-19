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

## Roadmap — recommended implementation order
Ordered by dependency and value (a roadmap like verex's `docs/plan/README.md §1.4`).
Effort = focused AI-assisted work, not calendar time.

| Phase | Features (in order) | Why this order | Rough effort |
|-------|---------------------|----------------|--------------|
| **1 — Shell & navigation** | navigation (common) → main-page (Home gate) → knowledge-base → verex-link → CI/CD | The menu is the backbone everything hangs off; Home + Knowledge depend on it; Verex is a one-line external link; CI early so later PRs are auto-checked | 2–3 days |
| **2 — Core features** | portfolio-and-market (merge + DB) → ai-chat (provider selector + OSS model) | The substance of the app. Portfolio needs a DB (Prisma + Cloud SQL), so it's the biggest single piece — do it first in this phase | 3–5 days |
| **3 — Extras** | game (Unity, `rabbit-hole`) → ap2-test | Bigger/independent or experimental. Game depends on you building the Unity game; AP2 is a learning spike | 3–5 days |

**Sequencing rules**
- **Navigation first** — every other feature plugs into the new top menu.
- **CI/CD early** (Phase 1) — so Phase 2/3 PRs are auto-checked.
- **Portfolio & Market is the critical path** for real value (it needs the DB) — start Phase 2 with it.
- **Game and AP2 last** — Game is a separate Unity repo (`rabbit-hole`) gated on your game build; AP2 is experimental.
- **Quick wins** you can pull forward anytime: `verex-link` (one external `<a>`) and the app icon (already done).

## Status / prerequisite
Portfolio and Investment Summary are currently **separate** menus (`/dashboard`, `/summary`);
they must be **merged** into *Portfolio & Market* — see [portfolio-and-market.md](portfolio-and-market.md).
