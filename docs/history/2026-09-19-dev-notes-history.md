# 2026-09-19 — dev-notes (Knowledge Notes) history

Source docs: `docs/topics/README.md` (rules: Key expressions, landing section, status roll, section numbering), `docs/topics/english/README.md` (Eng format), memory rules for the daily alice-tech read and the one-conversation-per-day Eng rule. Items came from jay's pasted video briefings (source `chat`), so no task/design file is the origin of the content itself.

### Daily checks

- **alice-tech:** `alice-tech-2026-09-19.md` does not exist (Saturday, no morning report). Yesterday's file (09-18) still has two unused candidates: Four Pillars (순유동성 — the indicator that explained nothing this week) and 서비스 (npm 공급망 위생: `pnpm audit`, `--frozen-lockfile`, Dependabot). They stay in play. jay's pastes won for every item today.
- **Gemini folder:** not due (Saturday; last check 2026-09-18).
- **Eng:** one conversation for the day → #35 (below).

### Tech #96–#102: seven items from jay's pasted video briefings

- **Cause:** jay pasted seven YouTube briefings over the evening ("add items in detail", "add this", "add this also with your new researched information", "add also") and said "you can push it".
- **Reasoning:** all seven are engineering talks, so Tech (NEW) rather than Life or Invest; jay asked which category and number the Shopify one got (Tech, #98). Homa, the AI-engineer roadmap, Shopify and the Blender demo were written by hand; Microduck, the ADK voice agent and MLflow were drafted by parallel subagents from `scratchpad/ITEM-INSTRUCTIONS.md` and validated (headings, summary/meta blocks, ≥12 vocab rows). Microduck used fresh web research (TechCrunch, The Register, Pollen's page, 2026-08-27/28 coverage) as jay asked.
- **Change:** `add-tech-item.py --status new --source chat --date 2026-09-19` × 7, slots 96–102 (first planned slot, so they sit at the end of the NEW block):
  - #96 `homa-receiver-driven-transport` — Ousterhout's Homa: message/RPC transport, receiver-driven grants, SRPT, switch priority queues; p99 of short messages 13× lower than TCP in the talk's benchmark.
  - #97 `ai-engineer-builds-the-car` — IBM Technology's three-tier AI-engineer roadmap; judgment about architecture as the scarce skill.
  - #98 `shopify-six-decisions` — 헤이제임스 on Shopify's six decisions; fix the tool instead of replacing it; reverse a bet when its premise dies.
  - #99 `vibe-modeling-blender-mcp` — AZTechnology: GPT 6 + Blender MCP builds and self-inspects the Sagrada Família in 28:49.
  - #100 `microduck-open-source-biped` — Pollen Robotics / Hugging Face Microduck, $399 sim-to-real RL biped.
  - #101 `adk-gemini-live-voice-agent` — Google ADK + Gemini Live: open stream not pipeline, queue decoupling, `send_realtime` vs `send_content`, Interrupted events.
  - #102 `mlflow-tracing-llm-as-judge` — IBM Technology: four silent failures, traces/spans, LLM-as-a-judge, evaluation as a CI gate.
  Each page has Key expressions (18–22 rows incl. acronyms) and "Where it lands in Jayverse"; the label "Foundations" in the drafts was replaced by Theory.
- **Result:** Tech 61/248, overall 68/490; index card now points at #72 (first NEW); rail = card = kicker = nav verified for every item.

### Eng #35 "The mean is fine. Which percentile hurts?"

- **Cause:** the one-conversation-per-day rule; today's items made tail latency the natural subject.
- **Change:** `docs/topics/english/english-35.md` (Interview): a Berlin payments system-design interview where Jay rejects the mean, asks for p99 per region, names two hypotheses in check order (FIFO queue behind large payloads; a fixed-timeout retry), states the falsifying condition, and proposes p99 next to the mean on the dashboard; three techniques, eleven expressions. Built with `english-notes.py` (Eng 1/35).

### Life 1304: Andrew Ng — tasks, not jobs

- **Cause:** jay pasted the Andrew Ng briefing; it is about how to work, so Life rather than Tech.
- **Change:** `add-tech-item.py --section mindset --type Talk` → Life 1304 `ng-tasks-not-jobs-context-advantage` (NEW): AI automates tasks, not jobs; what you offload you do not retain; domain context is the remaining edge.
- **Result:** Life 0/5 at the time; Key expressions and landing section present.

### Tech #103–#119: seventeen items from the evening's briefings

- **Cause:** jay kept pasting YouTube briefings ("add this", "add that") and gave standing push permission ("You can push at your will").
- **Reasoning:** all engineering or industry talks → Tech NEW, slots after the last NEW so they sit before the PLANNED block; drafted by parallel subagents from `scratchpad/ITEM-INSTRUCTIONS.md`, validated for headings, summary/meta blocks and ≥16 vocab rows; "Foundations" wording replaced by Theory on every new page.
- **Change:** #103 twenty-one-bank dollar stablecoin venture · #104 Pocock: fundamentals matter more · #105 agentic systems need ontologies · #106 harness engineering, shift left · #107 GEN-1.5 one-shot physical prompting · #108 Obsidian three levels / LLM wiki · #109 code graph cuts agent context (Graft) · #110 Chelsea Finn, π0.7 · #111 Gemini Robotics 2 whole-body · #112 MLX local agentic AI on Mac · #113 LeCun world models / JEPA · #114 Vercel Eve filesystem agents · #115 Managed Agents build-vs-buy harness · #116 Tech With Tim local AI weights/quantization/engines · #117 WEF top 10 emerging tech 2026 · #118 Blotato solo micro-SaaS system · #119 Claude for CFOs: verify, not summarize. (Numbers as they stand after tonight's reorder.)
- **Result:** Tech 61 done / 264 at the end of that batch; rail = card = kicker = nav verified.

### Life 1305–1309 and Invest 815

- **Change:** Life: 1305 systems thinking (Cynefin, DART) · 1306 research any topic like a PhD (Fraza) · 1307 Greene: the through line · 1308 Greene: reading leaves the prison · 1309 Djokovic: watch the loss. Invest 815 `mit-financial-markets-terms-edge` (`--tag Invest --type Lecture`).
- **Result:** Life 0/10, Invest 0/16.

### Tech #62 "Learning greed on a full calendar" — the most important item

- **Cause:** jay: "add the most important thing. How can I fulfill my learning dream even though I have not much time… This one should be the most important thing in Tech section."
- **Reasoning:** not one video but a synthesis of today's sources (Ng, Greene, Fraza, Djokovic, Karpathy's LLM wiki, Pocock): one through line decides depth (deep / converse / file bins), a fixed daily slot that ends in an artefact, three closing questions in the history file, replay the interval, let the system hold the index, accept the ratio in the rail. Written by hand (`learn-en/ko/vocab.md`).
- **Change:** `--status important --slot 62` → Tech #62 `learning-greed-with-no-time`, first Important slot. To keep the ten-per-section cap, the previous tenth Important, `supported-means-three-things` (Anvil / testnet / wallet), was demoted to PLANNED; `reorder-by-status.py` moved it to #127 (first PLANNED).
- **Result:** Tech Important = 10 again; the item's landing section proposes a `docs/topics/raw/` layer and a generated `index.md`.

