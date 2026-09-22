# 2026-09-15 — Dev Notes

Source: jay's request in conversation (pasted the Alchemy "Create app → Activate services" page:
"add tech item as important"); no separate task file. Notes live in `docs/notes.html`,
`docs/topics/_nav.js`, and `docs/topics/pocs-<key>.html` (hand-maintained HTML, no generator in alice).

### Dev Notes #54: "An app key is a budget, not a login" (Alchemy create-app flow), IMPORTANT

- **Cause:** jay pasted Alchemy's three-step Create app page (create → choose chains → activate
  services, with the compute-unit figure at the bottom) and asked for it as a tech item marked
  important.
- **Reasoning:** the insight is that the flow is a budget decision, not account setup — every
  activated service meters against one quota keyed to one app key, so an app is the unit of quota,
  rate limit, and revocation, and you create one per environment-and-role. For Jayverse that means
  a dedicated app for the devnet's upstream Sepolia fork (Node API only; fork lazy-loading makes the
  first seed the expensive moment) and a separate one for the Sepolia AA path (Bundler + Gas
  Manager + userOp simulation). Numbering rule kept: done items first, the newest report takes the
  first not-done slot — #53 became done yesterday, so this is #54 and the old 54–221 shift by one.
- **Change:** `notes.html` — nav entry + card (bilingual copy JSON) inserted at #54, Blockchain
  section renumbered, counters 59/414 overall and 53/222 for the section; `topics/_nav.js` — entry
  inserted, section renumbered, label and jump counts (all 222, done 53); new
  `topics/pocs-alchemy-app-is-a-budget.html` built from the existing page template with full
  English and Korean sections, language nav, and copy buttons; **every Blockchain detail page's
  `#N` kicker and prev/next pager rebuilt from the final sidebar order** (175 pages touched — they
  had drifted before this change; e.g. Fast Ethereum showed #54 while the list said #55).
- **Result:** working tree on `claude/notes-alchemy-app`, uncommitted. Unverified in the item and
  said so: exact compute-unit costs per method and throughput per tier — the item links Alchemy's
  reference pages rather than quoting numbers.

### Dev Notes #54: add "What Alchemy provides" — the 13-API catalogue mapped to Jayverse

- **Cause:** jay, after #54 shipped: "I want to know what they provide, which is various APIs."
- **Reasoning:** the first version argued the budget point but never listed the services the page
  offers. A table with Alchemy's own description shortened and an honest Jayverse column —
  including "not needed" and "not for JYVE" — turns the item into the reference jay will open when
  activating services. The closing paragraph reads the table by environment: on the devnet only
  Node API matters (fork upstream); on Sepolia the 4337 trio (Bundler, Gas Manager, userOp
  Simulation) is real infrastructure with no local substitute, the data APIs replace indexers,
  Webhooks/Websockets are push instead of poll.
- **Change:** new `### What Alchemy provides` section (EN + KO) inserted after "What the three
  steps decide" in the card's copy text and in the detail page; card's "How it works" line lists
  it. Detail page bodies regenerated from the copy markdown so page and copy cannot diverge.
- **Result:** uncommitted on `claude/notes-alchemy-app`.
