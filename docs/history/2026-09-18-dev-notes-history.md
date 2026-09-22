# 2026-09-18 — Tech Notes (alice)

Source: jay's request in chat (screenshot of Chainlink's post on Bottomline Global Pay Connect) plus the daily source file `alice-tech-2026-09-17.md` (rule in `docs/topics/README.md`). No task/design doc.

### Tech Notes #56 Bottomline Global Pay Connect and #57 FOMC first hike; Dev English #23–24; progress log for 09-16/17

- **Cause:** jay: "Add this tech item" (Chainlink post: top-three Swift service provider Bottomline launched Global Pay Connect, onchain payment connectivity for 600+ banks on Chainlink CCIP and CRE), then "Push". First tech-item request of the KST day, so the alice-tech rule ran: `alice-tech-2026-09-18.md` does not exist yet (04:56 KST), `alice-tech-2026-09-17.md` read; its first unused `[오늘 · …]` candidate taken.
- **Reasoning:** #56 — the product is an adapter, not a ledger: the bank keeps sending ISO 20022 over the Swift connectivity Bottomline already sells, and the platform routes to a tokenized deposit or stablecoin behind that. "600+ banks" is the customer base; no bank, chain, asset, date, or volume is named, and the 09-03 partnership framed it as an option. Context: Swift's own ledger went live 2026-07-09 with 17 banks, also on CCIP, so one interop vendor now spans the network and its largest bureau. Jayverse: instruction first, rail second; connectivity ≠ settlement (which claim, who can freeze); old-business numbers are not new-business numbers. #57 — the hike (25 bp → 3.75–4.00, 12–0, first since 2023-07, Warsh) was priced; the information was the statement's deleted energy/supply-shock sentence, the 12/4/2 dot split, a 2027 median held by a close 8/6/4 vote, and no chair's dot. Jayverse: Verex markets on statement text and dot counts (canonical, archived resolution sources); Number stores probability paths, not outcomes; DeFi prints the negative jeETH carry. Both NEW, dated 2026-09-18, at the first not-done slots (#56, #57); Canton and Clarity shift to #58, #59. Dot-plot discrepancy resolved: "12 of 18" (one more hike) and "16 of 18" (at least one more) are both correct; CNBC returned 403, so Yahoo Finance, Traders Agency and KuCoin were used.
- **Change:** `scripts/add-tech-item.py` twice (keys `bottomline-swift-message-new-destination`, `fomc-first-hike-deleted-sentence`); `english-23.md` (behavioural interview: disagreeing with a manager without "I was right") and `english-24.md` (first one-on-one with a passed-over senior) via `scripts/english-notes.py`; `_nav.js` `progress` gained 2026-09-16 and 2026-09-17 entries (61/442 both, no counter changes those days) before the counters moved; the static blue badge on all 293 pages synced to "closing status on 2026-09-17 · 61/442". Also committed: `docs/history/2026-09-16-gitboard-history.md` from the 09-16 session.
- **alice-tech usage:** 2026-09-17 `[오늘 · X(트위터)] 연준 25bp 인상` → #57. Remaining 09-17 candidates in file order: LinkedIn (EIP-8141 / EIP-8130 wallet standards coexist), a16z (ETF −$5.9억), Four Pillars (규제 공백 세 발표), 딥다이브 (점도표 세 겹 읽기, now largely covered by #57), 서비스 (Glamsterdam devnet, Sepolia fork 09-28). 09-16 leftovers are out of the two-day window.
- **Result:** counters Blockchain 55/230, Fundamentals 6/192, Dev English 0/24, overall 61/446; nav sequence and card numbering verified 1–230; kickers `#56 · PoC · 2026-09-18`, `#57 · PoC · 2026-09-18`. Branch `claude/notes-bottomline`, merged to main and pushed at jay's request.

### Tech Notes #56 Toss × KOMSCO voucher PoC and #57 EIP-8141 / EIP-8130 coexist; Dev English #25–26

- **Cause:** jay pasted Toss's 2026-09-18 announcement (PoC with 한국조폐공사 complete: 지역사랑상품권 test environment, Optimism-based chain, Privacy Boost, pay-and-settle as one transaction, merchant-timed disbursement) — "Add this item". Second request of the day: `alice-tech-2026-09-18.md` still absent at 08:48 KST, so the next unused 09-17 candidate was taken.
- **Reasoning:** #56 — the news is the settlement design, not the token: atomic pay-and-settle removes reconciliation, float and the fixed settlement day; merchant-pulled disbursement makes the calendar a recipient policy; the operator keeps its platform because the chain sits behind it. The unnamed fact is the settlement asset (deposit token, stablecoin, or test token) and its issuer, the same gap as Bottomline and Canton this week. Jayverse: KRW leg and Verex payout as pay-and-settle plus recipient-pulled withdrawal; privacy layer as the first fork for institutional work; name the asset. Background verified from the April MOU (etnews) and July Optimism/Sunnyside MOU (Asia Business Daily, Cointelegraph); no 09-18 article fetched, jay's paste is the primary. #57 — talks to merge L1's Frame Transactions (8141: programmable frames, full-EVM validation, quantum migration, Hegotá must-ship, 2027) and Base's 8130 (new tx type + on-chain keystore, constrained verifier, ~63% less gas than 4337, Cobalt this month) ended the week of 09-14 (Chiang quote via CoinDesk). Reading: a closed question is designable; the first to ship sets the de-facto standard, so 8130 first; decide the existence of an intent→assembly adapter and one signature-verification module now. Both NEW, dated 2026-09-18, slots 56/57; Bottomline/FOMC → 58/59, Canton/Clarity → 60/61. Dev English #25 (take-home debrief: reviewer finds a race condition) and #26 (pushing back on a CTO's date with a shadow-demo counteroffer).
- **Change:** `scripts/add-tech-item.py` twice (keys `toss-komsco-voucher-settlement-on-optimism`, `eip-8141-8130-wallet-standards-coexist`); `english-25.md`, `english-26.md` via `scripts/english-notes.py`; `notes.html`, `_nav.js`, four new pages; counters and pagers rebuilt.
- **alice-tech usage:** 2026-09-17 `[오늘 · LinkedIn] 이더리움·Base 공동 지갑 표준 포기` → #57. Remaining 09-17 candidates in file order: a16z (ETF −$5.9억), Four Pillars (규제 공백 세 발표), 딥다이브 (점도표 세 겹 읽기, mostly covered by #59), 서비스 (Glamsterdam devnet, Sepolia fork 09-28).
- **Result:** counters Blockchain 55/232, Fundamentals 6/192, Dev English 0/26, overall 61/450; nav sequence and cards verified 1–232; kickers `#56 · PoC · 2026-09-18`, `#57 · PoC · 2026-09-18`. Branch `claude/notes-toss`, commit ba6ed73; merged and pushed with the next entry at jay's request.

### Tech Notes #56 Stripe × OpenRouter and #57 ETF outflows by window; Dev English #27–28

