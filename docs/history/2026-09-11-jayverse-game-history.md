# 2026-09-11 — jayverse-game

> Source: [`../features/jayverse-game.md`](../features/jayverse-game.md) §1b (settlement-flow
> visualization) + jay's direction to reach it through an in-street warp gate.

### Settlement-flow visualization, entered through a street "space-jump" gate

- **Cause:** jay asked for a second game feature — a graphical, entity-by-entity view of how a
  payment settles (Visa/Mastercard rail next to the on-chain rail, user → blockchain) — and then
  specified it should be reached **through a gate inside the existing autonomous-agent game, like a
  space jump**, not as a separate page. jay approved building it standalone first; Rabbit-menu
  integration waits for his review.
- **Reasoning:** settlement is a *flow of entities*, so a **2D SVG stepped diagram** reads far
  clearer (and is faster to test) than forcing it into 3D; the existing r3f street stays the
  "who decides" world, and this is the "who moves the money" world, joined by a portal. A stepped,
  read-only replay matches the design doc's MVP scope.
- **Change (in `jayverse-game`):**
  - `lib/settlement.ts` — stations (card rail: cardholder→merchant→acquirer→network→issuer;
    seam: JIT stablecoin→USD conversion; on-chain: wallet→facilitator→contract→finality), 6 steps,
    each carrying *what the user feels* vs *what runs underneath*, and per-station *trust + failure
    mode*.
  - `components/SettlementFlow.tsx` — the SVG diagram: two lanes, faint base topology + animated
    active edges, glowing active stations, play/step/restart controls, click-a-station inspector.
  - `components/Gate.tsx` — a glowing warp gate at the far end of the street (pulsing torus + label),
    click to enter.
  - `components/SpaceJump.tsx` — a ~1.1s CSS starline-warp + flash transition, played in and out.
  - Wired into `Scene.tsx` (renders the gate) and `GameClient.tsx` (warp state → shows the overlay).
  - `app/settlement/page.tsx` — standalone route for isolated testing.
- **Result:** `npx tsc --noEmit` clean; `pnpm build` succeeds (routes `/`, `/street`,
  `/settlement`); `pnpm dev` (:3050) serves all three 200 and `/settlement` renders. **Not yet
  integrated into Rabbit's Game menu** — that is a git submodule import, pending jay's test + approval.
  Design doc [`jayverse-game.md`](../features/jayverse-game.md) §1b updated with the gate-access and
  status notes. (Minor aside: `next start -p 3050` bound :3000 in one check; `pnpm dev` binds :3050
  correctly, which is the path jay uses.)

### Iteration — game-style space scene, steps list, return tunnel, and Jay the host

- **Cause:** on review, jay asked for four changes: the settlement diagram should be **game style,
  like a spaceship travelling the planets**; the "what the user feels" line should be a **list with
  the step being done highlighted**; the settlement space needs a **tunnel back to the agent street**;
  and — revising the earlier "separate gate page" idea — the **agent street itself is the gate page**,
  with a **host named Jay** introducing the gates, so the street shows **two figures (Jay + agent)**.
- **Change (in `jayverse-game`):**
  - `SettlementFlow.tsx` rebuilt as a **space scene**: entities are **planets** (radial-gradient
    bodies, orbit rings, active-glow pulse), faint **space routes** + a bright **comet trajectory**,
    and a **spaceship that glides planet→planet** each step (CSS-transitioned transform, rotates to
    face its destination) over a starfield. Added the **steps list** (all six "feels", current
    highlighted, past ✓, click-to-seek) and a **wormhole "tunnel to the street"** (rotating rings)
    that calls `onBack`.
  - New `Jay.tsx` — host character (distinct orange), bob + waving arm + a hop on each new line, and a
    cycling **speech balloon** (emoji + text) introducing the agent and the gate; placed on the
    entrance sidewalk in `Scene.tsx`.
  - Fixed a z-index bug where the gate's drei `Html` label bled over the settlement overlay: overlays
    now sit above drei's huge z-index, and `Html` labels are pinned to a low `zIndexRange`.
- **Result:** `tsc` clean, `pnpm build` OK, `pnpm dev` (:3050) serves `/`, `/street`, `/settlement`
  (markers "spaceship tour", "tunnel to the street", the steps list all present). Still standalone —
  Rabbit Game-menu submodule import waits for jay's test + approval.

