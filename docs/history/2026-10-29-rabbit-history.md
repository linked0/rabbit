# 2026-10-29 — rabbit history

Source doc: alice item `pocs-agent-payments-korea-control-plane`, §1 "How it gets robbed: three side doors", point 2 "The fake letter" (Patlan et al. 2025), quoted by jay in chat. No task in `docs/tasks/current-plan.md` covers it.
The T7 entry implements [`../tasks/current-plan.md` §7](../tasks/current-plan.md#t7) (written in that entry).

## Added

- Demo card `memory-poison` at `/live/memory-poison`: an interactive SVG that walks the memory-poisoning attack with @kindofblue91 as the owner (attacker, shared memory, agent, treasury, 5 validators, and the buttons ① Poison → ⑤ Steal), plus a defense toggle

- Top menu "Demo" renamed to "Jayverse" (tab, /live heading, rail title, back links); route stays /live
- Demo section: a card-list rail on the left of every `/live` page (jay's sketch), a chip strip on phones
- Plan: T7 "My AI model" (fine-tune an open model on the M5 Max; the Mac compared with DGX Spark / RTX Spark), plus decisions D5 and D6
- `current-plan.md`: two new tasks, T5 (Rabbit's image on Kubernetes, PoC) and T6 (RAG: measure Jay Chat, then Wonderland), plus decision D4 (embeddings)

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

### Top menu: Demo → Jayverse

**Cause:** jay: "Change top menu name Demo to Jayverse".
**Reasoning:** Renaming only the tab would leave the page it opens titled "데모", so every label for the section changes together: the tab, the `/live` heading, the rail heading and the "← Demo" back links. The route stays `/live`, so no links break. The old `/jayverse` page, whose menu was removed on 2026-08-11, is a different route and is left as it was.
**Change:** `app/Nav.tsx` (both languages now read "Jayverse"), `app/BackLinkClient.tsx`, `app/live/layout.tsx`, `app/live/page.tsx`, `app/live/memory-poison/page.tsx`.
**Result:** In Chrome the tab reads "Jayverse" and stays lit on `/live`, on the demo pages and on `/market?from=live`. The heading, rail title and back link all read Jayverse. `tsc` is clean. Not deployed.

### current-plan: T5 Kubernetes PoC and T6 RAG added

Source: alice `ai-engineer-builds-the-car` (Deep #82), Tier 2 (RAG) and Tier 3 (containers and Kubernetes); [`../tasks/current-plan.md`](../tasks/current-plan.md) §5, §6.

**Cause:** jay asked what a PoC for #82's "Containers and Kubernetes" bullet would be and what to do for RAG in our systems, then said "Add the two task into the Current plan".
**Reasoning:** Rabbit already has the pieces, so both tasks start from them instead of from toy examples. The multi-stage Dockerfile and `.dockerignore` serve Cloud Run today, and Jay Chat already does keyword RAG in `lib/about-me.ts`. For T5, k3d instead of kind, because kind's default CNI ignores NetworkPolicy and the egress test would pass falsely. For T6, the corpus is small (~83 chunks, ~72 KB of profile markdown), so "no retrieval, whole corpus in a cached prompt" is compared against today's keywords and a hybrid embedding search, and an eval set comes first. Embeddings wait on D4.
**Change:** `current-plan.md`: title, task list (items 5–6), summary rows T5/T6, suggested order, D4, and new sections §5 (why, what exists, 7 steps, acceptance/risks) and §6 (what exists, the A/B/C judgment table, 6 steps ending in Wonderland, risks, an empty results table).
**Result:** Plan only; nothing built. Branches named `claude/k8s-poc` and `claude/rag-eval`.

### Plan: T7 "My AI model", fine-tuning on the Mac vs DGX Spark

**Cause:** jay: "Add T7: My AI model", then "how can I train or fine tune a existing model with my 128G mac book, compare it to RTX Spark or something".
**Reasoning:** "My model" is read as an open-weights base plus a LoRA jay trains on his own corpus, run locally. The Claude API offers no public fine-tuning, so Claude + RAG is the yardstick, not the base. Two research workflows (12 agents, each claim checked by a skeptic) found three things that change the obvious plan:
- Ollama removed LoRA adapters in v0.34.1, so the model must be fused before import.
- The installed mlx-lm 0.29.1 on Python 3.9 cannot load Qwen3.5 or Gemma 4.
- "RTX Spark" is a real, separate Windows-on-Arm product, as well as DGX Spark.
For a ~1,000-pair dataset the Mac is enough (an estimated 5–20 min per epoch for a 4B model). DGX Spark wins on CUDA tooling and big jobs, but now costs ~$6,950 and decodes more slowly. An hour of a rented H100 is the cheaper test.
**Change:** `docs/tasks/current-plan.md`:
- New §7: what exists, the base-model table, the hardware table, steps, serving options, risks.
- A summary row T7.
- Decisions D5 (base model: Qwen3.5-4B) and D6 (local only until the eval says otherwise).
- The order note: T7 goes after T6, because it reuses T6's eval set.
**Result:** Plan only; nothing installed or trained. The next step is §7.5 step 1 (fresh mlx-lm venv). No real M5 Max LoRA number exists yet, so step 4 records the first one.