- **Cause:** jay pasted the Chosun article of 2026-08-17 on Stripe buying OpenRouter ("AI 톨게이트", 5 percent fee, objectivity concern) — "add this also. you can push it". Third request of the day; `alice-tech-2026-09-18.md` still absent at 09:25 KST, so the next unused 09-17 candidate was taken.
- **Reasoning:** #56 — brought forward a month: Stripe confirmed the agreement on 08-19 (terms undisclosed; NYT $7.5 billion; founders about $1.5 billion; May valuation $1.3 billion; Databricks also bid). The two facts under the price: OpenRouter's per-token revenue fell about 60 percent as Chinese open-weight models went from about 2 to over 50 percent of traffic (Sacra), so a flat fee pushes toward volume, Stripe's business; and OpenRouter's usage rankings were the only open gauge of US-vs-China model usage and now belong to a parent with a stake, with a neutrality pledge but no checkable data commitment. Jayverse: one routed key with a spend cap and fallback for our agents (the Alchemy "key is a budget" fix at AI scale); cost beside revenue per request; cite methodology or mark unverifiable. Close status unconfirmed. #57 — 09-15 (−$592M) and 09-16 (−$520M, BTC −$296M, ETH −$224M, ETHA −$110M, IBIT −$144M) both combined-negative, so by the 09-14 rule "exit, not rotation"; month-to-date still positive (BTC +$17M, ETH +$307M); volume 1.6× average makes it a repricing, not a retreat; the 09-17 deciding number was not published in reachable sources (Farside 403). Jayverse: Number prints day, month-to-date, and the named rule on one line; Verex flow markets need source, window, and cutoff. Both NEW, dated 2026-09-18, slots 56/57; Toss/8141 → 58/59, Bottomline/FOMC → 60/61, Canton/Clarity → 62/63. Dev English #27 (why leave Korea: motivation without negativity) and #28 (written blocking comment on a senior peer's design: idempotency-key TTL).
- **Change:** `scripts/add-tech-item.py` twice (keys `stripe-bought-the-meter-openrouter`, `etf-outflows-sign-depends-on-window`); `english-27.md`, `english-28.md` via `scripts/english-notes.py`; `notes.html`, `_nav.js`, four new pages; counters and pagers rebuilt.
- **alice-tech usage:** 2026-09-17 `[오늘 · a16z] 9/15 ETF −$5.9억` → #57. Remaining 09-17 candidates in file order: Four Pillars (규제 공백 세 발표), 딥다이브 (점도표 세 겹 읽기, covered by #61), 서비스 (Glamsterdam devnet, Sepolia fork 09-28).
- **Result:** counters Blockchain 55/234, Fundamentals 6/192, Dev English 0/28, overall 61/454 (13 percent); nav sequence and cards verified 1–234; kickers `#56 · PoC · 2026-09-18`, `#57 · PoC · 2026-09-18`. Committed on `claude/notes-toss`, fast-forwarded to main and pushed at jay's request.

### Tech Notes: source tag (chat / file) on cards and detail kickers

