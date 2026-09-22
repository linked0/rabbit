# 2026-08-03 — rabbit history

> Source docs: [docs/tasks/current-plan.md](../tasks/current-plan.md) — direct chat request from jay (no separate task/design file for this edit).

### docs(plan): add task-status summary table to current-plan.md

jay wanted a quick way to see which of the plan's ~20 sections (§1–§21) are done vs. outstanding
without reading the whole doc. Added a "Task status at a glance" table under §0 Summary, pulling
each section's existing `**Status:**` line (✅ Done / 🟡 In progress / ⬜ To do / 📎 Reference only)
with links back to each section.

### docs(plan): correct 4 statuses against actual codebase evidence

jay asked to mark §2 (Auth+LLM gating) and §5 (KB via MCP+RAG) as done and update §11 (staging
domain); asked to double-check §3 (Market trading) rather than assume. Spawned a verification
agent to check the real code instead of trusting stale doc text. Findings: §3 trading (TradePanel
MetaMask + agent-wallet flow) actually shipped 2026-07-21/22 — updated to reflect it (WebSocket
book + market picker still open). §2 and §5 are NOT done — no BYO-key UI/persisted key, no
KB-over-MCP/embeddings exist (the repo's only MCP server is an unrelated spaghetti-recipe demo);
flagged this to jay, who confirmed keeping both ⬜ To do. §11's Firebase Hosting mechanism was
built but pointed at production, not a staging subdomain — marked 🚫 Not pursuing per jay's
"we do not use a staging server" framing, rather than ✅ Done (which would misstate that the
staging domain itself was built).

### feat(plan): add §22 ERC-8141 and §23 Toss Payments tasks

jay asked to add two new tasks. Researched ERC-8141 first (unfamiliar EIP) — it's Vitalik's
native account-abstraction proposal ("Frame Transactions", tx type `0x06`, CFI status for the
Hegotá fork, not live on any testnet), so scoped it as a knowledge/explainer page rather than a
live demo, since no client supports the new tx type yet. Asked jay which Toss API the second
task meant (Payments / Open Banking / Cert) — confirmed **Toss Payments**, scoped as a KRW
counterpart to §6's Stripe example. Added both as current-plan.md §22/§23 with dedicated detail
docs ([docs/features/erc-8141.md](../features/erc-8141.md),
[docs/features/toss-payments.md](../features/toss-payments.md)), matching the repo's existing
backlog-item convention (§12–§16 style: current-plan.md summary + linked feature doc).

### docs(features): add Status column to the Feature Designs IA table

jay asked to add status to `docs/features/README.md`'s "Target information architecture" table.
Verified against running code rather than trusting the doc (`app/Nav.tsx`, `next.config.js`,
route files, `.github/`) and found the table itself is significantly stale: the Portfolio & Market
row hasn't been split despite §1/§3 already doing so; AI Chat was dropped from the top nav
(2026-08-01, folded into Home); Verex's design (nav external link) was superseded by a Home-page
featured card instead; Game/AP2/JayVerse are still "Coming soon" stubs; and claimed CI/CD
(`common.md`'s `deploy.yml`) doesn't exist — no `.github/workflows/` in the repo at all. Flagged
all of this inline in the table (with links back to the relevant current-plan.md §) rather than
silently marking rows ✅/⬜ from doc text alone. Added rows for the two new §22/§23 tasks.

### docs(plan): design §24 Tech Research hub — before implementing AP2/AA

jay wants a reorg before building AP2 + AA: one new top-menu item ("Tech Research", route `/etc`)
as a landing hub with a card grid — each card links to a real test page (Hyperliquid Trading,
PBS, AP2, AA, …) with a description + "how to run this" note, replacing today's pattern of each
demo getting its own top-nav slot. Noted this formalizes something the plan already assumed:
§7/§14/§15/§16/§22 all already reference `/etc` as their intended home, but it was never actually
built as a page or wired into `app/Nav.tsx`. Wrote the full design into current-plan.md §24
(route/label, card-grid spec with an initial 8-card table, nav-change proposal), left 3 items
explicitly open for jay (fold Market/XYZ fully into the hub vs. keep a top-nav shortcut too;
whether Game/JayVerse move in; final label). Also answered jay's ask for an AA-stack
recommendation (ThirdWeb vs. what's decided): §7 stays on MetaMask Delegation Toolkit since it's
the only stack that actually implements 7702/7715 (thirdweb's AA product is ERC-4337, a different
mechanism); recommended swapping §15 Agentic AA's pillars 2-4 from ZeroDev/Pimlico to **thirdweb**
instead, since that half of the demo is already 4337-based and `docs/features/thirdweb.md`
already flagged this exact comparison — net result is one card genuinely demoing two different AA
standards on two different SDKs, not a compromise. Explicitly not implementing yet — jay said to
review the design first; on go-ahead, will cut a `claude/<topic>` branch before touching app code
per the global GitHub policy (jay confirmed branching happens "after I decide to go").

### docs(plan): §24 nav decisions locked in

jay resolved all three open items via quick-answer: Market/XYZ **fold fully into the PoCs hub**
(no top-nav shortcut kept); Game/JayVerse **stay top-level** (not folded in — they're
product/showcase demos, not "test code"); label is **"PoCs"** (jay's own override of the
"Tech Research" suggestion — shorter, names exactly what these are). Updated current-plan.md §24
throughout to reflect the decided state. Nav shape is now fully locked; still waiting on jay's
explicit go-ahead before writing any app code.

### docs(plan): declutter current-plan.md — move later/backlog detail out to features/

jay felt current-plan.md had grown too cluttered with content for tasks that aren't active right
now. First round of clarification landed on the wrong direction (moving *active* items out); jay
corrected — the goal is moving *non-active* items' detail out, since backlog items (§12–§14, §16,
§17, §21, §22, §23) already follow this pattern (short current-plan.md summary + full detail in a
linked `docs/features/*.md` doc + a Status-table row), it was just §2, §5, and §11 that were still
holding their full detail inline. Moved: §2 (Auth+LLM gating) and §5 (KB via MCP+RAG) merged into
the existing `docs/features/ai-chat.md` (which already covered §5b/Jay Chat, so this consolidates
all of AI Chat's design in one place); §11 (Staging domain) got a new
[docs/features/staging-domain.md](../features/staging-domain.md). Added a Staging Domain row plus
three missing rows for the knowledge pages (§18 Merkle vs Verkle, §19 Linera, §20 Web stack —
these existed as `docs/knowledge/*.html` files but were never listed in the IA table) to
`docs/features/README.md`. Also removed the README's "Roadmap — phase · step schedule" table
(jay: don't need it — it was the original Jun-30 P1–P3 estimate, superseded by how work actually
sequenced) and a stale "Status / prerequisite" closer that still claimed Portfolio & Market needed
merging, though §1 already shipped that. Refreshed §10's stale "next steps" note, which still
described the old §2→§5→§6/§7 order, to reflect the actual reprioritization to §24 first.
current-plan.md now holds only active work (§0, §1, §3, §4, §6, §7, §8, §9, §10, §15, §24) plus
thin pointers for everything else — 701 → 657 lines despite adding all of §22–§24 this session.

### docs(plan): narrow current-plan.md to only AP2 + AA

jay pushed further: strip current-plan.md down to *only* AP2 (§6) and AA — clarified "AA is for
Account Abstraction" (not narrowly "Agentic AA"), which settled scope as §7 (7702/7715
foundation) + §15 (Agentic AA pillars) together, plus §24 (the PoCs hub reorg jay explicitly
wants done first). Confirmed content should be preserved, not deleted, before touching anything
this large with no commit to fall back on. Moved everything else out for real this time (the
previous pass had only trimmed §2/§5/§11 — §1/§3/§4 and the whole §12–§23 backlog were still
sitting in current-plan.md as pointer stubs): §1+§3 (Portfolio/Market, incl. the full Hyperliquid
trading decision log — auth model, phase 2a/2b, order rules, the Jul-21 request) rewritten into
`docs/features/portfolio-and-market.md`; §4 into a rewritten `docs/features/knowledge-base.md`;
§8's IA-update scope folded into §24 (which already supersedes it) with a one-line pointer in
§10. Repointed every cross-reference across the repo that linked a `current-plan.md#sN` anchor
now being removed — 8 feature docs, `README.md`'s IA table, plus two files outside `docs/features/`
(`docs/rabbit-design.md`, `docs/tasks/details/hyperliquid-advanced-market.md`) — to either the
relocated content or a plain non-broken description; verified with a repo-wide grep that zero
dangling `current-plan.md#sN` links remain. current-plan.md: 657 → 220 lines, scoped to just
§0/§6/§7/§9/§10/§15/§24; original section numbers kept as-is (not renumbered) so nothing else in
the repo needed touching for numbering. `docs/features/README.md`'s IA table is now stated
explicitly as the single status source for everything except this file's active AP2/AA/PoCs-hub
work.

### docs(plan): renumber current-plan.md sequentially, add a Prerequisites section

jay flagged two things: the kept-as-is section numbers (§0 jumping straight to §6) read as
broken, and asked for the `.env.local` inventory I'd given him in chat to be written into the
doc instead of staying only in the conversation. Renumbered §0/§6/§7/§9/§10/§15/§24 to a clean
§0–§7 sequence (mapping noted at the top of the file for anyone following an old link) and
inserted a new §1 "Prerequisites — provided config & API keys" listing what's already in
`.env.local` (redacted) vs. what's still needed per step — nothing for §7 (PoCs hub), a Stripe
test-mode key pair for §2 (AP2), `SEPOLIA_RPC` reusable for §3 (AA foundation), a thirdweb
client ID for §6 (Agentic AA pillars). Repointed the handful of external cross-references
(`docs/features/README.md`, `erc-8141.md`, `toss-payments.md`) that used the old numbers.

### feat(nav): build the §7 PoCs hub — `/etc` card grid, fold Market+XYZ into it

jay gave the go-ahead to start building, on a new branch (`claude/pocs-hub`, per the standing
GitHub policy — created before any code changes), local-only testing until review. Implemented
per the §7 design: `lib/poc-cards.ts` (8-card bilingual data: Hyperliquid Trading + PBS as
`live`, AP2/AA/Solana/Zapier MCP/ERC-8141/Toss Payments as `soon`), `app/etc/Card.tsx` (renders
a live card as a `Link`, a "soon" card as a disabled div — reused the existing `.kpi`/`.scenario-grid`
card-grid pattern from `/projects` for visual consistency, added `.poc-grid`/`.poc-badge`/`.poc-howto`
to `globals.css` rather than repurposing `.kpi-chip`'s pos/neg since that's semantically tied to
price direction, not a Live/Coming-soon status), `app/etc/page.tsx`. Removed the `Market` and
`XYZ` entries from `app/Nav.tsx`'s `MENU` (routes stay public and working, only the nav entry
point changed) and added a `PoCs` entry (`code: "ETC"`, `pub: true`) in their place; added `/etc`
to `middleware.ts` `PUBLIC_PATHS`; added `ALLOW_ETC=true` to `.env.local` + `.env.example`
(commented out the now-unread `ALLOW_MARKET`/`ALLOW_XYZ` rather than deleting, in case those ever
come back as standalone nav items). AP2 and Game/JayVerse nav entries untouched, matching the
design (AP2 retires from top nav only once §2 ships as a card; Game/JayVerse were explicitly
scoped out of the hub by jay).

Verified locally only (no deploy): `pnpm build` passes clean; dev server smoke-tested all
routes logged-out — `/`, `/etc`, `/market`, `/xyz`, `/projects` → 200, `/ap2`, `/jayverse` → 302
(still owner-gated, unchanged). Confirmed via the rendered `<nav>` HTML that the menu now shows
exactly `/`, `/projects`, `/etc` to a logged-out visitor (Market/XYZ gone, PoCs present) and that
the `/etc` page's 8 cards render with the right Live/Coming-soon split in both `ko` and `en`.
Nothing committed yet — working tree changes on `claude/pocs-hub`, waiting for jay's review.

### docs(plan): trim §1 Prerequisites — jay wanted the ask, not the inventory

jay pushed back: the "already set" inventory in current-plan.md §1 was noise — he just wanted to
know what to hand over for Stripe and thirdweb. Cut §1 down to the four "needed" bullets only,
dropped the full env-var listing.

### feat(nav): add TIL ("Today I Learned") — a second demo hub, same format as PoCs

jay asked for one more top menu, same pattern as PoCs, this time for code re-implementing things
from his daily learning (a math formula, an algorithm, a recommended-service integration) — read
from `~/temp/morning-report.md` §1 Trends / §2 Basic Knowledge for *inspiration*, not as a live
content source (that file is private, local-only, and mixes in family/health/financial content
having nothing to do with this). jay will fill in the actual code later; asked for "Coming soon"
placeholders sourced from today's (2026-08-03) report entries.

Refactored first rather than duplicating: pulled the card type out of `lib/poc-cards.ts` into a
shared `lib/demo-cards.ts` (`DemoCard`), and moved `app/etc/Card.tsx` to a shared
`app/DemoCard.tsx` — both `/etc` and `/til` now render off the same component. Added an optional
`noteLabel` prop so the card's bottom slot can read "How to run" (PoCs, since those cards link to
real interactive pages) vs. "Source" (TIL, since these describe where the learning came from, not
an action) without forking the component. Added `lib/til-cards.ts` with 3 seed cards, all
`status: "soon"`, picked to match jay's three named categories exactly: geometric series → DCF
valuation (Math, from today's Day 7/50 math track), amortized analysis via potential functions
(Algorithms, today's Day 1/100 dev-knowledge track), Moralis wallet snapshot via API (Service,
today's 39/113 service-discovery track). `app/til/page.tsx` shows "TIL" in the nav (matching the
terse `PoCs`/`AP2`/`XYZ` style) and "Today I Learned" spelled out on the page itself, per jay's
instruction. Added the `TIL` nav entry (`code: "TIL"`, `pub: true`) right after `PoCs`, `/til` to
`middleware.ts` `PUBLIC_PATHS`, `ALLOW_TIL=true` to both env files. Added a TIL row to
`docs/features/README.md`'s IA table, matching the PoCs row.

Verified locally: `pnpm build` passes clean (new `/til` route, `/etc` unaffected by the shared-
component refactor); dev-server check confirms the nav now shows `/`, `/projects`, `/etc`, `/til`
to a logged-out visitor, all 3 TIL cards render with the right title/description/badge/source
note in both `ko` (default) and `en`, and the `/etc` page still renders identically post-refactor.
Nothing committed — still on `claude/pocs-hub`, waiting for jay's review before any deploy.

### docs(plan): current-plan.md down to just AP2 + AA — hub moved out

jay: keep current-plan.md to only AP2 + AA, "remove other unimportant task like hub." Moved §7
(PoCs hub) out to a new [docs/features/pocs-hub.md](../features/pocs-hub.md) — full goal/route/
card-set/nav-change content, matching the convention already used for every other backlog item.
Kept the "AA implementation stack — thirdweb" reasoning *in* current-plan.md though, folded into
§6 (Agentic AA) rather than moved with the rest of §7 — it's core AA planning content that just
happened to be written under the hub section originally, not hub plumbing. §5 (Sequence) now
only lists the two AP2/AA build steps, with a one-line note that both depend on the PoCs hub
existing (tracked separately). current-plan.md: 220 → 158 lines, sections 0–6 only.

While doing this, found and fixed several **older** stale references the 2026-08-03 renumbering
pass had missed — plain-text section mentions like "design §7" and "§7's demo" (not markdown
links, so didn't match that pass's link-pattern grep) in `agentic-aa.md` (7 occurrences) and
`erc-8141.md` (1), all meaning the old §7 = ETC/AA-foundation, now §3. Also a stale "(§6, §7,
§15, §24)" in `features/README.md`'s intro paragraph. Fixed all of them, then re-verified with a
repo-wide grep for both `current-plan.md#sN` link syntax and bare `§7`/`§15`/`§24` text mentions
— zero remaining except current-plan.md's own explanatory note about the old numbering scheme.

