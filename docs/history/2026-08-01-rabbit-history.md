# 2026-08-01 — rabbit history

> Source docs: none — direct chat request from jay (dictated, no task/design file).

### docs: render all markdown docs to browsable HTML under docs/html/

jay wanted to read the docs index on his phone's browser, which can't render raw `.md`. Added
`scripts/generate-docs-html.mjs` (uses the repo's existing `marked` dependency) to render every
`.md` file in the repo (290 files, excluding `node_modules`/`.venv`/build dirs) to a
self-contained HTML page under `docs/html/`, mirroring the source path 1:1
(`docs/features/x.md` → `docs/html/docs/features/x.html`) so relative links between converted
docs resolve correctly by simple extension swap, and non-`.md` asset links (images) are
re-pointed back at their original location instead of being copied. Source `.md` files are
untouched. Added `pnpm docs:html` as a package.json script to re-run it later as new docs are
added.

Repointed all 19 `.md` card links on `docs/index.html` to their generated `.html` counterparts,
and added a new "Current Projects" section at the top linking to Rabbit's own README
(`docs/html/README.html`) and Verex's README, generated the same way in the verex repo
(`verex/docs/html/README.html`, linked cross-repo via a relative `../../verex/...` path — only
resolves when both repos sit side-by-side under `~/work` on this machine).

Also committed a small pre-existing uncommitted diff on this branch separately first (the Jul 30
log-entry addition to the Logs section), so it didn't get tangled into this much larger change.

Scanned the newly-converted `docs/zsub/*.md` and `docs/dev.md` output for secrets before pushing;
found nothing new — an Etherscan API key and some local-anvil trace hex blobs already existed in
`dev.md`/`dev2.md`/`error.md` from an earlier commit (`83dd7ff`), just duplicated into the new
HTML mirror, not newly introduced.

Per jay's explicit instruction, fast-forward merged `claude/remove-nostra-core-section` (5
commits, clean fast-forward, no divergence from `origin/main`) directly into `main` and pushed
both `rabbit` and `verex` — bypassing the repo's own stated PR-review policy for this one-off
docs-only change, at jay's repeated explicit request.

### docs: scope correction — keep the Verex README copy inside rabbit, not in verex

jay clarified that all doc-conversion work should stay confined to the rabbit project only —
pushing `docs/html/README.html` to the verex repo (in the change above) was out of scope.
Reverted that commit on verex (`git revert`, pushed) and instead regenerated the same rendered
Verex README into `rabbit/docs/html/projects/verex/README.html`, reading `verex/README.md` as a
read-only source but writing the output only inside rabbit. Updated the "Current Projects" card
in `docs/index.html` to link to the new in-repo path instead of the cross-repo one. verex's git
history is now untouched by this work.

### chore: pre-commit hook to auto-convert only changed .md files

jay asked to avoid re-converting all 290 files on every change — only the ones that actually
changed. Extended `scripts/generate-docs-html.mjs` to accept explicit file paths as CLI args
(converts just those; falls back to a full scan with no args). Added `.githooks/pre-commit`,
enabled via `git config core.hooksPath .githooks` (chose this over Husky since it's a
single-dev repo and needs no new dependency) — on each commit it regenerates `docs/html/` for
staged `.md` files only, removes the generated `.html` for deleted `.md` files, and stages the
result automatically. Known limit: a brand-new `.md` with no card in `index.html` yet still
needs a manual card added — the hook only keeps already-linked docs in sync.

### docs(index): fix Current Projects — feature roadmap doc, not root README

jay clarified the original ask: the "Rabbit" card in Current Projects should link to
`docs/features/README.md` (the feature roadmap/current-work index), not the generic project
root `README.md` I'd used. Repointed the card to `html/docs/features/README.html` and retitled
it "Rabbit — Feature Designs" to match the doc's own heading. No script changes needed — that
file was already converted in the initial full pass.

### docs(index): same fix for Verex

jay asked for the identical fix on the Verex card, and separately confirmed I hadn't touched
the verex repo since the earlier revert (confirmed: `git status` clean there). Copied
`verex/docs/features/README.md` — verex's own feature-roadmap doc, structurally identical to
rabbit's — into `docs/html/projects/verex/docs/features/README.html`, read-only from verex,
written only into rabbit. Repointed the Verex card and deleted the now-orphaned root-README
copy (`docs/html/projects/verex/README.html`), since nothing linked to it anymore.

