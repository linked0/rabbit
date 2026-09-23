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

### Live at rabbit-hole.web.app, custom domain validating

**Cause:** jay, 2026-09-23: "go" — the full green light, DNS included.

**Reasoning:** followed yesterday's `jayverse-game` recipe rather than inventing a second one —
same GCP project (`doubletree-498007`), Firebase Hosting site, deploy through the Hosting REST
API, custom domain with CNAME + `_acme-challenge` TXT in the `jaylabs-xyz` zone. The one place
Unity differs from a Next export is compression, and it cost a prediction: `.unityweb` files are
already gzip, so the version config asked for `Content-Encoding: gzip` on them. **Firebase strips
that header** — it manages transport encoding itself and will not let a config set it. The
`Content-Type` rules in the same block did apply.

**Change:** repo `linked0/rabbit-hole` got its first real commit (54 files, 123 KB — `/Build/`
stays ignored) rebased onto the empty `Initial commit` GitHub made in June. Firebase site
`rabbit-hole` created; 18 files deployed; `hole.jaylabs.xyz` registered as a custom domain and
both DNS records added. `lib/jayverse.ts` gained a **ninth** card — a sibling of the `game` one,
not a replacement, per D2a.

**Result:** `rabbit-hole.web.app` returns 200 and the game runs — headless Chrome shows the
street, the boards, the agent, the journal panel, playback reaching tick 22/22, and **0 console
errors**. Unity logs three "you can reduce startup time" notices and falls back to decompressing
in JavaScript, which is the cost of the stripped header: it works, it is just slower to start.
Worth knowing before optimising: the fix is a Unity rebuild with compression **disabled**, letting
Firebase apply its own gzip, not a header config — that avenue is closed. The certificate for
`hole.jaylabs.xyz` was still validating at the time of writing. Also still true: the Unity player
name is `burrow`, so the browser tab reads "Unity Web Player | burrow".
