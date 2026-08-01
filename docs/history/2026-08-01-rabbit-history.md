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

### feat: Jay Chat — public About-Jay persona chat (branch: claude/jay-chat-public)

jay wanted the "AI Chat" nav item restored and renamed to "Jay Chat" — turns out the real gap
(already flagged in `docs/features/ai-chat.md`) was that `/chat` has always required login, so
logged-out visitors (employers/clients — the actual intended audience) never had access. Talked
through the design first: public keyless persona-only endpoint, GitHub + LinkedIn as additional
corpus sources (LinkedIn manually, never scraped — against its ToS), production model (OpenAI)
over local LLM for now, RAG technique — all per jay's explicit calls.

Security discussion before building: agreed on 5 required (not optional) safeguards — dedicated
API key, OpenAI account-level hard spending cap, hourly token budget, per-IP burst guard, scoped
system prompt. Then refined the budget scope with jay: hourly *token* total (not per-minute,
not per-message-count) since a real employer conversation shouldn't hit an artificial wall, and
—jay's call, given traffic is currently rare—global pool rather than per-visitor, accepting that
tradeoff as fine for now and cheaply upgradable later if traffic picks up.

Built as an isolated new feature (`/jay-chat`, `/api/jay-chat`, `lib/jay-chat.ts`) rather than
retrofitting the existing private `/chat`, so there's zero risk to it. Reused the already-working
RAG core (`lib/about-me.ts`) unchanged. Added `content/profile/github-summary.md` from GitHub's
real public API (linked0) — picked up automatically by the existing corpus loader, no code
change needed. Also fixed a real deploy gap found along the way: `content/` wasn't being copied
into the Cloud Run image, so the markdown corpus depth silently only worked in local dev —
updated the `Dockerfile` and corrected the now-stale note about it in the feature doc.

Verified end-to-end locally (temporary dev server on a spare port — port 3100 was already in use
by what looked like jay's own running server, left untouched): real grounded answers including a
GitHub-specific question pulling the new corpus file, oversized-message rejection, and the burst
guard tripping at exactly the configured threshold.

Committed on `claude/jay-chat-public`, not pushed — this is real app code (not the docs-only
work from earlier today), so held off pending review. Also not yet deployable: needs a real
dedicated `JAY_CHAT_OPENAI_API_KEY` from jay (not his existing `AI_API_KEY`) with its own
spending cap set in the OpenAI dashboard.

### deploy: Jay Chat live on production

jay provided the dedicated key. Verified it directly against OpenAI before wiring it in, then
verified the actual `/api/jay-chat` route end-to-end locally with the real key (not the borrowed
`AI_API_KEY` used for the earlier smoke test) — asked "How do I contact him?", got back the
correct grounded answer with jay's real email.

Extended `scripts/deploy.sh` with the same `upsert_secret` pattern already used for `AI_API_KEY`
etc. — new `rabbit-jay-chat-key` Secret Manager secret, wired in only when
`JAY_CHAT_OPENAI_API_KEY` is set in `.env.local`. jay confirmed he didn't want to wait for the
OpenAI-side spending cap before deploying, since the app's own safeguards (hourly token budget,
burst guard, request caps — all already tested) provide real protection on their own; the
account-level cap is a defense-in-depth backstop, not a blocker.

