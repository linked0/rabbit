# 2026-09-22 — docs (alice ⇄ rabbit)

Source docs: [`../tasks/current-plan.md` §8](../tasks/current-plan.md#docsmove) — the move is
recorded there, together with what is still jay's to do.

### Move features/, tasks/ and history/ from alice back to rabbit

**Cause:** jay, 2026-09-22: move `docs/features` and `docs/tasks` out of alice into rabbit, then
"you should also move the history folder". They had lived in alice since 2026-09-14.

**Reasoning:** the three had to move together, not one at a time. They carry 280 relative links
*to each other* (139 → `../tasks/`, 126 → `../features/`, 15 → `../history/`), so any subset left
behind would have broken all of them; moving the set kept every link intact. Checked the links
pointing *outward* before committing to it: of 22 distinct targets, 11 were already dead in alice
today, 7 exist in both repos, and only 4 (`../topics/…`) break as a result of the move — a small
enough bill to pay. Both repos publish Pages, so nothing went off the web; only the URL changed.

**Change:** 176 markdown files moved; alice lost 353 files (the markdown plus its generated HTML).
alice's `generate-docs-html.mjs` gained the absent-folder guards rabbit's copy already had from the
2026-09-14 move in the other direction. alice's `docs/logs.html` was deleted and its generator now
exits early — that page is built from `docs/history/*.md` alone, so without the folder it was 93
dead links. Both index pages in each repo were repointed: alice's two copies (`index.html`, the one
Pages serves, and `docs/index.html`) now link out to rabbit's Pages; rabbit's cards came home.

**Result:** rabbit regenerates 443 markdown files with a 19-entry tasks index, a 108-entry history
index and a 109-entry logs page; alice regenerates 1514 files with both indexes correctly empty.
Found and fixed a pre-existing 404 on the way: rabbit had linked to
`linked0.github.io/alice/html/docs/…` since 2026-09-14, but alice serves from its repo root, so the
only working prefix was `/docs/html/docs/…` — verified with `curl`, 404 vs 200. Still open: the
"central history folder" path in `~/.claude/CLAUDE.md` still says alice, which will misfile every
future daily log until it is changed.