### docs(index): add Rabbit/Verex Tasks sections

jay asked for a new "Tasks" section per repo, latest-first, capped at 6 cards each. Ranked
`docs/tasks/*.md` by last git commit date (not filename — the date embedded in filenames like
`jun-30-rabbit-design.md` isn't reliably the actual edit date, and some files' names don't match
their content date at all). Rabbit already had all 6 selected files converted from the initial
pass; copied Verex's 5 task files into rabbit the same read-only-source way as the features
README. Ties at the same commit are ordered arbitrarily (a few of Verex's task files were all
touched in the same commit) — accepted as good enough, not worth over-engineering finer-grained
ranking for.

### docs: rename features README to current-design.md; merge index sections

jay wanted a stably-named "current design" doc per project instead of a generic `README.md`,
and wanted the separate Tasks sections folded back into "Current Projects" (confirmed this was
his original intention — the earlier separate-sections read was a misunderstanding on my part).

Renamed `docs/features/README.md` → `docs/features/current-design.md` via `git mv` (history
follows the rename) and updated the live links pointing to it (`README.md`,
`docs/handbook/workflow.md`, and the 3 design task files citing it as "IA:"). Deliberately left
`docs/history/*.md` and one stale absolute-path mention in `jun-26-rabbit.md` unedited — those
are dated records, not live navigation, and rewriting them to match a later rename would be
revisionist.

For Verex: could not rename the actual source (would mean touching the verex repo again, ruled
out earlier) — renamed only rabbit's read-only copy to match. Merged "Current Projects" /
"Rabbit — Tasks" / "Verex — Tasks" into one "Current Projects" section: 1 current-design card +
top-2-most-recent task cards per project = 6 total, matching jay's requested split. Verified
every link resolves and confirmed verex's git status stayed clean throughout.

### docs: fix — Current Design belongs in docs/tasks, not docs/features

jay corrected the above entry: the intended file was `docs/tasks/jun-30-rabbit-design.md` (the
most recently-edited design doc — referenced by ~10 other files with section anchors like
`#s2`/`#s5b`), not `docs/features/README.md`. Reverted the features rename and its link
updates, then renamed `docs/tasks/jun-30-rabbit-design.md` → `docs/tasks/current-design.md`,
fixing all live references across `docs/rabbit-design.md`, `tasks/details/`, `tasks/jul-01-...`,
and 6 `docs/features/*.md` files. History entries left alone as before.

Applied the same correction to Verex's rabbit-side copy only: `jul-28-verex-design.md` (the
verex equivalent by last-edit recency) is now `current-design.html` there. Verex's real repo
stayed untouched throughout — confirmed via `git status` after each step.

### docs: full correction — restore Feature Designs card, rename to current-plan.md, add View All Tasks

jay laid out the complete intent again after two rounds of partial misses: (1) keep the section
merge (confirmed correct); (2) restore the `docs/features/README.md` "Feature Designs" card,
which I'd wrongly dropped; (3) rename the task-design file to `current-plan.md` (changed his
mind from "current-design"); (4) Current Projects = 6 cards total, 3 per project (Feature
Designs + Current Plan + 1 latest task); (5) a "View All Tasks" link for files that don't make
the cut, mirroring the Logs section's existing "View All Logs" pattern.

Given this was the third correction cycle on the same section, reflected the full understanding
back in chat and got explicit confirmation ("Go!") before touching files again, rather than
risk a fourth rework. Built `docs/tasks/summary.md` (real file, flows through the normal
pipeline) and a hand-built Verex-side equivalent
(`docs/html/projects/verex/docs/tasks/summary.html`, since verex's repo isn't touched) listing
every task newest-first.

Noted and worked around a side effect: my own cross-reference edits earlier today had bumped
some files' git-commit dates, which would have skewed a fresh "latest" recompute — used the
ranking already established earlier in the session instead of re-deriving from the now-polluted
dates. Verified all links resolve, exactly 6 cards in the section, and verex's git status stayed
clean throughout.