### Tech #120–#126, Invest 816, Theory 516: eight more briefings

- **Cause:** jay's pastes continued ("add this", "add"); the Simonyan system-design video turned out to be the same curriculum as the freeCodeCamp course, so it was merged into one item as a second source instead of a duplicate.
- **Change:** Tech #120 Harvard product-company gap (MVS, SLIP) · #121 system-design course (freeCodeCamp + Simonyan original; adds the "why system design in the AI era" framing to Why) · #122 microfactory: small task models, clutch, rollback · #123 YC pick one idea and go deep · #124 YC first users: search not persuasion, MEP · #125 XenoSphere the art of design: constraints, layers, interfaces, choice architecture · #126 OpenAI data agent demo, read sceptically (evidence panel: source, query, rows, window). Invest 816 Dalio economic machine / holy grail (`--tag Invest --type Lecture`). Theory 516 MIT decision theory: vNM, risk aversion (`--section fundamentals --tag Math --type Lecture`; sits after the ten Important).
- **Result:** Tech 61/273, Invest 0/17, Theory 6/189.

### Life 1310–1326: seventeen items on reading, thinking and the body

- **Cause:** jay's book-list and psychology briefings, all about how to think, read and live → Life (`--section mindset --type Talk`).
- **Change:** 1310 Fei-Fei Li agency / barbell / spatial · 1311 박혜진 ten books · 1312 정영수 ten books · 1313 subscribers' top novels · 1314 공백 foreign literature top 7 · 1315 락서 classics top 10 · 1316 황석영 read the classics · 1317 언어의 정원 roof–pillars–foundation summarising · 1318 Lacan RSI, desire, signifier · 1319 Herjavec: they buy you, be heard · 1320 Santos three rules, time affluence · 1321 Rometty resilience · 1322 Bremmer strategic thinking · 1323 Damour: emotions have a seat, not the vote · 1324 BBC dancing and cognitive reserve · 1325 Kotler flow on command · 1326 Lieberman exercise myths, healthspan. Health items (1–6) keep their own numbering.
- **Result:** Life 0/27, overall 68/541 (13%).