Merged `claude/jay-chat-public` into `main` and pushed first (keeping "what's live" in sync with
"what's on main," same as today's earlier pattern), then ran the actual deploy —
`rabbit-jay-chat-key` secret created, new revision (`rabbit-00014-v7w`) serving 100% of traffic.

Verified live on the real production domain, not just Cloud Run's `*.run.app` URL:
`https://www.jaylabs.xyz/jay-chat` loads (200), `/api/jay-chat` returns a real grounded answer,
and the nav genuinely shows "제이 챗" (Jay Chat) publicly — confirmed `ALLOW_CHAT=true` was
already set locally so the menu item didn't silently stay hidden behind its visibility flag.

### feat: Telegram notifications for site visits + Jay Chat starts, deployed

jay asked for the same Telegram-notification pattern built for verex earlier today to also
cover rabbit: notify on home-page/other-page visits and on chat starts. Added
`lib/visitor-notify.ts` (`notifyPageView`, `notifyChatStart`), fire-and-forget, 5-minute
per-(page, visitor) debounce so refreshes don't spam duplicates. Wired into the home page
(`app/home/page.tsx`, served at `/` via the existing rewrite), the Jay Chat page, and the first
message of a new Jay Chat conversation. Scope assumption: these two entry points, not every page
site-wide — flagged for jay to confirm or expand later.

Local testing hit a real but environment-local snag: Node's `fetch` to `api.telegram.org` timed
out from this sandbox specifically (both IPv6 and IPv4 connection attempts failed at the socket
level, confirmed with `--dns-result-order=ipv4first`), while `curl` to the same host succeeded
instantly. Diagnosed as a sandbox-local networking quirk, not a code bug — didn't chase it
further since the identical fetch pattern already proved working end-to-end against verex's real
Cloud Run deployment earlier today (jay confirmed receiving that message). Deployed anyway on
that basis, and confirmed live afterward (home + jay-chat both 200).

`scripts/deploy.sh`: `TELEGRAM_BOT_TOKEN` through Secret Manager (`rabbit-telegram-bot-token`,
same `upsert_secret` pattern as everything else), `TELEGRAM_CHAT_ID` as a plain env var.

### fix(nav): EN/KO menu labels had drifted apart

jay noticed the top-menu labels didn't match between languages. Found two real mismatches:
`/market` said "마켓" (KO) vs "Hyperliquid Trading" (EN), and `/xyz` said "XYZ 데모" (KO) vs "PBS"
(EN) — both pre-existing, not introduced today. Used each page's own `<h1>` (which already agrees
between languages) as the source of truth rather than guessing: `/market`'s h1 is just "Market"
in both languages, `/xyz`'s is "XYZ Demo — PBS consumer track" in both — so aligned the nav's EN
labels to match KO (and the pages' own titles) rather than the other way around. Deployed and
confirmed live.

**Correction:** jay wanted the opposite direction — keep the *English* labels and align Korean to
them. Redid it: `/market` → "하이퍼리퀴드 트레이딩" / "Hyperliquid Trading", `/xyz` → "PBS" in both
(kept as the acronym, matching how "AP2" stays untranslated elsewhere in the nav).

### content: enrich the profile tagline

jay wanted the tagline to cover more than the generic specialization line. Drafted an added
sentence for review first (he'd asked to see it before committing), iterated once on his feedback
(drop "설계" — keep just "구현"), then committed the approved version: L1 blockchain engine built
from scratch + hands-on end-to-end experience across DAO governance, NFT marketplace, and
prediction market platforms. Feeds both the homepage headline and Jay Chat's RAG corpus.

### feat: merge Featured+Projects on home, inline Jay Chat, add /projects

jay's homepage restructure. Reflected the full design back in chat before touching code (it's a
live public portfolio, and the request had several interacting parts), and confirmed two open
points with him: URL = `/projects`, and `/jay-chat` removed entirely rather than kept unlinked.

Home now has one "수행 프로젝트" section replacing the separate Featured + Projects sections, split
half/half: left = Verex featured card with the rotating 3D sphere, right = compact text-only
project list + a "전체 보기 →" link. Jay Chat is inline below it. The full Featured card and
image-card grid moved to the new `/projects` page.

Notable details: `/api/jay-chat` is intentionally kept (the inline chat still calls it) — only the
page route is gone. Created a new `ALLOW_PROJECTS` flag rather than reusing `ALLOW_CHAT` for a
differently-named menu item, since silently repurposing the old code would have been confusing
later.

Checked both pages **visually in a browser** at 1280px before deploying, not just via build
output — which caught a layout flaw the build couldn't: the Verex card only filled the top of its
column, leaving a large empty gap next to the taller project list. Fixed with equal-height
columns. Deployed and confirmed live (home 200, /projects 200, old /jay-chat 302, nav shows
"수행 프로젝트", inline chat returns a real grounded answer).

### style(home): Projects section cut to ~1/3 height

jay's screenshot feedback: the section was too tall, and the per-project description line under
each title was what made the right column so high. Measured before/after rather than eyeballing
(his target was 30–40% of original): **537px → 179px = 33.3%**. Three changes got it there —
dropped the description lines (titles only), showed 3 projects instead of 7, and moved
"전체 보기 →" from below the list up beside the section heading (~30px saved, and it reads
better). Checked at 1280px and 390px.

### feat: résumé + LinkedIn corpus, one-click prompts, curated home projects

jay reported Jay Chat refusing "어떤 학교를 나왔어요?" and supplied his résumé (PDF ×3) and a
LinkedIn MHTML export. No PDF tooling was installed (no pdftotext/poppler, and pip is
externally-managed) — used a throwaway venv with pypdf, and parsed the MHTML via Python's `email`
module.

Built `content/profile/resume-career.md` from them. Fixes the reported failure, and closed a gap
nobody had noticed: the corpus had **no mention of his current job** — it ended at ZeroOne (2023).
Now includes Blockchain Lead at Sapiens AI (2025.07~), the full career back to 1997,
certifications and skills.

**Privacy call — the important part.** Those documents contained a phone number, home address,
birth year/age/gender, GPA, a certificate ID, and a personal gmail. This corpus feeds a *public,
unauthenticated* endpoint, so all of it was deliberately excluded (kept only the already-public
linked0@me.com). Verified two ways: grepped the corpus, and asked the live production bot for
each — it refuses. This matches the privacy line jay drew earlier (relationships/feelings/private
life off-limits); he was told explicitly so he can ask for any of it back if he actually wants it.

Also: example prompt buttons now **send on click** instead of just filling the input — refactored
`send()` to take the text as an argument so the form and buttons share one path. And the home
project list is now a fixed set of the three jay called most important (NFT Marketplace, DAO
Governance, EVM-based Bosagora Mainnet) rather than the 3 most recent by date.

Verified in a real browser (a scoped locator was needed — the first `button.ghost` on the page is
the EN language toggle, not a chat prompt) and again on production after deploy.

### content: Verex as the current prediction market

Asked "예측 시장 프로젝트가 뭐죠?", Jay Chat only described Nostra — the older project — since
that was the sole prediction-market entry in the corpus. Added
`content/profile/prediction-market-verex.md` covering both: Nostra as the first take, Verex as
the current improved successor (live at verex.jaylabs.xyz, built at Sapiens AI).

Facts pulled from the verex repo rather than written from memory, and deliberately split into
"built and running" (CTF markets, CLOB+AMM, multi-outcome groups, async settlement, MM agent,
Sepolia on Cloud Run/Cloud SQL) vs "planned/exploratory" (EIP-7702 AA, negative-risk MM,
Chainlink CCIP, markets-as-tokens, MCP), following the repo's own S1✅/S2-current/S3–S10-planned
status. This bot talks to potential employers — claiming unshipped features as done would be the
worst failure mode. Verified: asking whether AA/CCIP already work returns "don't have that
detail", not a false yes.

### fix(rag): corpus docs were being silently truncated

Found while testing a new career-summary instruction that the bot kept ignoring. Root cause:
`markdownChunks()` produced ONE chunk per file capped at 1200 chars. `resume-career.md` is ~8.6k,
so everything past the first 1200 chars — the entire guidance section, and most of the career
history — was unreachable by retrieval. The model wasn't disobeying; it could not see the text.

Fixed by splitting each doc on its `##`/`###` headings so every section (and each employer entry)
is separately retrievable, with the cap now per-chunk. Verified every section of
`resume-career.md` now fits under the cap. This silently improves answers across the whole
corpus — the older project write-ups had been cut off the same way.

### feat: career-summary prompt + honest model attribution

First example prompt is now "주요 경력을 요약해주세요" / "Summarize his career", with corpus guidance
for the answer's shape (per jay, refined once): 1997–**2013** compressed to one sentence — Myriad
folded in at his request, so the detailed part now starts at People & Technology (2013) exactly
where his blockchain work begins — then one line per role through Sapiens AI, closing with
project highlights, and never omitting the current role.

Chat subtitle now names the model actually in use: "OpenAI ChatGPT(gpt-4o-mini) ... (RAG)". jay
asked whether to also write "local LLM"; deliberately did NOT, since Jay Chat only calls OpenAI
today (`lib/jay-chat.ts` has no local path) and advertising an unwired backend on a public page
would be false. Worth adding once it actually exists.

### note: cost exposure review (Telegram vs OpenAI)

jay asked whether frequent Telegram notifications could get expensive. Telegram's Bot API is free
(only rate limits, no billing), and the extra Cloud Run egress is negligible — the real cost
driver is OpenAI. While checking, found and corrected an earlier overstatement of mine: the
hourly token budget in `lib/jay-chat.ts` is in-memory and therefore **per instance**, and both
services run `maxScale=20`, so the effective ceiling is up to 20×30k tokens/hour, not 30k. jay
has since set an $80/month hard cap on the OpenAI side, which bounds the worst case (~9 days of
a saturated attack to reach it), so the offered Postgres-backed global counter was deliberately
NOT built — it would add DB complexity to defend an already-bounded risk. Revisit if Jay Chat
ever gets real traffic.
