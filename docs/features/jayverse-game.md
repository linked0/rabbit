# Jayverse — 3D market world: watch the payment agent (browser)

A walkable 3D street, rendered in the browser, whose **protagonist is the autonomous payment
agent**. Each billboard is a Verex prediction market; on every tick the agent walks to a market
and you **watch it act** — place a bet, or bounce off a barrier that names *why* it was refused.
Two modes: **synchronous (live)** — watch the running agent in near-real-time — and **replay** —
scrub a stored journal of what it already did.

> Status: **design draft for review, not built.** Reframed (jay, 2026-09-07) from a
> player-trades-in-3D game to an **agent visualization**: the game renders the mandate console's
> journal in 3D. Supersedes the older Unity-first idea in [game.md](./game.md) for the *browser*
> path. Service #5 in [../tasks/09-02-jayverse.md](../tasks/09-02-jayverse.md) ("## 5. Unity").
> Repo: `jayverse-game`; hosted inside the Rabbit portal.

---

## Phases (build order)

| Phase | Focus | What we implement |
|---|---|---|
| **1 (MVP)** | Replay | react-three-fiber street + market boards + agent character; bundled sample journal; timeline scrubber (play/pause/speed/step/drag-seek) + journal panel; buy pulses + labeled refusal barriers. Read-only, no backend. |
| **2** | Live (synchronous) | `useAgentJournal()` delta-polling `?since=<cursor>` of the running agent; enqueue + animate new ticks in near-real-time; poll-rate vs render-rate decoupling. |
| **3** | Polish (+ optional player-trading) | six distinct refusal visuals; follow-cam; real low-poly city assets; optional player-trading layer wired through the wallet. |

---

## 1. What we build (basic feature)

**The game is a *renderer* of the agent's journal, not a new system.** The
[mandate console](../../app/live/agent/console/page.tsx) already produces the data: a journal of
ticks — most did nothing, six kinds of refusals, expiry, and cited evidence. The 3D street turns
each journal row into something you can watch.

- **The setting — a market street.** A small, low-poly city block: a straight street lined with
  **boards**, each bound to one Verex market, showing question title, **bid / ask / last**, and a
  tiny sparkline (drawn to a `CanvasTexture`, updated in place).
- **The protagonist — the agent as a character.** A walking figure that, on each tick, moves to
  the relevant market board and **acts out** the journal row:
  - **a fill** → the agent reaches the board, an action animation plays, the board's price nudges;
  - **a refusal** → the agent is stopped by a **visible barrier labeled with the reason** (budget
    exhausted, expired, evidence missing, …). The console already notes "the six refusals look
    different" — here they *look* different in 3D.
  - **a do-nothing tick** → the agent glances at a board and walks on. Most ticks are these, and
    seeing that is the point: autonomy is mostly *restraint*, not trading.
- **Two modes** (§3): **synchronous (live)** reads the running agent; **replay** loads a stored
  journal and lets you scrub/step a timeline with a synchronized journal panel.