### Life 1327, Tech #127–#128: Tang, Nazarov, Amodei

- **Change:** Life 1327 Mandy Tang: tell the truth, follow your gut, follow through (the producing half of #62) · Tech #127 Nazarov at the CFTC–SEC roundtable: tokenization and the US 60% equity share (oracle freshness as an Auditor invariant; Korea's ~2% share) · Tech #128 KBS on Amodei's "Pacing the Frontier": embedded evaluators, democratic then global coordination, the antitrust convener problem (written as a note on a news report, not on Anthropic's internal position). `supported-means-three-things` now #129 (first PLANNED).
- **Result:** Tech 61/275, Life 0/28.

### Invest 817, Life 1328: Ueda and deep reading — today's last two

- **Cause:** jay: "add and push it which is today's last item".
- **Change:** Invest 817 `ueda-boj-underlying-inflation-wage-loop` (`--tag Economics --type Lecture`): the 2023 CNBC interview; headline 3% vs underlying below 2%, wage growth as the anchor, MoF owns FX intervention; TradingView exercise on the 31 Jul 2024 hike / USDJPY / 5 Aug 2024 Nikkei gap. Life 1328 `reading-rewires-brain-deep-reading`: BBC on reading as a co-opted circuit (Wolf, Dehaene), script-dependent wiring, the anterior insula, skimming vs deep reading; the biological floor under today's book-list items and #62.
- **Result:** Invest 0/18, Life 0/29; overall 68/546. Two pushes today (checkpoint at #128/1327, final with these two).

### Closing three lines (the new habit from #62)

- **Learned:** a status change (Important → Planned) is two edits, the rail dot in `notes.html` and the `_nav.js` entry; `reorder-by-status.py` does the rest.
- **Unclear:** whether the "raw layer" (`docs/topics/raw/`) should store jay's pasted briefings verbatim; not built yet.
- **Next:** add the four in-flight items, then the `index.md` generator proposed in #62.

### Re-check of today's items: four moved, Important marks set in every section

- **Cause:** jay: "I know there are some items should belong to Invest or Life. So check the things that are added today. and make some of them important." then "Make some of eng items important also".
- **Reasoning:** finance-industry items belong in Invest, focus/learning talks in Life; the ten-per-section Important cap holds, so each promotion in a full section demotes one older Important to NEW (not PLANNED, they are still unread).
- **Change:**
  - Moved Tech → Invest (tag Economics): 818 twenty-one-banks stablecoin JV, 819 Nazarov CFTC tokenization. Moved Tech → Life: 1329 Pocock fundamentals, 1330 YC pick one idea and go deep. Move = drop the rail entry, card and `_nav.js` entry from Tech, re-add with `--section`; the page file keeps its `pocs-` name.
  - Tech Important now: #62 learning greed, #63 agent-team workflow, #64 KB Kookmin + Kinexys, #65 agent payments Korea, #66 graph & loop, #67 invariant is a stop, #68 MCP three sides, **#69 MLflow tracing / LLM-as-judge, #70 harness engineering, #71 system-design course** (new). Demoted to NEW: aa-two-standards-capability-matrix (#72), articulation-idea-library (#73), fast-ethereum-is-a-delivery-chain (#74).
  - Invest: **809 Dalio economic machine** promoted; tv-fibonacci-retracement-confluence demoted to NEW (810), the most advanced of the TradingView ten.
  - Life Important (9, Life keeps chronological numbering): 1304 Ng, 1307 Greene through line, 1317 roof–pillars–foundation, 1320 Santos, 1322 Bremmer, 1323 Damour, 1328 deep reading, 1329 Pocock, 1330 YC go deep.
  - Eng Important (10, `status: important` in the .md, rebuilt with `english-notes.py`): #21, #22, #23, #24, #25, #27, #30, #32, #33, #35 — the interview, negotiation, first-weeks and planning conversations that target the job abroad.
- **Result:** Tech 61/271, Invest 0/20, Life 0/31, Eng 1/35, Theory 6/189; overall 68/546. Important = 10 / 10 / 10 / 10 / 9 across Tech · Theory · Invest · Eng · Life. Note: item numbers in Tech shifted again (Important block re-sorted), so "Tech #62 = boundaries" citations inside older pages now point at the learning item; numbering by rank means citations by number drift — a known cost of the design.
