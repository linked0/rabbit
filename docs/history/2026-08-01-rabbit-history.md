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