**Spectator-first (decided at my discretion, jay's standing "decide at will", 2026-09-07):** v1
the player is a **spectator of the agent** — watch live, or scrub replay. The player does **not**
trade in v1. Player-trading (the old design) becomes a later *optional* layer, because letting the
player trade dilutes the one thing this makes legible: *watching autonomy operate inside its
guardrails*. This also keeps v1 **read-only** — no wallet, no signing, no way for the game to move
money — which is a real safety and simplicity win.

Scope for v1: one straight street, ~6–12 boards, one agent character, both modes, a replay
timeline + journal panel. No multiplayer, no player trading, no physics beyond walk-and-collide.

---

## 2. User scenario (prose)

**Replay (the demo-safe path).** Mina opens the portal and clicks **"Watch the agent."** A 3D
street fades in with a **timeline scrubber** at the bottom. She presses **Play**. The agent
character walks to the first board — *"Will ETH close above $4k this week?"* — glances at it, and
walks on: the journal panel on the right reads *"tick 14 — no action (no fresh evidence)."* At the
next board it **stops and buys**; an action animation plays, the board's spread widens, and the
panel shows *"tick 15 — bought 24 YES @ 0.44, evidence: 'ETF inflow' (Reuters)."* Further down,
the agent walks up to a market and **hits a red barrier** stamped **"budget exhausted"**; the
panel shows the same refusal with the enforcer's reason. Mina drags the scrubber back to re-watch
that moment, then speeds the replay to 4× to reach the **expiry** tick — where the agent is
refused *after* the mandate expired, nobody having revoked anything.

**Synchronous (live).** With the backend up, she flips to **Live**. Now the street shows the agent
acting in near-real-time: as each tick fires on the server, the character walks and acts within a
second or two. It's the same scene, driven by the running agent instead of a recording.

She never signs anything. She's *watching* an autonomous agent spend within a mandate — and seeing,
spatially, how often it *doesn't*.

---

## 3. The two modes

| Mode | Data source | What you see | Best for |
|---|---|---|---|
| **Synchronous (live)** | poll the running agent's journal API for new ticks (delta polling, §5) | the agent acting in near-real-time as ticks fire on the server | "it's really autonomous, right now" |
| **Replay** | load a stored journal once, scrub locally | play / pause / speed / step a timeline; a side panel shows the journal row (evidence + refusal reason) for the current moment | demos, teaching, **always works** (no live backend) |

**Why replay is the default demo mode:** it reads a stored journal, so it is deterministic and has
**zero live dependency** — no anvil, no verex API, no scheduler. This directly answers the Cloud
Run limit we hit on the live console (CPU sleeps between requests, the scheduler can stall). Live
mode is the impressive version when the backend is up; replay is the one that never breaks in front
of an audience.

---

## 4. User journey (ordered steps)

1. **Portal link** — Rabbit `/game` card: "Watch the payment agent."
2. **Load** — Next.js page mounts the R3F canvas; a loading screen while assets + the journal (or
   first live snapshot) stream in.
3. **Pick mode** — **Replay** (choose a saved run) or **Live** (if a backend is configured).
4. **Watch** — the agent character walks the street tick by tick; boards render live/last bid/ask.
5. **Read** — the journal panel tracks the current tick: action or refusal, the cited evidence,
   the enforcer's reason. In replay, this is synced to the scrubber.
6. **Scrub / speed (replay)** — drag the timeline, step tick-by-tick, change speed to reach a
   moment of interest (a refusal, the expiry tick).
7. **Switch modes** — flip Live↔Replay without leaving the scene.
8. **Leave** — back to the portal. Nothing is signed; no state is written by the game.

---

## 5. How to implement it (the core ask)

### Renderer: react-three-fiber / three.js in a Next.js page

Recommended primary path — it *is* the browser, and it lives in the portal we already ship.

- **Why**:
  - **No plugin, small footprint** — three.js core is a few hundred KB gzipped; ships as a normal
    Rabbit route, no engine runtime, no WebGL blob to host.
  - **First-class React data flow** — the journal is React state; boards and the agent are
    components that re-render off the same hooks the Verex web app uses. No JS⇄engine bridge.
  - **DOM overlays are trivial** — the timeline scrubber and journal panel are ordinary React over
    the canvas (accessible, testable), not drawn in 3D.
  - **Ecosystem** — `@react-three/fiber`, `@react-three/drei` (`Html`, `Text`, loaders, controls),
    `@react-three/rapier` (collision) cover the street, labels, and the agent's pathing cheaply.
- **Shape**:
  - New route (e.g. `app/jayverse/street/page.tsx`), `dynamic(() => …, { ssr:false })` so three.js
    never runs on the server.
  - `<Canvas>` → scene graph: street mesh (glTF), instanced buildings, a `Board` per market, and
    **one `Agent` character** with a simple path-to-target + walk animation.
  - Each `Board`: a plane with a `CanvasTexture` (2D-drawn text/sparkline). On new data it redraws
    its texture — cheap, no geometry churn.
  - **Barriers/actions**: a small set of reusable visuals — a fill animation, and one labeled
    barrier prefab per refusal type (six), driven by the journal row's `reason`.

### Alternative: Unity → WebGL export

Keep as a fallback / "if we want richer game feel later."

- **Pros**: full editor, animation, richer game systems; reuses the Unity/C# skill the roadmap
  wants to build anyway; matches game.md's submodule+iframe plan.
- **Cons / trade-offs**:
  - **Bundle size** — a Unity WebGL build is typically **10–40 MB+** vs three.js's few hundred KB;
    slow first load, awkward inside a portal.
  - **Data-in-canvas** — the journal + controls live *outside* the WebGL canvas; every update needs
    a JS↔Unity bridge (`SendMessage` / `.jslib`). More moving parts, harder to test, worse a11y.
  - **Iframe isolation** — served as a separate build embedded via `<iframe>`; data must be
    marshalled across the frame boundary.
- **Rule if used**: treat Unity as a **dumb renderer fed by JS** — it draws the street and animates
  the agent, but the journal, timeline, and mode logic stay in the host page's JS. Unity never
  talks to the agent API directly; it only receives "agent goes to board X and does Y" and emits
  playback events.

**Decision**: start with **react-three-fiber** for the MVP; revisit Unity only if the game ambition
outgrows what three.js comfortably renders.

### Data flow — read-only, two modes

The game **only reads** the agent's journal; it never drives the agent and never signs anything.

- **Live (synchronous) — delta polling.** A `useAgentJournal()` hook polls the agent's journal API
  at a **small interval (~1–2 s, roughly the tick cadence)**, passing a **cursor** so each request
  returns *only new rows*: `GET /api/agent/journal?since=<cursor>`. New ticks are enqueued and
  animated out.
  - **Decouple poll rate from frame rate.** Ticks are slow and discrete; rendering is 60fps and
    **animates *between* events** — the agent walks smoothly to a board over ~1 s even though the
    data arrived in one poll. Data cadence ≠ render cadence.
  - **Read-only, observe-not-drive.** The agent ticks on its own (its scheduler, or a human in the
    console). The game reads what happened; it can never make the agent spend.
  - **Cloud Run fit.** While someone watches, polling keeps traffic flowing; when the tab closes,
    polling stops and the instance sleeps — exactly the desired behavior.
- **Replay — one-shot load + local scrub.** Fetch a stored journal **once**
  (`GET /api/agent/journal?run=<id>`), then play/scrub entirely client-side. Zero polling, zero
  live dependency — deterministic and offline-capable.
- **Boards' market data** (bid/ask/last on the billboards) is secondary ambience: in replay use
  the values recorded in the journal at that tick; in live, optionally poll a few in-view boards
  from the Verex API (throttled), or just show the journal's recorded quote.

---

## 6. Cooperate with existing services

- **Mandate console / agent journal API** — the source of truth. The game reuses the console's
  existing journal endpoints ([app/api/agent](../../app/api/agent)) **read-only**: `?since=` for
  live delta polling, `?run=` for a replay. No new agent API is needed; the game is a second
  *view* of the same journal the console table shows.
- **Verex API** — optional, for live board quotes as ambience. The game places **no** orders (the
  agent does that server-side); this is a pure read.
- **Wallet & simulation service** — **not used in v1.** Spectator-first means no signing in the
  game, so there is no wallet dependency. (If player-trading is added later, it would reuse
  `jayverse-wallet` exactly as the old design described.)
- **Rabbit portal** — hosts the route, auth/session, nav, HUD chrome. Per Jayverse policy,
  `jayverse-game` stays its own repo; Rabbit **imports** it (npm package / submodule for the R3F
  scene, or a proxied route) rather than absorbing it.

---

## 7. Implementation sketch + open questions

### Sketch

- **Scene**: one straight street, low-poly glTF kit (draco), skybox, baked lighting; ~6–12 boards.
  Instanced buildings for cheap fill. One agent character with a walk cycle.
- **Board ↔ market mapping**: `boards.json` — `{ boardId, position, marketSlug }` — maps each
  physical board to a Verex market. In replay, the mapping comes from the journal's markets.
- **Journal → animation**: a small player module consumes journal rows in order and emits scene
  commands — `goTo(board)`, `playFill()`, `showBarrier(reason)`, `idleGlance()` — timed to the
  scrubber (replay) or to arrival of new polled rows (live).
- **Refusal visuals**: six labeled barrier prefabs keyed by the enforcer's reason, so the six
  refusals are visually distinct (the console's promise, made spatial).
- **Movement**: the agent path-walks to the target board (nav is trivial on one straight street);
  a spectator camera follows or free-orbits.

### Performance

- Keep draw calls low (instancing, merged street geometry); board textures are the main churn —
  update only changed boards, cap texture size (e.g. 512²), reuse the `CanvasTexture`.
- Lazy-load the route (`ssr:false`, dynamic import); code-split the scene from the portal shell.
- Cap pixel ratio, frustum-cull, LOD/hide distant boards' updates.

### Weekend MVP vs later

- **Weekend MVP**: one flat street, ~3 boards, one agent character, **replay mode only** driven by
  a saved journal (play/pause/scrub + journal panel), fills and at least two refusal barriers
  rendered. Ugly assets OK. (Replay-only first because it needs no live backend.)
- **Later**: live delta-polling mode, all six refusal visuals, richer city kit + lighting, board
  quote streaming, minimap, mobile controls, and — optionally — the player-trading layer from the
  old design (with wallet + simulate-before-sign) as a separate mode.

### Open questions

1. **Camera** — follow-cam on the agent vs free spectator orbit for v1? (Leaning: follow-cam with
   optional free-look.)
2. **Journal API shape** — do the existing agent endpoints already support `?since=` (delta) and
   `?run=` (a stored run), or do those need adding? This is the one real dependency to confirm.
3. **Where replays come from** — are journals persisted per run already (DB), or does replay need a
   save-a-run step first?
4. **Board quotes in live mode** — poll Verex for a few in-view boards, or just render the journal's
   recorded quote to stay fully read-only?
5. **Asset licensing** — buy a low-poly city kit vs build; size budget (target a few MB).
6. **Repo boundary** — R3F scene as an npm package Rabbit imports, a submodule, or a proxied route?
7. **Player-trading later** — if/when added, is it a distinct mode or a toggle within the live view?
