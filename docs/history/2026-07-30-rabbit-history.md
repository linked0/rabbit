# 2026-07-30 — rabbit history

> Source docs: none — direct chat request from jay (no task/design file).

### docs index: remove the "Nostra - Core" section

jay asked to drop the `Nostra - Core` section from `docs/index.html`. Removed the whole
`<!-- Root -->` block (40 lines: the 7 task/summary/readme/plan/batch/testing cards plus the
"View All Nostra Core →" footer link). Nothing else linked to that section — the page has no
nav anchors — so no dangling references. The remaining `nostra/*` card links under
"English Learning" and "Designs & Visuals" were left alone as out of scope.

Verified in the browser: 5 sections remain (Logs, Knowledge Base, External Resources,
English Learning & Corrections, Designs & Visuals) and "Nostra - Core" is absent from the
rendered page, no console errors. Note the file has a pre-existing `<div` / `</div>` count
mismatch (22/21 before, 19/18 after) — unchanged by this edit, not investigated.
