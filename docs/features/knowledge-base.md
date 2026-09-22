# Knowledge Base

## Status: ✅ Done (2026-06-30), menu item later removed
`/knowledge` served `know.html` in an iframe (see "Built" below), then per jay the **Knowledge
menu item + `/knowledge` route were removed from the app** (2026-06-30) — content now lives at
`docs/know.html` for **local `file://` browsing** (not web-served, no public exposure), plus
`docs/knowledge/*.md`. Restore when needed.

## Original goal
Move the knowledge page off `/` to its own **Knowledge** menu, fixing a "No content" bug.

## Built (2026-06-30, while still web-served)
- **Decided (jay):** serve `know.html` as the main content via **iframe** (no React port).
- Moved `know.html` + `management.md` → `public/knowledge/`; `/knowledge` iframed
  `/knowledge/know.html`; `middleware.ts` matcher excluded `knowledge/` so the static file served
  without auth. Verified (200 + "Workspace Index" content).
- Loose root study files (`index.html`, `baseline_*.html`, `management.html`,
  `sarah_chen_index.html`, `luminary_index.html`, `zksnark_math.html`, `assumptions.md`,
  `clarifying_questions.md`) moved to `docs/archive/` for reference; `README.md` (project setup)
  stayed at root.
- **Known gap, never fixed:** `know.html`'s links to `ai/`/`eng/`/`nostra/`/`images/`/`docs/`
  (repo files, not web-served) 404 even with correct paths, since the app only serves `public/`.
  Recommended prune (fix the one servable link to `management.md`, neutralize dead local hrefs)
  was never actioned before the menu item was removed.

## Open questions
- If restored: static HTML iframe (current shape) vs a React port for consistency?
- The `ai/`/`eng/`/`nostra/`/`docs/*` link-pruning above, if restoring web access.
