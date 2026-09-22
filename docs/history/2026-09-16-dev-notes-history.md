# 2026-09-16 — Dev Notes

Source: jay's request in conversation (screenshot of binji's post "Imagine 'Ethereum, but faster'
… Let's get EIP-8198 into Hegotá": "Add tech item"); no separate task file. Notes live in
`docs/notes.html`, `docs/topics/_nav.js`, and `docs/topics/pocs-<key>.html` (hand-maintained HTML).

### Dev Notes #54: "Quick Slots (EIP-8198) — the change is not 12 → 10 s, it is making slot time a parameter", NEW

- **Cause:** jay pasted the X post about EIP-8198 and asked for it as a tech item.
- **Reasoning:** researched the EIP text, consensus-specs PR #5592, the EF Protocol Hegotá tier post
  (2026-09-07), Ethlabs' Hegotá view, and a review article. The insight worth keeping is that the
  EIP is mostly *not* about speed: it replaces the compile-time slot constant with a per-epoch
  schedule, and the visible work is retuning every slot- or epoch-denominated constant (issuance,
  inactivity leak, blob retention, churn / weak subjectivity, gas per slot) so its wall-clock meaning
  is unchanged. The disagreement is readiness, not direction: EF tier B with four prerequisites and
  a D from client engineering teams for the retuning cascade; Ethlabs S-tier, 10 s in Hegotá,
  "12 s for two more years or 10 s in about a year". For Jayverse the item is a checklist, not a
  feature: the devnet's 1 s Anvil blocks already break any code that converts blocks to time, so
  market close, oracle staleness, keeper timing, and bridge finality must be in seconds or
  `finalized`. Numbering rule kept: done items first, the newest report takes the first not-done
  slot, so this is #54 and the previous 54–225 shift by one (226 total).
- **Change:** `notes.html` — nav entry + card (bilingual copy JSON) at #54, Blockchain section
  renumbered, counters 59/418 overall and 53/226 for the section (the section's own meta counter had
  been left at 222 by earlier inserts; set to 226); `topics/_nav.js` — entry, renumbering, label and
  jump counts; new `topics/pocs-quick-slots-eip-8198.html` from the Alchemy page template with EN
  and KO sections and copy buttons; kicker and prev/next pager rebuilt on all 226 Blockchain pages.
  Also fixed pre-existing drift: from card position 59 on, the card numbers in `notes.html` lagged
  the nav by three (three items had been inserted into the nav without renumbering the cards);
  every card now carries its nav number by key.
- **Result:** working tree on `claude/notes-eip-8198`, branched from the tip of
  `Codex/aa-standards-wallet-matrix` (two commits ahead of `origin/main`, both other-session items),
  uncommitted. Stated as unverified in the item: whether 8198 is scheduled for Hegotá (no decision
  yet), Hegotá's date, and whether 8 s or 10 s lands first.

### Tech Notes #54 correction: the schedule is bookkeeping, not a lever

