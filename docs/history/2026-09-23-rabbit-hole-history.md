# 2026-09-23 — rabbit-hole

Source docs: [`../features/jayverse-burrow.md`](../features/jayverse-burrow.md) and
[`../tasks/current-plan.md` D2](../tasks/current-plan.md#decide).

### The Unity port's site becomes hole.jaylabs.xyz

**Cause:** jay, 2026-09-23: "I will use hole for rabbit hole project first and think about what
your concerns later." The site name had been **Burrow** since 2026-09-21, deliberately split from
the repo name `rabbit-hole`.

**Reasoning:** jay's goal is one word shared by the repo and the site, and `hole` is the repo
name's tail. The case against was raised and parked, not rejected: standing alone, `hole` carries
none of the "rabbit hole" idiom — the phrase means what it means *because* of the rabbit, and a
bare `hole` reads thin in English, with a few unfortunate senses attached. `rabbithole.jaylabs.xyz`
was offered as the option that keeps both the idiom and the repo match. jay chose `hole` and will
revisit; the cost of revisiting stays near zero while no DNS record exists.

**Change:** 13 occurrences of `burrow.jaylabs.xyz` swapped for `hole.jaylabs.xyz` across
`features/jayverse-burrow.md` (8), `features/README.md`, `tasks/current-plan.md` (2), the
rabbit-hole `README.md` (2) and `Assets/Editor/BuildWebGL.cs`. The two history files that mention
the old host were left alone — history is append-only, and the dead host is part of what happened.
`lib/jayverse.ts` keeps its note that the chip *used to* point at `burrow.jaylabs.xyz`, which is
still true.

**Result:** no live reference to the old host remains. D2 in the plan doc was rewritten on the way:
its old framing ("how the bundle reaches the rabbit image") died when the three.js game shipped to
Firebase Hosting at `game.jaylabs.xyz`, making that the house pattern alongside `defi.` and
`verex.`. Still open — whether the Unity build sits beside that game or replaces it, and whether
the product name "Burrow" follows the URL into retirement, since nothing points at it now.
