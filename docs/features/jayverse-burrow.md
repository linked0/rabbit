# Burrow — the Unity (WebGL) build of the 3D street

*Service #7's second surface. The Next.js + react-three-fiber street stays as it is and keeps
living inside Cloud Run `rabbit` at `/jayverse-game`; **Burrow** is the same run rendered by
Unity, aimed at **`burrow.jaylabs.xyz`**. Product and scenario design for #7 lives in
[jayverse-game.md](jayverse-game.md) — that file is still authoritative for what the street means.
This one is only about the Unity port: what exists, what it cost to get working, and what is left.*

*Started 2026-09-21 (jay + session). Naming settled the same day: the **GitHub repo stays
`linked0/rabbit-hole`** (it already existed, created 2026-06-18 for exactly this) and **`burrow`
is the site name only**. Local checkout is `~/work/rabbit-hole`.*

---

## 0. Summary — where this is right now

**Built and verified; not deployed.** The Unity port runs end to end as a WebGL build with a
clean console, driven by the same `sample-journal.json` the web build ships, byte for byte.

| | |
|---|---|
| Repo | `linked0/rabbit-hole` (private) · local `~/work/rabbit-hole` |
| Site (planned) | `burrow.jaylabs.xyz` |
| Editor | Unity **6000.4.3f1**, Built-in Render Pipeline, legacy Input Manager |
| Build | WebGL, **5 MB**, ~20 s, gzip + `decompressionFallback` |
| Verified | headless Chrome against the real build: street renders, replay runs, **0 console errors** |
| Committed | **nothing yet** — the working tree is waiting on review |

Ported: the street, the boards, the agent, the full replay transport, the journal panel — the same
Weekend MVP scope the web build shipped. Not ported: settlement flow and gate interaction, space
jump, Jay and the street dancer, market search fly-to, live journal polling.

---

## 1. What jay needs to prepare

Four things, none of which the session can do on its own. Roughly in order.

**a. Decide how the bundle reaches the `rabbit` image.** This is the real open question, and it
blocks deployment. The existing street is a git submodule at `games/jayverse-game` that
`scripts/build-game.mjs` builds into `public/jayverse-game/` during `docker build`. **That pattern
cannot be copied as-is**: building Unity WebGL needs the Unity editor and a licence inside the
build image, which is a heavy thing to add for a demo estate. Three workable options:

| Option | What it means | Cost of it |
|---|---|---|
| **Commit the build output** (recommended) | `Build/WebGL/` stops being gitignored in `rabbit-hole`; `rabbit` copies it from the submodule like today | 5 MB of binaries per rebuild in git history |
| Build in CI | GitHub Actions with a Unity licence secret, publishes the bundle as an artifact or to GCS | a licence in CI, a new pipeline to maintain |
| Serve separately | its own Cloud Run service or a GCS bucket behind `burrow.jaylabs.xyz` | one more service in an estate we are trying to shrink |

Recommendation is **commit the build output**: under decision 0 (demo estate) it is the cheapest
path to a working URL, and it keeps `burrow.jaylabs.xyz` inside the existing `rabbit` service so
the cost stays at zero. Say the word and the `.gitignore` line comes back out.

**b. A DNS record + Cloud Run domain mapping for `burrow.jaylabs.xyz`** in `doubletree-498007`,
zone `jaylabs-xyz`, region asia-northeast1, pointing at the existing `rabbit` service — the same
shape as the other five Cloud Run hostnames. `gcloud` **is** authenticated here
(`linked0@gmail.com`, currently pointed at `verex-499205`), so this is a decision to approve
rather than access to arrange — but there is no point mapping a hostname until (a) puts something
behind it.

**c. Confirm the `rabbit` app should serve it.** The chip change in `lib/jayverse.ts` already
points "Game — 3D street" at `https://burrow.jaylabs.xyz`, so **the chip is a dead link until (b)
is done**. If the answer is "not yet", revert that one line and nothing else moves.

**d. Push rights / a decision on the 5 MB.** Nothing is committed anywhere yet — in
`rabbit-hole`, in `rabbit`, or here.

## 2. What the session does after that

1. **Wire the bundle in.** Add `rabbit-hole` as a submodule at `games/rabbit-hole`, extend
   `scripts/build-game.mjs` (or add a sibling) to copy `Build/WebGL/` into `public/burrow/`, and
   add the two `next.config.js` rewrites the existing street already needs for extensionless paths.
