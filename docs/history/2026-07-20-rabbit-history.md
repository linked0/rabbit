# 2026-07-20 — rabbit history

Source: jay's direct request in chat (make the GitHub Pages site for this repo serve the
knowledge-base page as its entry point). No task/design doc — conversational request.

### Pages: rename docs/know.html → docs/index.html

Renamed so GitHub Pages (serving from `/docs`) uses the knowledge-base page as the site
entry point — Pages only serves `index.html` as the root document; the Settings UI cannot
pick an arbitrary file. Carried along jay's pending content edit (Jul 17 history cards
added, two Jun 26/29 cards removed). `public/know.html` (the copy the Next app serves at
`/know.html`) is untouched, so the app route and middleware allowlist still work.

### Gotcha: Pages deploys from gh-pages, not main

`gh api repos/linked0/rabbit/pages` shows the Pages source is branch **`gh-pages`**,
path `/docs` — pushing `main` alone never updates the site. No sync workflow exists;
`gh-pages` was a stale ancestor of `main`, so deploying = fast-forward push
`git push origin main:gh-pages`. Verified live afterwards: site root serves the
knowledge-base page; old `/know.html` returns 404.

### Fix back-links after the rename

Updated `../know.html` → `../index.html` in `docs/db.html` and
`docs/postgres-upsert-demo.html` (2 links each) so the "Back to Knowledge Base" links
don't 404 on the Pages site after the rename.
