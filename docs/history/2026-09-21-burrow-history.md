# 2026-09-21 — Burrow (Unity port of the 3D street)

Source docs this day's work implements:
[jayverse-burrow.md](../features/jayverse-burrow.md) (created today) ·
[jayverse-game.md](../features/jayverse-game.md) (the street's authoritative design) ·
[cloud-ops.md](../features/cloud-ops.md) §1 (the cost figures quoted in the hub table)

### Naming: repo `rabbit-hole`, site `burrow`

**Cause:** jay wanted a name from *Alice in Wonderland* for a Unity + Blender version of
jayverse-game, then found `rabbit-hole` "cumbersome" as a URL.
**Reasoning:** `rabbit-hole` collides with `~/work/rabbit` on tab-completion and carries a hyphen;
`burrow` is shorter, unhyphenated, still unmistakably the same idea. But `linked0/rabbit-hole`
already existed (created 2026-06-18, described as a sample Unity WebGL game, since superseded in
`rabbit/.gitmodules` by `jayverse-game`), so renaming it would have thrown away a repo that was
already the right one. jay settled it: **repo keeps `rabbit-hole`, `burrow` is the site name**.
**Change:** local checkout `~/work/rabbit-hole` wired to `linked0/rabbit-hole`; Unity product name
and C# namespace follow the site (`Burrow`); the split is stated at the top of the repo README.
**Result:** no repo rename, no redirect, one name per audience.

### Unity port of jayverse-game, built and browser-verified

**Cause:** jay asked for a simple Unity project based on jayverse-game, targeting a WebGL build.
**Reasoning:** kept the web build's hard rule — zero downloaded 3D assets, everything is a
Cube/Sphere/Capsule/Plane plus TextMesh — so the project clones and runs offline. The scene file is
deliberately empty and the street is generated at runtime from the journal's market list, so a run
with four boards or nine needs no editor work. HUD is IMGUI to avoid a uGUI canvas and TextMeshPro.
**Change:** eight scripts porting `journal.ts`, `player.ts`, `Scene.tsx`, `Board.tsx`, `Agent.tsx`,
`Overlay.tsx` and the replay half of `GameClient.tsx`, plus a one-command WebGL build script.
Ported the Weekend MVP scope; settlement flow, space jump, Jay/dancer, search fly-to and live
polling are documented as deferred.
**Result:** 5 MB WebGL build, ~20 s, verified in real Chrome against the served bundle — street
renders, replay advances, **0 console errors**. Nothing committed yet.

### Editor checks prove the data, not the build — four player-only bugs

**Cause:** the Unity editor compiled clean and a headless data check passed while the actual WebGL
build was still a black screen.
**Reasoning:** worth recording as a class of bug, not four incidents: everything below is invisible
until IL2CPP strips the build and a browser runs it. Two of them would have shipped a black screen.
**Change:** (1) `Shader.Find("Standard")` returns null in a build — an unreferenced built-in shader
is stripped — so Standard is now pinned in `GraphicsSettings.asset`'s `m_AlwaysIncludedShaders`;
(2) IL2CPP strips the concrete collider types while `CreatePrimitive` still tries to attach one,
giving 76 errors on load — fixed with `Assets/link.xml`; (3) the playhead advanced *between*
IMGUI's Layout and Repaint passes, changing the conditional control count and tearing the HUD down
— fixed by latching the tick on `EventType.Layout`; (4) trimming `animation`/`ui`/`uielements` from
the manifest broke the built-in `GUISkin`, so those modules stay.
**Result:** clean build, clean console. Also: `JsonUtility` does not leave an absent object field
null — it builds a blank instance, so every tick arrived with a non-null `fill` of `0 @ 0`,
contradicting the TS `fill?`. `Journal.Normalize()` undoes it; verified 3 buys → exactly 3 fills.

### Verification harness: count console errors across more than one repaint

**Cause:** the first browser check reported "0 errors" on a build that was throwing ~4,000.
**Reasoning:** that check took a single screenshot. The IMGUI bug only fires on repaint, so one
repaint hid it. This is the reusable lesson for any future Unity service here.
**Change:** the harness now boots the build, waits, and screenshots several times across the run,
tallying console errors by frequency rather than eyeballing a tail.
**Result:** surfaced the 1281× IMGUI exception and the 333× `class ID 115` that the single-shot
version missed. Playwright lives in the session scratchpad, not in the repo.

### Hub table: second detail doc, Burrow URL, and a cost column

**Cause:** jay asked for the #7 row to carry a second detail file, and for the estimated GCP bill
from cloud-ops.md to appear in the per-service table.
**Reasoning:** apportioning the estate estimate to the service that causes it answers "which
service is the expensive one" at a glance — but it is derived from resource configuration, not
billing data, and ~$30/month of the real ~$120 is still unaccounted for, so the column carries that
caveat rather than reading as an invoice.
**Change:** `features/README.md` row 7 now links [jayverse-burrow.md](../features/jayverse-burrow.md)
alongside jayverse-game.md and names both surfaces; new **Est. GCP cost / month** column across all
ten rows; `rabbit/lib/jayverse.ts` points the "Game — 3D street" chip at `https://burrow.jaylabs.xyz`.
**Result:** Burrow is ~$0 — static files inside the Cloud Run `rabbit` service that already scales
to zero. **The chip is a dead link until the domain mapping exists** (see jayverse-burrow.md §1b).
