# rabbit

Portfolio + PoC app at www.jaylabs.xyz. Next.js 14 App Router, TypeScript, Prisma,
deployed to GCP Cloud Run (`scripts/deploy.sh`). Repo root **is** the app (flattened
from a former `rabbit/` subdirectory). Static local docs (workspace index, PoCs
catalogue, Algorithms/Math curriculum) live under `docs/` and are generated from
single-source data — see "Docs generation" below.

## Docs generation (anti-drift)

- `lib/poc-cards.ts` (`POC_CARDS`, typed as `DemoCard[]`) is the **only** source for
  the PoCs catalogue — both the live `/poc` pages and the static `docs/pocs.html` /
  `docs/index.html` PoCs section are generated from it. Never hand-edit the generated
  HTML directly; edit `lib/poc-cards.ts` and run `pnpm docs:pocs`.
- `docs/knowledge/dev-100-curriculum.md` and `docs/knowledge/math-50-curriculum.md`
  are the source for the Algorithms/Math sections; run `pnpm docs:curriculum` after
  editing them.
- After any docs generation, verify: `npx tsc --noEmit`, and check the generated HTML
  for balanced tags and zero broken local links (a quick Python/regex sweep is enough
  — this caught real bugs before, see `docs/history/2026-08-12-rabbit-history.md`).

## PoC card status rule — marking a card "done"

- `DemoCard.status` is `"live" | "soon" | "done"`. `sortDemoCards()` in
  `lib/demo-cards.ts` ranks `live` → `done` → `soon`, and *within* the same status
  sorts by `date` descending (newest first).
- **When changing a card's status to `"done"`, always set/bump its `date` field to
  the day the work actually finished.** (jay, 2026-08-13) — that's what makes it sort
  ahead of previously-done cards; a stale or missing `date` on a newly-done card will
  bury it behind older ones instead of surfacing it first. Do not just flip `status`
  without touching `date`.
- `date` means "the day the demo/thought-experiment actually became real," not the
  day the card was authored — see the comment above `DemoCard.date` in
  `lib/demo-cards.ts`.
