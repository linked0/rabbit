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

## Status / prerequisite
Portfolio and Investment Summary are currently **separate** menus (`/dashboard`, `/summary`);
they must be **merged** into *Portfolio & Market* — see [portfolio-and-market.md](portfolio-and-market.md).