- **Cause:** jay: "Can you add the source in the list and detail page like chat, file", after checking which alice-tech candidates had been used.
- **Reasoning:** the two sources are jay's own paste or pointer in chat and the daily alice-tech file; the tag makes the rule's output visible without opening the history. Shown only on dated items (#54 and later), since older items have neither date nor recorded source; #55 Alchemy predates the date rule and stays untagged.
- **Change:** `scripts/add-tech-item.py` gains `--source chat|file` (default `chat`), a `topic-src` pill after the date on the card, and a fourth kicker span; renumbering leaves both intact. Nine existing items retro-tagged: chat — #54 Quick Slots, #56 Stripe, #58 Toss, #60 Bottomline, #62 Canton; file — #57 ETF, #59 EIP-8141/8130, #61 FOMC, #63 Clarity. README documents the tag.
- **Result:** branch `claude/notes-source-tag`, uncommitted pending jay's review.

### Tech Notes rail: "New" filter button

- **Cause:** jay: "Add New button also in this area" — the rail's Important / All toggle.
- **Change:** third button `New` between Important and All in `notes.html`; filter mode `new` shows only rail items whose dot is NEW (yellow). Important still shows IMPORTANT + RECENTLY DONE + NEW as before; body cards are untouched, as with the other modes.
- **Result:** same branch `claude/notes-source-tag`, uncommitted.

### Tech Notes #56 (Stripe × OpenRouter) marked done

- jay: "make the 56 done". Re-ran `add-tech-item.py` with `--status recent` (same key, same date and source): dot NEW → RECENTLY DONE in `notes.html` and `_nav.js`; counters 56/234 for the section, 62/454 overall (14 percent); overall badge refreshed on every topic page. Committed as 8f63bdb with the source tags and New button.

### Tech Notes #57 (ETF outflows) marked done

- jay: "make the 57 done". Re-ran the inserter with `--status recent --source file`: counters 57/234 → then renumbered below; committed in 8f63bdb.

### Tech Notes #58 S&P Global × OpenZeppelin, #59 dependency is authority (Parity, event-stream); Fundamentals #193 max pain; Dev English #29–31

- **Cause:** jay pasted the S&P–OpenZeppelin note ("add this tech item and push it"), then the options max-pain note ("add this as Fundamentals item"), then "make the 57 done" and "you can push it". `alice-tech-2026-09-18.md` appeared between the second and third requests of the day; the S&P note is its first `[오늘 · …]` candidate, so #58 is tagged `file` although it arrived as a paste. The paired candidate is the file's 딥다이브 entry (Parity 2017 / event-stream 2018), taken out of file order because the file itself links it to the S&P item ("오늘 S&P–OZ 뉴스와 직결"); the LinkedIn (priced-in) and a16z (ETF year-to-date) candidates are covered by #61 and #57, so they are marked covered rather than pending.
- **Reasoning:** #58 — S&P announced 09-17; terms undisclosed, non-material; OpenZeppelin stays a business unit under Brener reporting to the President of S&P Global Ratings; purpose "next generation of onchain security assessments, benchmarks"; library stays MIT and cannot be withdrawn. Jayverse dependency check from the repos: jayverse-token and jayverse-personas pin OZ v5.1.0 as submodule commits; verex inherits v4.7.0 (2022) through the Polymarket ctf-exchange submodule; seven Solidity files import OZ (ERC20, Ownable, ERC721 family); one CI workflow uses `--frozen-lockfile`. Reading: audits become ratings, ratings need comparable fields (permission table, supply invariant, dated parameters). #59 — the two incidents broke no cryptography; the surface is that a dependency is a party with the right to change, not a file; three mistakes (fixed object, popular = reviewed, audit once pin never); pin table per stack. #193 (Fundamentals, Economics) — max pain is a positioning summary, not a target; the morning report's two-week series (below → just above → +2.8% → +2.2%, max pain $78,000 vs spot $76,355) shows the chain re-marking, not price converging; public figures disagree on which expiry (Deribit quarterly 09-25 max pain $72,000; IBIT 09-18 $40), which is itself the point; literature (Filippou, Garcia-Ares, Zapatero) attributes the apparent pull to reversal and expiry trading. Rule: observe, do not predict; write the falsification condition first. Dev English #29 (owning a dependency incident in front of the CTO), #30 (explaining architecture to a COO without the nouns), #31 (a report has a competing offer).
- **Change:** `scripts/add-tech-item.py` gains `--section blockchain|fundamentals` and `--tag`; Fundamentals cards and nav entries carry the `topic-tag` chip after the number, pagers strip it; README documents both. Inserts: #58, #59 (Blockchain, NEW, `file`), #193 (Fundamentals, NEW, `chat`, appended under Economics); `english-29..31.md` via `scripts/english-notes.py`.
- **alice-tech usage:** 2026-09-18 `[오늘 · X(트위터)] S&P Global이 OpenZeppelin을 인수한다` → #58; `[오늘 · 딥다이브] 의존성은 파일이 아니라 남에게 준 권한이다` → #59. Covered by existing items: LinkedIn (미리 반영) → #61 FOMC; a16z (ETF 연간) → #57. Remaining 09-18 candidates: Four Pillars (순유동성), 서비스 (npm 공급망 위생: `--frozen-lockfile`, Dependabot). Remaining 09-17: Four Pillars (규제 공백 세 발표), 서비스 (Glamsterdam devnet, 09-28).
- **Result:** counters Blockchain 57/236, Fundamentals 6/193, Dev English 0/31, overall 63/460 (14 percent); nav and cards verified 1–236 and 1–193; kickers `#58 · PoC · 2026-09-18 · file`, `#59 · … · file`, `#193 · PoC · 2026-09-18 · chat`. Committed on `claude/notes-source-tag`, fast-forwarded to main and pushed at jay's request.

### Tech Notes: fourth section "Mindset" — #1 Terence Tao (hiker vs helicopter), #2 Matt Pocock (fundamentals with AI); Dev English #32–33

- **Cause:** jay: "One more section in Tech Notes, minds or something that means the important mindset of psychological insight for life or developing something. Add these two items into the section and conjecture the proper name" — with detailed breakdowns of Tao's Big Think interview and Pocock's AI Engineer talk.
- **Reasoning:** name chosen: **Mindset** (alternatives considered: Ways of Thinking, Mind & Method); short, parallel to "Dev English", and the lead paragraph carries the definition. Placed between Fundamentals and Dev English because `english-notes.py` removes and re-appends its own section, nav group, pill and jump entry last; a section after it would be reordered on every regen. Items reuse the Blockchain item format (EN+KO copy, Why / How / Where it lands) via the generic inserter, with kicker type `Talk`. #1 — Tao: hiker vs helicopter; depth vs breadth; Kepler as the warning that fast fit kills true ideas; four proof stages and "proof indigestion"; his allocation (errands to AI, the core problem by hand); the seed-corn warning about training. #2 — Pocock: specs-to-code compounds entropy; four failure modes paired with old disciplines (design concept → "grill me", ubiquitous language → glossary, outrunning headlights → TDD as speed limit, shallow modules → deep modules and grey-box delegation); AI as sergeant, human as strategist. Both tagged `chat` (jay's summaries are the source; videos not re-watched). Dev English #32 (interview: how do you use AI, errands vs walks) and #33 (planning: grill me before you plan) draw on the two items.
- **Change:** `notes.html` section shell (nav group, article, rail pill) inserted before Dev English; `_nav.js` section and jump entry; `scripts/add-tech-item.py` gains `--section mindset` (Fundamentals' next-anchor now points at Mindset); two `pocs-*.html` pages; `english-32.md`, `english-33.md`; README section.
- **Result:** sections Blockchain 57/236, Fundamentals 6/193, Mindset 0/2, Dev English 0/33; overall 63/464 (14 percent); article and nav order verified; kickers `#1 · Talk · 2026-09-18 · chat`, `#2 · …`; pagers link 1 ↔ 2. Branch `claude/notes-mindset`, uncommitted pending jay's review.

### Tech Notes: section labels renamed — "Blockchain & Tech" → "Tech", "Dev English" → "English"

- jay: "Change the section names". Labels only; section ids (`sec-blockchain`, `sec-english`) and page names unchanged so every link and anchor still works. Replaced in `notes.html` (rail pills, nav group labels, article h1s), `_nav.js` (section and jump labels), `scripts/add-tech-item.py` and `scripts/english-notes.py` (so regenerations keep the new names), both READMEs (old names noted once as "formerly"). Dev English pages regenerated: titles now "… — English — Tech Notes". Rail reads Tech · Fundamentals · Mindset · English. Same branch `claude/notes-mindset`, uncommitted.

### Rail badges: no "done" word, current and previous-day on one line; nav group counts synced

- **Cause:** jay (screenshot of the two stacked badges): "we don't need done in red and make the two in one line". Also found while renaming: the rail's group labels had drifted (Tech 225, Fundamentals 192, Mindset 0 against sections of 236 / 193 / 2) because `add-tech-item.py` never updated `nav-group-label`.
- **Change:** badge text is now `14% · 63/464` (red) beside `14% · 61/442` (blue) on the line under the title: `.rail-sub` became an inline flex item with a 6px gap instead of a full-width block, in `notes.html` and all 310 topic pages; `_progress.js`, `add-tech-item.py` and `english-notes.py` emit the new format so regenerations keep it. `add-tech-item.py` now rewrites its section's `nav-group-label` count; labels synced to Tech (236), Fundamentals (193), Mindset (2), English (33). `english-notes.py` titles use its LABEL ("… — English — Tech Notes").
- **Result:** verified on notes.html and english-33.html; no page still carries the old text or CSS. Branch `claude/notes-mindset`, uncommitted.

### Tech Notes #58 Kaiko — a reference rate is a price with a governance wrapper; English #34

- **Cause:** jay: "add a dev item related to Kaiko" (Kaiko appeared in the S&P–OpenZeppelin item as the data leg of S&P's onchain stack).
- **Reasoning:** three announcements in one arc: tokenized iBoxx U.S. Treasuries Index on Canton as a licence-plus-data NFT (2026-03-31), S&P Kaiko Digital Asset Indices (2026-09-01), Series B extended to $110 million with S&P leading (2026-09-14). The developer distinction is price feed versus reference rate: a number versus a number plus vetted venues, published cleaning and aggregation rules, an overseen methodology, and a licence, administered under EU BMR with AMF supervision. Jayverse: Verex resolution fields name a benchmark with administrator, fixing time and methodology version, or say explicitly which raw venue; the tokenized index (data, licence, permission in one token) is a pattern for distributing Number readings. Tagged `chat`, NEW, slot 58 (first not-done). English #34: a design review turning "the ETH price at 16:00" into a named source, fixing time and fallback.
- **Result:** Tech 57/237, English 0/34, overall 63/466. Kaiko's founding year and HQ from general knowledge; aggregation method not on the public pages; S&P stake size undisclosed.

### Site renamed Tech Notes → Knowledge Notes; rule: anything jay mentions is a candidate item

- **Cause:** jay: "Make it a rule to consider an item or note that I mention as items on Tech Notes. And change the name Tech Notes to Knowledge Notes or Wisdom Notes or Information Notes, of which you can choose."
- **Reasoning:** Knowledge Notes chosen: it covers all four sections (Tech, Fundamentals, Mindset, English) where Wisdom fits only Mindset and Information undersells the Fundamentals curriculum. File names (`notes.html`, `topics/`) unchanged so links hold. The rule: default to drafting an item when jay mentions or pastes something, say so in the reply, and keep "just asking" as the only exception (answer, and offer the item in one line).
- **Change:** "Tech Notes" → "Knowledge Notes" in `notes.html` (title, filter placeholder), both index pages (card title), both generators (page titles, crumbs, "All … Notes" links), both READMEs, and all 312 topic pages; README gains the mentions rule; memory `feedback-mentions-are-knowledge-items.md`.
- **Result:** no remaining "Tech Notes" outside history files. Branch `claude/notes-mindset`, uncommitted.

### Rule: one English conversation per day

- jay: "Make it a rule: for creating an English conversation, once in a day." Replaces the one-per-item rule of 2026-09-16. From tomorrow the first item of a KST day brings one conversation and later items none; today's #23–#34 stay as written. Recorded in `docs/topics/README.md`, `english/README.md`, and memory.

### Tech #59 S&P–OpenZeppelin marked RECENTLY DONE; yesterday's badge turned gray

- **Cause:** jay: "Make the 59 done and a gray color for the yesterday's status" (screenshot of the red and blue badges side by side).
- **Change:** re-ran `add-tech-item.py` for `sp-global-buys-openzeppelin` with `--status recent` (slot 59 kept, same as #56/#57). New CSS rule `.rail-sub .rail-note { color:#64748b; background:rgba(100,116,139,0.16) }` on `notes.html` and all 460 topic pages (inserted after `.rail-note-pink` where it exists, after the `.rail-note` block on the 145 curriculum pages, before `</style>` on the three hand-written pages); `_progress.js` untouched since it only sets text and title.
- **Result:** Tech 58/237, overall 64/466 in red; yesterday's `14% · 61/442` now gray on every page. Branch `claude/notes-mindset`, uncommitted.

### Knowledge Notes: entry and rail clicks go straight to detail pages

- **Cause:** jay: "we don't need notes.html anymore because it doesn't show any important information because we see the list in the left panel … clicking an item on the left panel and entering the notes goes to the detail page directly."
- **Reasoning:** `notes.html` cannot be deleted: `add-tech-item.py` and `english-notes.py` read its section articles as the item data. So it stays as data and list view, and every entry point bypasses it: index card → first NEW/IMPORTANT item (static link the inserter maintains), hash-less `notes.html` → same item via `location.replace` from its rail, rail links → `topics/<page>.html`. `?list` keeps the list reachable for the "All Knowledge Notes" links.
- **Change:** 466 rail links on `notes.html` rewritten; redirect script before `<main>`; `index.html` card now `topics/pocs-kaiko-reference-rate-is-a-price-with-governance.html` (#58, NEW); tier default now read from the `.on` button; Important/New/All buttons plus `isNew` filter added to the 312 detail pages that have a rail (default All); "All Knowledge Notes / 전체 기술 노트" footer and rail-foot links → `../notes.html?list` on all pages and in both generators; inserter regexes accept both link forms.
- **Result:** verified link counts and JS strings by grep; the 148 curriculum pages and 3 hand-written pages have no rail and were left alone. Branch `claude/notes-mindset`, uncommitted.

### Dark Horse (d): Canton Network test usage

- **Cause:** jay: "Add test usage of Canton network to our 'Dark horse' part of README."
- **Reasoning:** the Kaiko and S&P items put Canton under the institutional data products; a test, not a deployment, is the cheapest way to learn what a licensed-data PoC there costs. Kept as a candidate because the core is EVM and nothing in #1–9 needs Daml.
- **Change:** new section (d) in `docs/features/jayverse-darkhorse.md` (local Splice LocalNet → Global Synchronizer DevNet, two Daml templates, write-up against the Anvil devnet, test-networks-only guardrail); row 10 of `docs/features/README.md` and §10 of `docs/tasks/09-02-jayverse.md` list it. Source docs: those three; PoC links named in the section.
- **Result:** documentation only, no repo or code. Branch `claude/notes-mindset`, uncommitted.

### Key expressions on every Knowledge Notes detail page

- **Cause:** jay: "can you add the words or phrase meaning or key expression for all the detail page that I can learn, for example treasury desk in pocs-sp-global-buys-openzeppelin.html, and make it a rule."
- **Reasoning:** English pages already end with an expressions table, so the same shape (Expression | 뜻 · 쓰이는 자리) goes on Tech, Fundamentals and Mindset pages, in both articles. Source of truth is markdown per page so a regenerated page only needs a re-run. Backfilling 426 pages by hand was not realistic in one session, so the English text of each page was extracted to scratch and 22 sonnet subagents wrote the tables in balanced batches; the S&P page was written by hand as the model.
- **Change:** new `scripts/add-vocab.py` (idempotent `<!-- vocab:start/end -->` block before the footer, or before the curriculum stub, table wrapped for horizontal scroll); `add-tech-item.py --vocab` copies and renders the file for new items and re-applies an existing one on re-run; `docs/topics/vocab/<page>.md` × 426 plus a README; rule in `docs/topics/README.md` and memory.
- **Result:** 426 of 426 non-English pages carry the table (English pages skipped by design); format validated programmatically (header, two cells, no stray pipes, ≥4 rows). Row counts scale with page length: 8–12 for full items, 6–8 for curriculum pages, 4–6 for short stubs. Branch `claude/notes-mindset`.

### docs/html mirror regenerated (Dark Horse (d) was invisible in the HTML copy)

- **Cause:** jay: "where can I find the (d) you mentioned in docs/html/docs/features/jayverse-darkhorse.html?" The markdown had it; the generated HTML mirror was stale.
- **Change:** `npm run docs:html` on `claude/docs-html-regen`; 795 markdown files converted, the features, tasks, topics and history mirrors updated, English #32–34 and the vocab folder mirrored for the first time.
- **Result:** the (d) section is now in the HTML copy. Lesson recorded in memory: regenerate the mirror after any .md edit, in the same commit. Uncommitted until jay says push.

### Tech #58 Kaiko marked RECENTLY DONE

- **Cause:** jay: "make the 58 done."
- **Change:** re-ran `add-tech-item.py` for `kaiko-reference-rate-is-a-price-with-governance` with `--status recent` (slot 58 kept); the Key expressions block was re-applied automatically and the index card moved to the next NEW item, #60 dependency-is-authority.
- **Result:** Tech 59/237, overall 65/466. Branch `claude/docs-html-regen`, uncommitted.

### Section renamed Fundamentals → Foundations

- **Cause:** jay: "Change the name Fundamentals to the more proper name."
- **Reasoning:** the section's own lead calls it "the foundations underneath the rest of the catalogue" (math, algorithms, economics), and Foundations reads as a track name beside Tech, Mindset and English. Label only: `sec-fundamentals`, `nav-sec-fundamentals` and `--section fundamentals` stay so links and the script keep working.
- **Change:** `notes.html` (h1, jump pill, nav-group label), `_nav.js` labels, the CSS comment on 312 topic pages, `add-tech-item.py` label and help text, the topics/vocab/landing READMEs and memory notes. Item bodies that mention the old name in prose, and Pocock's talk title "Software Fundamentals Matter More Than Ever", were left as written.
- **Result:** rail and section read Foundations (193). Branch `claude/docs-html-regen`, uncommitted.

### Key expressions widened to acronyms and domain names (second pass)

- **Cause:** jay: "You should add the unusual words like BMR or MiFID II or ETP NAV to Key Expressions for all the detail pages, not only words and phrases … make it a rule … and change all the detail pages."
- **Reasoning:** the first pass had told the writers to skip proper nouns and acronyms, which is exactly what a Korean developer outside finance has to look up. Second pass appends rows instead of rewriting, with the full English form in parentheses after the Korean meaning.
- **Change:** regex pre-extraction of capitalised tokens per page as a hint list; 22 sonnet subagents read each page plus its existing table and wrote only new rows; merged with a dedupe on the expression and an `<!-- acronyms 2026-09-18 -->` marker so a re-run cannot double-append; `add-vocab.py --all` re-rendered. Rule widened in the topics README, the vocab README and memory.
- **Result:** 373 of 426 files gained rows, 1,271 rows added, 4,603 expressions in total; 53 pages had nothing new (pure math or already covered). Kaiko's table now opens with BMR, MiFID II, ETP NAV, AMF, S&P DJI, EOD, Canton Network.

### "Where it lands in Jayverse" on all 410 pages that lacked it

- **Cause:** jay: "Where it lands in Jayverse: all the detail pages should have this section."
- **Reasoning:** only the 16 newest pages had it; 264 older PoC pages and 146 curriculum pages did not. The section is what turns reading into a decision for a service, so it is backfilled bilingually rather than renamed from "Practical Connection" (the curriculum pages keep that paragraph and build on it).
- **Change:** `docs/topics/landing/<page>.md` (## en / ## ko bullets) for 410 pages, written by 22 sonnet subagents from a Jayverse brief (services, repos, the Kaiko section as the style example); new `scripts/add-landing.py` inserts an idempotent `<!-- landing:start/end -->` block before "Verified and unverified", else before Key expressions, as h3 on PoC pages and h2 on curriculum pages; `add-tech-item.py` now refuses an item whose markdown lacks the section; rule in the topics README, `landing/README.md` and memory.
- **Result:** 426 of 426 non-English pages carry the section, 2 to 4 bullets each, English and Korean in the same order, always before the Key expressions block; docs/html mirror regenerated (1,206 markdown files). Branch `claude/docs-html-regen`, uncommitted.

### Rule: check ~/Documents/Gemini twice a week; first check → 5 items

- **Cause:** jay: "One more rule: twice a week you check this folder (/Users/jay/Documents/Gemini) and if there's a new one you didn't notice, add the items to the related sections. Check it now."
- **Reasoning:** the folder holds Gemini's YouTube weekly briefings with Blockchain / Tech / Mindset / Culture sections. A check log (`docs/topics/gemini-checked.md`) makes "new" decidable across sessions and machines; a third source tag `gemini` keeps the provenance visible on cards and kickers. Culture has no section, so its entry is reported, not added.
- **Change:** rule in `docs/topics/README.md` and memory; `add-tech-item.py --source gemini`; first file `YouTube-2026-09-18-v2.md` → Tech #60 Lubin "clarity is permission" (Fox Business 2026-09-15, verified date and headline), #61 agentic engineering writes boundaries (IBM), #62 Mamba selective state (Gu and Dao, arXiv 2312.00752, figures verified), #63 a model is weights plus objective (IBM, anchor for the LLM stubs); Mindset #3 Harris on free will. Each with Key expressions (acronyms included) and a "Where it lands in Jayverse" section; older NEW items shift to #64–#70. No English conversation: today's already exists.
- **Result:** Tech 59/241, Mindset 0/3, overall 65/471; index card now opens #60 Lubin. Branch `claude/docs-html-regen`, uncommitted.

### Fallback rule: undecidable entries go to Mindset; Tokyo vlog → Mindset #4

- **Cause:** jay: "If you can't decide what it belongs to, you can use Mindset" (after asking where the Japan travel vlog went; it had been skipped as Culture).
- **Change:** rule in `docs/topics/README.md` (Gemini section and Mindset section) and memory; the vlog written as Mindset #4 "Eat the same dish twice — a Tokyo vlog as a method for paying attention", type Vlog, source gemini, framed as the compare-two-instances habit rather than a travel review; venue details marked unverified. Check log updated.
- **Result:** Mindset 0/4, overall 65/472. Branch `claude/notes-culture-fallback`, uncommitted.

### Section renamed Mindset → Life

- **Cause:** jay, on the Tokyo vlog: "Or you can make the name Mindset to Life."
- **Reasoning:** Life covers ways of thinking and working and also food, travel and living, so culture entries fit without a fallback rule. Label only: `sec-mindset`, `nav-sec-mindset` and `--section mindset` stay.
- **Change:** `notes.html` (h1 is section-less; jump pill, nav-group label, and the four item bodies that referred to the section by name), `_nav.js`, `add-tech-item.py`, the topics/vocab/landing READMEs, the Gemini check log, memory. The fallback sentence now reads "goes to Life".
- **Result:** Tech / Foundations / Life / English. Life 0/4. Branch `claude/notes-culture-fallback`, uncommitted.

### Life: encrypted Private tiles (Rule one … five)

- **Cause:** jay asked for hidden tiles in Life on a personal health topic, unlocked by a password, and asked whether hashing the password would keep others out.
- **Reasoning:** a hash only verifies the password; the text would still be in the HTML and on GitHub. So the content is encrypted: plaintext outside the repo (`~/Documents/Private/life-private-rules.md`), AES-256-GCM under a PBKDF2-SHA256 key (600k iterations, random salt), only ciphertext in `docs/topics/_private.js`; the browser derives the key with WebCrypto. Limit stated to jay: a short dictionary-like password is brute-forceable offline; a longer passphrase is one re-run away.
- **Change:** `scripts/private-encrypt.mjs`; Private section, CSS and unlock script in `notes.html` (tiles show labels only until unlocked; sessionStorage keeps the tab unlocked; Lock button); five tiles written as general health information with a "see a urologist" frame; rule in the topics README and memory. The password is recorded nowhere.
- **Result:** `_private.js` contains no plaintext (checked by grep for a word from the text). Branch `claude/notes-culture-fallback`, uncommitted.
- **Test tile (later the same day):** jay asked for one item to test the flow and confirmed Life as the home for these tiles. A sixth tile `Test` was appended to the plaintext file and the bundle re-encrypted under the throwaway password `placeholder-change-me`; round trip decrypts 6 tiles, a wrong password fails, grep finds no plaintext. jay unlocks at `notes.html#sec-mindset` with the throwaway password, then re-encrypts under his own and deletes the Test tile.

### Life: Private block renamed to Health, tiles labelled Health #1–#6

- **Cause:** jay wants the locked tiles reachable from the Life section under deliberately ambiguous titles ("health #1, #2") and opened only with the password.
- **Reasoning:** the tile label is the one public field in `_private.js`; everything else (title, text) is ciphertext. So the label becomes `Health #N` and the block heading `Health`; the descriptive title appears only after unlock.
- **Change:** plaintext headings renamed (`## Health #1 — …`), bundle re-encrypted (still the throwaway password); `notes.html` block heading/meta neutralised, a `🔒 Health (locked)` entry appended to the Life rail group (no `topic-no`, so `add-tech-item.py` renumbering ignores it and new items land before it), `🔒 Health` link in the rail foot of `notes.html` and of the 318 detail pages that have one (the template head carries it to new pages); README rule and memory updated.
- **Result:** round trip decrypts 6 tiles; the repo file shows only `Health #1…#6` as labels.

### Life: locked tiles become list items 1000, 999 … titled Rule 1, Rule 2 …

- **Cause:** jay wants the private notes to sit in the Life list like ordinary items, "from number 1000 in Life and decreasing", titled only Rule 1, Rule 2 …, and to open only with the password. He also said the data is embarrassing rather than critical, so the short password stays and no further warnings are needed.
- **Reasoning:** a separate Health block looked different from the rest of the list; an item card with a Locked tag and an Open button reads as one more note. Numbering from 1000 downward keeps them apart from the real 1…N sequence, and `add-tech-item.py` never renumbers keys it does not know, so they are stable. Found while rebuilding: the earlier unlock script had never been inserted into `notes.html` (the check matched the file name inside a CSS comment), so the Health block would have stayed hidden; fixed here.
- **Change:** `scripts/private-cards.py` renders one card + one rail link per tile label from `_private.js` between markers in `notes.html`; `private-encrypt.mjs` runs it after encrypting. The Health block, its rail entry and CSS/JS were replaced: the password field appears inside the clicked card, decrypted text renders in the card, `Close` / `Lock all` buttons, `#private-N` deep links open that card. Plaintext headings renamed `## Rule N — …`; rail-foot links on the list page and 318 detail pages now read `🔒 Rules` → `notes.html#private-1`. README rule and memory rewritten.
- **Result:** six cards 1000…995; round trip decrypts all six; no readable text or password in the repo.

### Life: a detail page per locked Rule (topics/private-N.html)

- **Cause:** jay: "make it to detail" — the Rules should behave like every other item, with a Detail page, not only an in-card expansion.
- **Reasoning:** the page is built from the Life detail template so it inherits the rail, tier buttons and footer. The Rules are not in `_nav.js` (the item scripts would count them), so the page appends them to the Life group in memory before the rail script runs; the active highlight then works. Private pages skip the Key-expressions and landing sections because their text is not in the repo.
- **Change:** `scripts/private-cards.py` now also writes `private-1.html` … (kicker `#1000 · Locked · Life`, password field on the page, decrypted title + EN/KO text, Lock all, pager between Rules, stale pages removed); cards gain `Detail →` and the rail links, cards and every rail-foot `🔒 Rules` link point at the pages.
- **Result:** 6 pages generated, all inline scripts parse, generator idempotent (two runs, identical output).

### Tech #60 Clarity Act (Lubin) marked RECENTLY DONE

- **Cause:** jay: "make the 60 done."
- **Change:** re-ran `add-tech-item.py` for `clarity-is-permission-lubin-floodgates` with `--status recent` (slot 60 kept, kicker `#60 · PoC · 2026-09-18 · gemini`); Key expressions and the landing section were re-applied; the index card moved to the next NEW item, #61 agentic engineering.
- **Result:** Tech 60/241, overall 66/472 (14 percent).

### Locked Life items: every "private" name becomes "health"

- **Cause:** jay: "don't use private, use health instead" and "change the file and title name because the word private makes people want to know."
- **Reasoning:** the whole point of the feature is to not draw the eye; a URL or title containing *private* does the opposite. *Health* is bland enough to pass. The plaintext folder `~/Documents/Private/` keeps its name (jay's own folder, outside the repo).
- **Change:** items titled `Health 1` … `Health 6` (plaintext headings renamed, bundle re-encrypted); `docs/topics/_private.js` → `_health.js`, pages `private-N.html` → `health-N.html`, ids/classes/markers `private-*` → `health-*`, sessionStorage key, `window.__PRIVATE__` → `__HEALTH__`; scripts renamed `health-encrypt.mjs` / `health-cards.py` with `HEALTH_PASS`; rail-foot link now `♥ Health`; plaintext file → `life-health-rules.md`; README section, memory (`project-life-health-items`) and index rewritten. The unrelated Tech item `private-rpc-visibility` is untouched.
- **Result:** no `private` left in the feature's files, URLs or titles; six pages regenerated; round trip verified.

### LATELY DONE: today's done items in midnight blue until the next day's first done

- **Cause:** jay: "make the done items midnight blue that are done from the 6 a.m. today before the new day's first time is done", "which is a rule", "the name of state of the new done is 'lately done'".
- **Reasoning:** the old RECENTLY DONE (sky blue) was set by hand and never expired — 16 Tech items carried it, some weeks old. The new state needs a time: each done item gets a `done` stamp in `_nav.js`, days are bucketed at 06:00 KST, and only the newest bucket is LATELY DONE. Rolling happens when the next item is marked done, which is exactly jay's "before the new day's first one is done".
- **Change:** `scripts/roll-lately-done.py` (bucket, relabel, sync every rail dot with `_nav.js`, collapse duplicate rail entries, refresh counts); `add-tech-item.py` — `recent`/`lately` → `#191970 LATELY DONE`, `--done-at`, `done` stamp, runs the roll script, and drops an existing rail entry by `data-key` (the old href match missed the `pocs-` prefix, which had left duplicate rail entries for #58 and #60); `english-notes.py` colour; the label string replaced in `notes.html`, `rtd-shell.mjs` and 324 pages. Migration: #56/#57 stamped 10:44 and #58/#59 12:51 (the commits that carried them; jay: "56, 57 is lately done also"), #60 14:20; 11 older items → DONE.
- **Result:** Tech 60/241 unchanged; 5 LATELY DONE (56–60), 0 RECENTLY DONE, 0 duplicate rail keys. Re-running the script for #60 exercised the whole path.

### Health items numbered 1, 2, 3 … instead of 1000 downward

- **Cause:** jay: "I want the health number start from 1 not 1000."
- **Change:** `scripts/health-cards.py` numbers cards, rail links, kickers and pagers `1…N`; pages regenerated; README and memory updated. `add-tech-item.py` still ignores these keys, so Life items and Health items keep separate sequences.

### DONE THE OTHER DAY: a third stage between LATELY DONE and DONE

- **Cause:** jay: "could you add the other day done status of which name tells everything" (first typed "yesterday", then changed it to "the other day").
- **Reasoning:** the name follows the semantics: the state marks the *previous day on which something was done*, which is not always yesterday (nothing was done on 09-17, so today's "other day" is 09-16). Sky blue reuses the colour the old RECENTLY DONE had, so the eye already reads it as "done, but not today". The roll is now one step per new day: LATELY → OTHER DAY → DONE.
- **Change:** `scripts/roll-lately-done.py` buckets into newest / previous / older; `add-tech-item.py` counts the new label as done; the Important filter includes it (`notes.html`, `rtd-shell.mjs`, 324 pages); README and memory updated. The 11 older done items got their real `done` stamps from the commits that first marked them (09-12 ×8, 09-14 ×1, 09-16 ×2) so the roll works from data.
- **Result:** #54 and #55 are DONE THE OTHER DAY, #56–#60 LATELY DONE, 44–53 DONE; Tech 60/241 unchanged. Branch `claude/other-day-done`, uncommitted pending jay's review.

### States renamed Today done / Yesterday done; Today and Yesterday rail buttons

- **Cause:** jay: "buttons for yesterday which is for the other day and today which is for lately done besides Important, New and All. 아예 change the lately done to today done, and the other day done to yesterday done."
- **Reasoning:** plain words for the button faces; the semantics stay the roll's (Yesterday = the previous done-day, noted in the README). The rail now has five buttons, so `.rail-tier` wraps.
- **Change:** labels `TODAY DONE` (#191970) / `YESTERDAY DONE` (#38bdf8) in `_nav.js`, `notes.html`, 324 pages, the scripts and docs; `scripts/roll-lately-done.py` → `roll-done-states.py`; `--status today` alias; buttons Yesterday / Today after All (jay: "change the button places between All and Today" → Important · New · All · Yesterday · Today) with `isToday` / `isYesterday` filters on the list page, every detail page and `rtd-shell.mjs` (the template also gains the New button and the same `tierMode` logic the pages already had); memory note renamed `feedback-today-yesterday-done-states`.
- **Result:** Today shows #56–#60, Yesterday shows #54–#55; counts unchanged.

### Rail: Done button

- **Cause:** jay: "Add done button also."
- **Reasoning:** Done shows every finished item — plain DONE plus YESTERDAY DONE and TODAY DONE — because the two day buttons are already the subsets; placed right after All so the row reads whole → finished → yesterday → today.
- **Change:** button `data-tier-mode="done"` + `isDone` filter on `notes.html`, 324 detail pages and `rtd-shell.mjs`; README and memory updated.
- **Result:** Important · New · All · Done · Yesterday · Today; Done currently lists 60 Tech and 6 Foundations items.

### Rail: Done button means "done before yesterday"

- **Cause:** jay: "Done before Yesterday" — the Done button should not repeat today's and yesterday's items.
- **Change:** `isDone` matches the plain `DONE` title only, on `notes.html`, 324 pages and `rtd-shell.mjs`; tooltip and README updated. Done · Yesterday · Today now partition the finished items.
- **Result:** Done lists 55 Tech (#1–#53 done ones) and 6 Foundations items; Yesterday #54–#55; Today #56–#60.

### Rail: buttons in two fixed rows

- **Cause:** jay: "Done, Yesterday, Today are on the same line."
- **Change:** a `<span class="tier-break">` (flex-basis 100%) after All in `notes.html`, 324 pages and `rtd-shell.mjs`, so the row breaks there regardless of rail width: Important · New · All on the first line, Done · Yesterday · Today on the second.

### Tech #61 agentic engineering marked TODAY DONE; Dark Horse (e) boundary files

- **Cause:** jay: "Make the 61 done and add related tasks to dark horse."
- **Change:** re-ran `add-tech-item.py` for `agentic-engineering-writes-boundaries` with `--status recent` (TODAY DONE, stamped now; index card → #62 Mamba). New Dark Horse candidate **(e) Agentic engineering — boundary files before agent tasks** in [`docs/features/jayverse-darkhorse.md`](../features/jayverse-darkhorse.md), built from the item's "Where it lands in Jayverse": boundary-file template piloted on one web-app module, Rabbit's 7715 mandate + enforcer tests as the boundary of agent features, a CI evaluation job for agent-produced changes, *boundary* into Dev English #32; mirrored as a §10 bullet in `docs/tasks/09-02-jayverse.md` and in the hub row 10 of `docs/features/README.md`.
- **Result:** Tech 61/241, overall 67/472; Today shows #56–#61. Branch `claude/61-darkhorse` (carries the uncommitted Done-button work from `claude/done-button-scope`), uncommitted.

### Rail foot simplified: All Notes · ♥ Health · Index

- **Cause:** jay (screenshot of the rail foot): "make them simple: All Notes, Index."
- **Change:** rail-foot links on the 324 detail pages read `All Notes · ♥ Health · Index` (new pages copy an existing page's head, so they inherit it; `rtd-shell.mjs` takes the foot as a parameter and is used only by the logs generator, so it is untouched) (was `← All Knowledge Notes · ♥ Health · Workspace Index`); `notes.html` foot reads `♥ Health · Index · Live PoCs` (it still said `🔒 Rules`, missed by the health rename). Body-end links and crumbs unchanged.

### English pages: English article first, Korean article apart

- **Cause:** jay: "For all the english [pages] separate english and korean parts as others so that I don't read the translation first."
- **Reasoning:** the pages interleaved each English line with its Korean, so the eye caught the translation before finishing the English. The PoC pages already solve this with `#en` / `#ko` articles and a language switch; the English pages now use the same shape.
- **Change:** `scripts/english-notes.py` — `#en` (why, dialogue, key expressions) and `#ko` (제목, 상황, 왜, 대화, 협업 기법 세 가지) articles, lang-switch pills in the hero and per article, KO situation moved out of the hero; rail links in the rebuilt English group now `topics/english-N.html` (the script still wrote `#english-N`, which the 2026-09-18 rail change had overridden by hand). All 34 pages rebuilt; source format unchanged.
- **Result:** rail 34 page links, 0 hash links, 0 duplicate keys, Health cards and counts intact; README rule added.

### English #1 "The function is fine. Who can call it?" marked TODAY DONE

- **Cause:** jay: "make done The function is fine. Who can call it? of english" (after asking what *modifier* meant in that dialogue).
- **Change:** `docs/topics/english/english-1.md` gets `status: recent` and `done: 2026-09-18T15:08+09:00` (it had no status line; the default was planned). `scripts/english-notes.py` now carries `done` into the `_nav.js` item and runs `roll-done-states.py`, so English items join the Today / Yesterday roll like the other sections.
- **Result:** English 1/34, overall 68/472; Today shows #56–#61 and English #1.

### Detail-page rail: Done / Yesterday / Today search every section

- **Cause:** jay (screenshot of the three buttons): "For this part, it shows the matched ones for all the categories." A detail page's rail held only its own section, so Done on a Tech page could never show a Foundations or English item.
- **Change:** the rail script on the 324 detail pages now renders every section — the current one first, the others tagged `data-other-section` — and the filter shows those other groups only in Done, Yesterday and Today modes; Important, New and All behave as before. `notes.html` already lists every section, so it needed nothing.
- **Result:** on any page, Today lists Tech #56–#61 and English #1; Yesterday #54–#55; Done every green item across sections.

### Rail: Important shows important only

- **Cause:** jay: "make the important button only shows important. there is none have the status new and done at the same time. If some item newly added as important it will have a lower number than others."
- **Reasoning:** the 2026-09-08/09 rule folded new and recently done items into Important because there was no other button for them; now New, Done, Yesterday and Today each have one, so every button maps to exactly one state.
- **Change:** `isImportant` matches the `IMPORTANT` title only, on `notes.html`, 324 pages and `rtd-shell.mjs`; the code comment and the README rule updated. The list page still opens on Important, so it now shows the 21 Tech + 49 Foundations red items and nothing else until another button is pressed.

### Rail: a mode button scrolls the rail to the current or first New item

- **Cause:** jay: "clicking the all button goes to the items that are not new ones" — the rail kept its pixel scroll position from the Important list, so after All the view landed on an arbitrary stretch of old Tech items.
- **Change:** after a tier button click, the rail scrolls (existing `revealInRail`, mode `top`) to the active item on a detail page, else to the first visible NEW item, else to the first visible item; `notes.html`, 324 pages, `rtd-shell.mjs`.

### Numbers follow status (done < important < new < planned); Important capped at 10 per section

- **Cause:** jay: "make the important ones have lower number than new ones but higher than done", then "make the amount of important items 10 for each category."
- **Reasoning:** the rail is read top-down, so the number order should be the reading order: finished first, then the ten that matter, then what is new, then the backlog. A stable sort keeps each rank's existing order, and the cap keeps Important a short list rather than a second backlog (Foundations had 49 red items).
- **Change:** `scripts/reorder-by-status.py` (sorts `_nav.js` items by rank, rebuilds rail and card order and numbers in `notes.html`, rewrites kickers and pagers on the pages; idempotent). Cap: in `_nav.js` the first 10 Important per section stay, the rest → PLANNED (11 Tech, 39 Foundations), then the roll script synced the dots and the reorder moved them into the planned block. Curriculum pages have no number or pager, so nothing on them was stale. README rule added.
- **Result:** Tech order D×61 · I×10 · N×24 · P×146, Foundations D×6 · I×10 · N×5 · P×172; counts unchanged (overall 68/472); rail, card and kicker numbers verified equal for every item.

### Section bases (1 / 700 / 1000 / 1300 / 1400), goals 1,000 and 2,000, clickable red badge

- **Cause:** jay: "make the Items from 1, Foundations from 700, English 1000, Life 1300, Health 1400. Our goal is 1000 items … the first congratulation day … our last goal is to reach 2000"; then, on the red badge: "make it clickable and make the clicking shows all the categories for the buttons from Important and Today … I mean All to the status red area … anyway push it."
- **Reasoning:** one number now names the section, and every generator reads the same table instead of each carrying its own arithmetic. The goals are about *done* counts (68 today), so the celebration is driven from the same `jump` totals the badge already sums; it fires once per browser so it is a day, not a permanent banner. The badge toggle reuses the `data-other-section` groups added earlier today — a body class the filter consults, so no rail re-render.
- **Change:** `scripts/notes_numbering.py` (BASE, GOALS, display/position); `add-tech-item.py`, `reorder-by-status.py` (now numbers Life too, in place), `english-notes.py`, `health-cards.py` use it; all sections renumbered (Foundations 700–892, English 1000–1033, Life 1300–1303, Health 1400–1405) and verified rail = card = kicker = nav for every item. `_progress.js`: badge is a button toggling `body.rail-all` + `All ·` prefix (sessionStorage, `rail-all-change` event), grey goal chip `→ 1,000 · 6.8%`, confetti milestone card at 1,000 / 2,000 (localStorage). Pages and `notes.html`: filter treats `body.rail-all` like the day buttons and re-applies on the event. README section + memory note.
- **Result:** overall 68/472 unchanged; all inline scripts parse; goal chip shows 6.8 percent toward 1,000.

### Goal chip removed from the badge row

- **Cause:** jay (screenshot of `→ 1,000 · 6.8%`): "the numbers are shown in order and we don't need this part."
- **Change:** `_progress.js` no longer renders the grey goal chip; the milestone celebration at 1,000 / 2,000 and the clickable red badge stay. README and memory adjusted.

### Rail: section pills select the category; mode buttons filter inside it

- **Cause:** jay (screenshot of Important · New · All): "these buttons are operational for each category and the section runs as category selection."
- **Reasoning:** three controls now have one job each — pills choose the section, mode buttons choose the state, the red badge's All widens to every section. The earlier special case (Done / Yesterday / Today always crossing sections) is folded into the badge toggle so the model stays one rule.
- **Change:** pills carry `data-sec`; the filter keeps `railSection` (default: the current item's section on a detail page, everything on the list page), a pill click selects that section (clicking the lit pill returns to the default), the lit pill gets `.rail-jump a.on`, and the rail scrolls to the group; on detail pages the pill no longer leaves the page (the list page keeps its in-page jump). `notes.html`, 324 pages, `rtd-shell.mjs`.

### Red badge: one fixed shape

- **Cause:** jay (screenshot `All · 14% · 68/472`): "this should have one fixed shape like this. don't change it when being clicked."
- **Change:** `_progress.js` always renders `All · <pct>% · <done>/<all>`; the click still toggles the all-sections rail, shown only by the tooltip and `aria-pressed`. README and memory adjusted.

### Red badge = the "All categories" pill

- **Cause:** jay (screenshot of the badge): "Make this button clickable and have meaning of all category." It was clickable, but nothing showed the state and the section pills ignored clicks while it was on.
- **Change:** the badge lights up with an inset red ring when All is on (text unchanged), the section pills go dark, and clicking a section pill turns All off and selects that section; `_progress.js` resyncs from `body.rail-all` on the `rail-all-change` event so both scripts agree. `notes.html`, 324 pages, `rtd-shell.mjs`.

### Invest section (800…), Foundations → Theory (500…), ten TradingView basics

- **Cause:** jay: "add 10 basic and important items for how to analyze the chart with TradingView to a new Investment section and move some related items from Foundations. Investment should start from 800, and Foundation start 500" — then "All Economics items should go to Investment", "The Investment should have to flag Economics … and investment", "Make the Foundations shorter with proper name", "You can use invest instead of investment".
- **Reasoning:** Foundations had grown two unrelated halves; the economics readings and anything about investing, market history or charts now have their own section with two tag chips (Economics | Invest), and what remains — math and algorithms — is *Theory*, a shorter name that covers both. Ten Important TradingView items give the section a spine on day one and exactly fill the 10-per-section Important cap.
- **Change:** `notes_numbering.py` bases Theory 500 / Invest 800; `add-tech-item.py --section invest` (tag chip, label Theory); `reorder-by-status.py` and `roll-done-states.py` know the section; `notes.html` gets the Invest pill, rail group and article (lead names the two tags), the five Economics items (Acemoglu automation, Investing for Programmers, ETF window, PPI print, max pain) moved out of Theory with their cards and rail entries; `_nav.js` section + jump entry; the label Theory replaced on 324 pages, landing sources, README, scripts and memory. Ten drafts written by parallel subagents from `scratchpad/tv/INSTRUCTIONS.md` (nine pushed first, support and resistance in a second push once its draft landed) (structure validated by `validate.py`: ~1,000 EN words, 17–18 vocab rows each), added with `--section invest --tag Invest --status important --type Basics`.
- **Result:** sections Tech 1… / Theory 500… / Invest 800… / Life 1300… / Eng 1000… (English pill shortened to Eng, jay: "English to Eng"); every item's rail, card, kicker and nav numbers verified equal; README section and memory note `project-invest-section`.

### Eng before Life; risk page refreshed

- **Cause:** jay: "Eng Before Life." Also the last TradingView draft (risk on the chart) reported its final version after the earlier add.
- **Change:** pill, rail group and article moved in `notes.html`; `_nav.js` jump and sections reordered; generators taught that Life is last (`add-tech-item.py`, `reorder-by-status.py`, `health-cards.py` use the `no-results` / `<p class="src">` sentinels; `english-notes.py` inserts before Life instead of appending, and its pill goes before the Life pill). Uneven `<article>` indentation from the Invest insertion normalised. `pocs-tv-risk-on-the-chart.html` re-added with the final draft.
- **Result:** order Tech · Theory · Invest · Eng · Life on the list page, in the nav data and therefore on every detail-page rail; all generators re-run idempotently.
