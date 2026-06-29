# Game (Unity, via submodule)

**Goal:** embed a sample **Unity** game in the Game menu, kept in its own repo and integrated
here as a **git submodule**.

## Current
`/game` is a 2D-canvas "Coin Catcher" placeholder.

## Proposed
- Build the Unity game to **WebGL** and embed it in the `/game` page (an `<iframe>` over the
  served build). Keep the game in a **separate repo**, added here as a submodule.

## Plan & steps
1. **Unity repo:** create `rabbit-game` (Unity project); build target **WebGL**.
2. **Submodule:** `git submodule add <url> games/rabbit-game`. *Or* (lighter) commit only the
   built WebGL output to a `public/game/` path so you don't ship the whole Unity project.
3. **Serve:** place the WebGL build under `public/game/`; `/game` loads it in an `<iframe>`.
4. **CI (optional):** build the Unity WebGL via the Unity GitHub Action so the embed stays fresh.

## Open questions
- Submodule the **source** (build in CI) or just the **built WebGL** output (simpler, smaller)?
- Replace the canvas placeholder, or keep it as a fallback while the Unity game is WIP?

## Features
- [ ] **Create a separate game repo** (you)
  - [ ] New standalone `rabbit-game` repository (kept outside rabbit, its own Unity project)
  - [ ] Plan to link it back into rabbit as a git submodule
- [ ] **Build the sample game** (you)
  - [ ] Build the game to a **WebGL** target in the Unity IDE
- [ ] **Integrate into rabbit**
  - [ ] (you) Decide: submodule the source vs commit the built WebGL
  - [ ] Add the submodule / place the WebGL build under `public/game/`
  - [ ] Embed via `<iframe>` in `/game`
  - [ ] (optional) Build the Unity WebGL in CI
