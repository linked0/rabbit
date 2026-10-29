# 2026-10-29 — rabbit history

Source doc: alice item `pocs-agent-payments-korea-control-plane`, §1 "How it gets robbed: three side doors", point 2 "The fake letter" (Patlan et al. 2025), quoted by jay in chat. No task in `docs/tasks/current-plan.md` covers it.

## Added

- Demo card `memory-poison` at `/live/memory-poison`: an interactive SVG that walks the memory-poisoning attack with @kindofblue91 as the owner (attacker, shared memory, agent, treasury, 5 validators, and the buttons ① Poison → ⑤ Steal), plus a defense toggle

- Demo section: a card-list rail on the left of every `/live` page (jay's sketch), a chip strip on phones

## Done

- (nothing marked done)

### Demo: "The fake letter", poisoned agent memory redirects a transfer

**Cause:** jay quoted the alice passage on Patlan et al. (2025) and asked to reproduce that kind of failure as a new card on the Demo page, using his X account @kindofblue91. Mid-task he added that he wanted a drawing showing the attacker, 5 validators, the system and the money, with action buttons like "steal".
**Reasoning:** I first tried to record a real run of the attack against Claude, but that attempt was stopped, so the page is a **scripted simulation**: no model call, no key, no transaction. That also keeps the public page from becoming a live injection harness or spending the API credit (the budget race from the 10-28 review is still open). Reading the 5 validators as a 3-of-5 quorum makes the lesson concrete. In naive mode every validator checks the same thing, the agent's own signature and the amount cap, so a poisoned plan passes 5/5. In defended mode each one takes the recipient from the owner's signed X request, not from memory, so the same plan gets 0/5. The X request itself is simulated; real X integration is T4 and needs the API pricing check first.
**Change:**
- `app/live/memory-poison/MemoryPoisonSim.tsx`: a client state machine plus SVG, with animated packets, balances and an event log, in KO and EN.
- `app/live/memory-poison/page.tsx`: the page, three lesson panels and TechNotes.
- `lib/poc-cards.ts`: the new live card with a Mermaid diagram.
- Regenerated with `pnpm docs:pocs`.
**Result:** `tsc` is clean. In headless Chrome on :3100:
- Attack run: 5/5 approve, and 10 jUSD moves to 0xBAD (treasury 90).
- Defended run: 0/5 approve, and the treasury keeps 100.
- No console errors and no horizontal scroll at 390 px. The card appears on `/live`.
- Not deployed.

### Demo: a card list on the left of every demo page

**Cause:** jay sent a sketch of the agent console page with a hand-drawn "Card list (panel)" down the left ("The fake letter", "Settlement agent", …): "make the demo page like this".
**Reasoning:** All 9 `/live` pages render the same `<Nav/>` + `<main>` pair, so one `app/live/layout.tsx` can wrap them in a CSS grid (the rail on the left over the full height, the header and page on the right) without editing any page. The card order moved into `lib/live-cards.ts` so the `/live` grid and the rail cannot drift apart. The rail shows each title's part before " — ", which gives the sketch's names.
**Change:**
- New `lib/live-cards.ts` (`liveCards`, `railLabel`), `app/live/layout.tsx` and `app/live/LiveRail.tsx`. `app/live/page.tsx` now uses `liveCards()`.
- `.live-shell` / `.live-rail` CSS appended to `app/globals.css`. Under 900px the rail becomes a horizontal chip strip between the header and the page.
- The fake-letter drawing keeps a 600px minimum and scrolls inside its own box on phones. It had shrunk to about 5px text.
**Result:** A review workflow ran 8 agents: desktop, phone, interaction and code checkers, each followed by a skeptic. It upheld 5 findings and refuted 3. Four were fixed and re-verified in Chrome:
- The active chip on a phone is scrolled into view.
- The match is longest-prefix, so `/live/aa/scenarios/*` lights AA while `/live/agent/console` still beats `/live/agent`.
- The DOM order is header → page → rail.
- Mermaid diagrams keep an 820px minimum inside the shell, instead of shrinking to about 7px text between 900 and about 1190px.

The fifth, the rail label "Settlement Agent" differing from the console page's h1, was kept on purpose: it is the name in jay's sketch. The three cards outside `/live` (/market, /xyz, /til/…) are listed, but the rail does not appear on their pages. `tsc` is clean, and nothing scrolls sideways at 390 or 1024. Not deployed.