- **Cause:** jay disagreed with the item's line that the schedule "turns the next cut into a parameter change instead of another fork's worth of refactoring", and with my gloss of it as a mechanism for future cuts.
- **Reasoning:** read PR #5592's own description and `specs/_features/eip8198/beacon-chain.md`. `SLOT_TIMING_SCHEDULE` is an ordered list of eras starting at genesis, each with `EPOCH`, `SLOT_DURATION_MS`, and every intra-slot deadline; "every subsequent entry MUST coincide with a network upgrade", and the PR body says it "is simply a way to loop over historical slot durations" for functions that accumulate time across eras (timestamp ↔ slot), explicitly *not* BPO-style changes between upgrades. The "configuration updates rather than contentious protocol upgrades" line is the EIP's motivation text, which the spec authors walked back. Also corrected: the PR does not scale intra-slot deadlines with the duration (the EIP had them as basis points that do); the values are deferred until testing.
- **Change:** summary paragraph, `SLOT_DURATION_MS` table row, cascade item 4, and the Verified paragraph rewritten in EN and KO; card summary and copy JSON in `notes.html`, and the detail page's lead, body, and copy JSON regenerated from the corrected source text.
- **Result:** working tree, uncommitted, on `main` checkout (the item's branch `claude/notes-eip-8198` is already merged).

### Tech Notes #54 marked done

- jay: "make the 54 done". Dot → RECENTLY DONE (#38bdf8) in `notes.html` and `_nav.js`; counters 54/226 for the section, 60/418 overall.

### Tech Notes #55 (Alchemy app key) marked done

- jay: "make the 55 also done". Dot IMPORTANT → RECENTLY DONE in `notes.html` and `_nav.js`; counters 55/226, 61/418.

### Tech Notes: third section "Dev English" — 20 developer conversations, generator, rail pill

- **Cause:** jay: "one more section for the tech notes which is developer English conversations; it can grow to 100; add one more item whenever I ask you to add tech items; today 20 conversations; refer to the English section of the morning reports for the kind of conversation." Then: apply it to the rail head too; from #21 on the conversations should help getting a job abroad as a developer and team lead.
- **Reasoning:** the morning reports' format is the target — situation, why chosen, dialogue with line-by-line Korean, three collaboration techniques, a key-expressions table — in the genres code review, design, incident, EIP, BD, plus ops, planning and one-on-one. Content is drawn from this week's own discussions (pause authority, fail-open/closed, bridge reconciliation, Quick Slots finality, chain id 313370, Cloud Run scale-to-zero, 7702 vs 4337, JYVE pricing, key rotation, estimation, Dockerfile copies, USDCX naming, Registry after reset, 7715 popup, KB rail hours, junior PR feedback, Tailscale exposure, one-fact-one-home). Unlike the Blockchain section the numbering is chronological and append-only, so a checked-in generator is the right tool: one markdown per conversation, one script, no hand edits to notes.html.
- **Change:** `docs/topics/english/english-1..20.md` (sources) + `README.md` (rules, format); `scripts/english-notes.py` (idempotent: section article + nav group + rail pill in `notes.html`, jump/section entries in `_nav.js`, 20 detail pages with kicker and pager, and the static overall badge on every topic page); section counted in the rail: overall 61/438, pill "Dev English 0/20".
- **Result:** working tree on `claude/dev-english`; jay: "you can commit and push". Rule recorded in the README and in memory.

### Tech Notes rules written down: daily source file, added date

- jay (2026-09-16): new Blockchain items come from `alice-tech-YYYY-MM-DD.md` in the iCloud morning-blockchain-report folder — read today's and yesterday's file once a day at the first request, take the next unused candidate; and from #54 on each item shows its added date on the card head and in the detail kicker. Both rules, plus the conventions that had lived only in session memory (numbering, dot colors, counters, progress log), are now in `docs/topics/README.md`. #54 dated 2026-09-16.

### Tech Notes #56 Canton / Shinhan CIP-0121 and #57 Clarity Act cloture; Dev English #21–22; add-tech-item.py

- **Cause:** jay pasted Canton Foundation's post welcoming Shinhan Asset Management as a Super Validator (CIP-0121, max earnable weight 10) — "add this tech item. I will check you read the alice tech file and add related items." First run of the new rule: read `alice-tech-2026-09-16.md` (no 09-15 file exists), took its first candidate.
- **Reasoning:** #56 — the weight is *earnable*: released per milestone (regulated market access, tokenized assets, KRW cash leg, fund administration), attested by the Accountability Committee, granted by two-thirds of SV operators, with an own-node obligation above weight 2.5; Canton buys an option on Korea's not-yet-written tokenized-securities law with governance weight. Jayverse: earned-weight governance for Auditor/keeper/resolver roles; the KRW cash leg is the KB Kinexys availability question again. #57 — cloture failed about eleven short; seven negotiating Democrats voted no over ethics provisions; the probability (26%) was right but the roll call is the information — Verex resolution records for legislation should store who voted, not only the outcome. Both NEW, dated 2026-09-16, at the first not-done slots (#56, #57); Alchemy/Quick Slots stay #54/#55 as done. Dev English #21 (system-design interview opening) and #22 (offer negotiation) start the job-abroad series.
- **Change:** new `scripts/add-tech-item.py` (insert/update one Blockchain item from EN+KO markdown: nav.js via JSON round-trip, notes.html nav+card with the added date, detail page, renumbering, kicker/pager rebuild, all counters); `notes.html`, `_nav.js`, two new `pocs-*.html`; `english-21.md`, `english-22.md` + generated pages; counters 55/228 Blockchain, 0/22 English, 61/442 overall.
- **alice-tech usage:** 2026-09-16 `[오늘 · X(트위터)] Clarity 부결` → #57. Remaining candidates in that file: LinkedIn (BTC floor), a16z (FOMC), Four Pillars (보유 = 발행), 딥다이브 (권한 목록 표 마감), Tenderly Alerts.
- **Result:** committed and pushed at jay's request ("you can merge and push this alice repo").
