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

### docs index: self-link to the file's local path under the title

jay wanted a clickable link to the index file's own location under the page title, for opening
the file directly in a browser. Added a monospace accent-colored anchor to
`file:///Users/jay/work/rabbit/docs/index.html` right below the "Documentation, Tasks, and Dev
Logs" subtitle, matching the header's existing inline-style idiom and the `.card-path` look.

Two known limits, accepted for now: the path is absolute and machine-specific, so it only
resolves on jay's Mac; and browsers block `file://` navigation from a page served over http(s),
so the link only works when the index itself is opened as a local file.

### docs index: dot link after the Knowledge Base title

jay asked for a dot at the end of the "Knowledge Base" line linking to a `mind.html` page whose
content is still to come. Added a `&bull;` anchor inside the `<h2 class="section-title">`, at
55% opacity in accent color, with `title`/`aria-label="Mind"` so the bare glyph still has an
accessible name.

Chose `knowledge/mind.html` for the href — every other HTML doc in that section lives under
`knowledge/`. The page does not exist yet, so the link 404s until jay supplies the content.
`.section-title` is `display:flex` with `gap:10px` and a flex-filling `::after` rule, so the dot
lands as its own flex item between the text and the line — no CSS changes needed.

Verified in the browser: dot renders after the title, href resolves to `knowledge/mind.html`,
all 43 cards intact, and the search filter still works (1 visible on "merkle", 43 restored).

### docs index: revert the Knowledge Base dot link

jay changed course and asked to drop the dot and the planned `mind.html`. Removed the `&bull;`
anchor from the Knowledge Base `<h2>`; `docs/index.html` is now byte-identical to commit
`4ce9579`, the state before the dot went in. No CSS was ever added for it, so nothing else
needed unwinding.

`knowledge/mind.html` was never created — the request to drop it arrived while the file was
still being drafted, so there was nothing to delete. Verified in the browser: the title has no
links, 43 cards and 5 sections intact, and the header self-link still resolves.