2. **Deploy to Cloud Run `rabbit`** and attach the domain mapping.
3. **Verify the live URL the same way it was verified locally** — headless Chrome against
   `burrow.jaylabs.xyz`, asserting the street renders, the replay advances, and the console is
   clean. A build report saying "OK" is not evidence the page works; see §4.
4. **Set gzip headers properly.** The build ships gzip with `decompressionFallback` on, which
   works from any host but wastes a decompress in JS. Once Cloud Run is confirmed to send
   `Content-Encoding: gzip`, drop the fallback and note it here.
5. **Update this file and the hub row** with the live URL and what the first real load looked like.

---

## 3. Cost

**No change to the bill.** Burrow is static files inside the existing Cloud Run `rabbit` service,
which already scales to zero and is already paid for — see
[cloud-ops.md §1](cloud-ops.md#1-cost-posture--pay-for-what-is-being-watched-park-the-rest).
One more domain mapping and ~5 MB of static assets cost nothing measurable.

The only way this grows the bill is option (c) in §1a — giving Burrow its own Cloud Run service —
which would add a service to an estate that [decision 8](cloud-ops.md) deliberately keeps small.
It would still scale to zero, so the marginal cost is build/deploy minutes, not compute.

---

## 4. What the port had to change, and what that cost

Recorded because each one is a trap the next Unity service will hit too.

**Handedness.** three.js is right-handed and walks the street toward **negative z**; Unity is
left-handed with +z into the screen. Every z is mirrored, so the street runs toward **positive z**.
Sides (x) and heights (y) are untouched, so `StreetLayout.cs` still reads one-to-one against
`lib/player.ts`.

**`JsonUtility` has no concept of an absent field.** Unlike `JSON.parse`, it does not leave an
omitted object field null — it constructs a blank instance. Straight out of `FromJson` every tick
had a non-null `fill` of `0 @ 0` and a non-null empty `evidence`, silently contradicting the
`fill?` / `evidence?` optionality of the TypeScript types the model mirrors. `Journal.Normalize()`
undoes it. Caught by a headless parse check, not by reading the code.

**Four bugs that only exist in a player build.** The editor compiled clean and the data checks
passed while the actual WebGL build was still broken:

| Symptom | Cause | Fix |
|---|---|---|
| Black screen, `ArgumentNullException: shader` | `Shader.Find("Standard")` returns null in a build — an unreferenced built-in shader is stripped | pin Standard in `GraphicsSettings.asset` → `m_AlwaysIncludedShaders` |
| 76 × `Can't add component because class 'BoxCollider' doesn't exist!` | IL2CPP strips the concrete collider types; `CreatePrimitive` always tries to attach one | `Assets/link.xml` preserving the four collider types |
| HUD collapses, 1281 × `Getting control 2's position in a group with only 2 controls` | the playhead advanced *between* IMGUI's Layout and Repaint passes, changing the conditional control count | latch the tick on `EventType.Layout` |
| `Could not produce class with ID 115`, `Copied style is null` | removing `com.unity.modules.animation`/`ui`/`uielements` broke the built-in `GUISkin` | keep those modules; trim elsewhere |

**The lesson worth keeping:** an editor-side check proves the data and the maths, and proves
nothing about the build. Two of the four above would have shipped a black screen to
`burrow.jaylabs.xyz`. The verification loop that caught them — build WebGL headless, serve it,
drive it in real Chrome, and **count console errors across more than one repaint** — is the one to
reuse. The single-screenshot version of that harness reported "0 errors" on a build that was
throwing 4,000; it took repeated repaints to surface the IMGUI bug.

---

## 5. Open

- **§1a is unanswered** — how the bundle reaches the image. Everything else waits on it.
- **Live polling.** Replay only, as in the web build. The endpoint shape
  (`GET /api/agent/journal?since=<cursor>`) is still the open question it is in
  [jayverse-game.md](jayverse-game.md) §7.
- **Whether Burrow replaces or sits beside `/jayverse-game`.** Right now both exist and the hub
  chip points at Burrow. Two surfaces for one service is a thing to decide, not drift into.
- **Blender.** Not installed, and not needed yet: the port is all primitives, like the web build.
  It becomes relevant the first time a modelled asset is wanted — see the note in the hub row.