Also answered jay's direct follow-up on Stripe/thirdweb credentials with the concrete values
needed (Stripe test-mode publishable + secret key from the dashboard's Test mode toggle;
thirdweb Client ID, optionally the paired Secret Key) rather than repeating the doc bullet.

### meta: cross-machine continuity rule + history links from current-plan.md

jay wants to resume this work from a different machine (home) via a fresh Claude session with no
conversation history, using only current-plan.md as the entry point. Added a "Cross-machine
continuity" section to `~/.claude/CLAUDE.md` (global, applies everywhere): treat the active
plan/task doc as a resumable state file, not just a design record, and — jay's own refinement —
keep it lean by **linking to the day's `docs/history/*.md` entry** for the full blow-by-blow
instead of duplicating detail inline. Also added a rule to flag explicitly whenever a plan doc is
accurate but the underlying work is sitting uncommitted, since a doc that never leaves this
machine doesn't help elsewhere.

Applied the pattern immediately: added a top-of-file "History" pointer in current-plan.md to
today's history file, and a specific link from §5 Sequence to the "PoCs hub"/"TIL" entries in
this file (where the actual build detail lives). Mirrored the same link into
`docs/features/pocs-hub.md`'s status line and the TIL row in `docs/features/README.md`, so the
whole chain (current-plan.md → pocs-hub.md/README.md → this history file) is link-connected for
someone resuming cold.

**Flagging per the new rule:** everything from today — the plan-doc restructuring, the PoCs hub
code, the TIL hub code, all env var changes — is still sitting uncommitted on `claude/pocs-hub`
in this machine's working tree only, not pushed anywhere. None of it is reachable from another
machine yet. Asked jay whether to commit + push now.

### meta: history link belongs in §0 Summary, codified as a rule

jay: the history-file link should live in "0. Summary," not the header preamble. Moved it there
in current-plan.md, and added the placement to the `~/.claude/CLAUDE.md` continuity rule so it's
consistent in every project going forward — per-section links to a specific entry are still fine
alongside it, just not the only place the pointer lives.
