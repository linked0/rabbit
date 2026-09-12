# Game (JayVerse, via submodule)

**Goal:** serve the **jayverse-game** repo's 3D agent-journal replay from the Game menu,
keeping it in its own repo and integrating it here as a **git submodule**.

## Status — done

`/game` embeds the JayVerse replay. The 2D-canvas "Coin Catcher" that used to live there
(`app/game/Game.tsx`) is kept as the **fallback** when the static bundle hasn't been built.

The original plan on this page was a **Unity → WebGL** build. That was replaced: the game
that actually got written (`linked0/jayverse-game`) is a Next.js + react-three-fiber app,
so there's no Unity toolchain and no WebGL export step. The submodule + `<iframe>` shape
the plan called for survived intact — only the build command changed.

## How it fits together

| Piece | Where |
|---|---|
| Game source | `games/jayverse-game` (submodule → `linked0/jayverse-game`) |
| Build | `pnpm game:build` → `scripts/build-game.mjs` |
| Served bundle | `public/jayverse-game/` (generated, **gitignored**) |
| Embed | `app/game/page.tsx` — `<iframe src="/jayverse-game/street">` |
| Route plumbing | `next.config.js` rewrites, `middleware.ts` matcher |

**Why an iframe and not an import.** The game is Next 16 / React 19 / r3f 9; rabbit is
Next 14 / React 18. Importing its components would mean upgrading this whole app. Instead
the game builds with its own toolchain into a static export and rabbit serves the result
as plain files — the two runtimes never meet. The game repo pre-arranged this: its
`next.config.ts` takes `EXPORT_STATIC=1` and `NEXT_PUBLIC_BASE_PATH=/jayverse-game`, and
pins its Turbopack root so that being checked out inside rabbit doesn't make it try to
compile rabbit.

**Why the bundle isn't committed.** A committed build drifts from the submodule commit and
then nobody knows which one is authoritative. Local runs `pnpm game:build`; Cloud Run runs
the same command inside the Dockerfile (`RUN pnpm game:build`, before `pnpm build`), from
the submodule sources that `gcloud run deploy --source .` uploads. So the deployed bundle
is always built from the submodule commit that was actually checked out.

**Two route details that bite if changed.** The export links to extensionless paths
(`/jayverse-game/street`), but `public/` only serves `street.html` — `next.config.js` has a
rewrite joining the two. And the game's assets live under `/jayverse-game/_next/static/…`,
which the middleware matcher's root-level `_next/static` exclusion does *not* cover; without
`jayverse-game/` in that matcher every asset request from a logged-out visitor redirects to
`/login` and the iframe renders blank.

## Working on it

```bash
git submodule update --init --recursive   # first checkout only
pnpm game:build                           # rebuild after pulling the submodule
pnpm dev                                  # /game
```

To pick up new game commits: `git -C games/jayverse-game pull origin main`, then commit the
moved submodule pointer here (`git add games/jayverse-game`) and rebuild.

`ALLOW_GAME=true` must be in `.env` for the menu to appear at all — `deploy.sh` forwards
every `ALLOW_*` to Cloud Run. The menu entry is `pub`, matching `/game`'s long-standing
presence in `middleware.ts`'s `PUBLIC_PATHS`: it's a spectator-only replay of a bundled
sample journal, with no wallet, no signing, and no owner data.

## Later

- Live mode — poll the running agent (`?since=<cursor>`) instead of the bundled replay.
  The game's README lists the live API shape as still open.
- Board quotes from the Verex API rather than the sample journal's snapshots.
- A `/poc` card pointing at `/game`, if the replay should show up in the PoCs hub too.