### Polish — bigger settlement text, human Jay, fixed dialogue board

- **Cause:** jay: settlement text was too small; Jay should look human; and his lines should sit on a
  fixed board while the balloon shows only "blah blah blah".
- **Change:** bumped SettlementFlow font sizes (planet names, lane labels, steps, detail, inspector)
  and gave the SVG more height. Rebuilt `Jay.tsx` as a **human figure** (head with hair + eyes, torso,
  two legs, a still arm and a waving arm). Moved Jay's dialogue to a **fixed board** rendered in
  `GameClient` (bottom-center, large text; `lib/jay-lines.ts` is the shared source, line index cycles
  there and passes to Jay for his hop); Jay's balloon now shows only italic **"blah blah blah"** chatter.
- **Result:** `tsc` clean, `pnpm build` OK, all routes 200. Doc §1b updated. Still standalone, pending
  jay's test + approval before the Rabbit submodule import.

### Polish — concrete merchant PoC + EN/KO toggle

- **Cause:** jay: make the settlement PoC more understandable (with a merchant), and add an Eng/Kor
  toggle.
- **Change:** rewrote `lib/settlement.ts` scenario to a concrete, relatable story — *Mina buys a $20
  hoodie from an online store (the merchant)* — with plainer step text, and added Korean fields
  (`nameKo/roleKo/trustKo/failKo`, `feelKo/detailKo`, `labelKo`). `SettlementFlow.tsx` gained an
  **EN / 한국어 toggle** and renders every label/step/planet/inspector string in the chosen language.
- **Result:** `tsc` clean, `pnpm build` OK, routes 200 (`/settlement` shows the merchant scenario).
  (Jay's street dialogue stays EN for now.) Still standalone, pending jay's test + approval.

### Imported into Rabbit's Game menu — git submodule + static iframe

Implements: [`../features/jayverse-game.md`](../features/jayverse-game.md) §1b (jay: "put the game
service under the game top menu … import as git submodule").

- **Cause:** jay approved wiring the standalone jayverse-game (3D agent street + settlement gate)
  under Rabbit's existing **Game** top-menu (`/game`), and to publish it.
- **Reasoning:** a hard version wall blocks importing the game's *source* into Rabbit — the game is
  Next 16 / React 19 / `@react-three/fiber@9` + `drei@10` (which require React 19), while Rabbit is
  Next 14 / React 18 / fiber@8 with no drei. Upgrading Rabbit's runtime would be a large, risky
  migration. But the game is 100% client-rendered (no API routes / server actions / fetches), so it
  **statically exports** cleanly. Chosen path: submodule (source of truth) + static export served by
  Rabbit + `<iframe>` embed — the iframe isolates the two React/Next runtimes, one deploy ships both,
  and it matches jay's "git submodule" plan.
- **Change:** (game repo) added env-gated static-export to `next.config.ts`
  (`EXPORT_STATIC=1` + `NEXT_PUBLIC_BASE_PATH=/jayverse-game`) and pinned `turbopack.root` to the repo
  dir (else Next 16 walks up to Rabbit's lockfile and compiles Rabbit's `middleware.ts`); pushed to
  `jayverse-game` main. (Rabbit) added the submodule at `vendor/jayverse-game`; `scripts/build-game.mjs`
  (+ `pnpm game:build`) exports it and copies `out/` → `public/jayverse-game/` (committed like the
  generated docs HTML, so Docker needs no second toolchain); repointed `app/game/page.tsx` to embed
  `/jayverse-game/street.html` in an `<iframe>` (`.game-embed` CSS) and **removed the old canvas
  coin-catcher** (`app/game/Game.tsx`); excluded the submodule from `tsconfig` (React 19/drei source
  would break Rabbit's typecheck) and `.dockerignore`; and added `jayverse-game/` to the middleware
  matcher's exclusion so the game's assets don't 302 to `/login`.
- **Result:** Rabbit `pnpm build` clean; dev server serves `/game` (200), `street.html` (200, text/html),
  `settlement.html` (200), and the prefixed `_next` css/js chunks (200, correct MIME). Awaiting jay's
  visual test in the browser. Game bundle is ~1.9 MB.
