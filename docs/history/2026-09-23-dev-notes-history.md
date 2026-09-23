# 2026-09-23 — Knowledge Notes (alice) dev notes

Source docs this day's work implements: [`docs/topics/README.md`](../topics/README.md) (the item
schema and the status model) and `alice:scripts/db-pending.sh`, which is the thing the second entry
below is about. Earlier entries from the same session sit in yesterday's file:
[`2026-09-22-dev-notes-history.md`](2026-09-22-dev-notes-history.md).

### Repeated items get rays around the rail dot

- **Cause:** jay, pointing at a rail dot: "Can we use the tickling dot as repeated which is great." An item read a second time on a later done-day already records a pass, and the rail already prints the count as a numeral, but nothing about the dot said *repeated* at a glance.
- **Reasoning:** the dot is drawn by the generator with its status colour as an **inline** style, so a stylesheet cannot see that colour and a hard-coded ray colour would have made every repeat look the same regardless of done / important / revisit. The rays are therefore a `::before` conic-gradient ring reading a `--ray` custom property, and a small pass at load copies each dot's computed background into that property. Injected from `docs/topics/_progress.js` rather than edited into pages, for the same reason the status overlay loads there: ~780 generated pages share it, so site-wide behaviour has exactly one home. Checked first with Playwright that the dot had no existing animation to collide with (`animationName: "none"`).
- **Change:** `docs/topics/_progress.js` adds the ring, the 6s rotation, a radial mask so the dot itself stays clean, `prefers-reduced-motion` opt-out, and nudges the count numeral from `left:11px` to `left:15px` so it clears the ring. Commit `498d1ee6`, merged as `a88c8933`.
- **Result:** rays mean "read at least once more", the numeral means "how many". Verified in Chrome with forced values — `--ray` resolved to the item's own green, animation `nav-dot-rays` running. No item carries `data-times` yet, so nothing shows rays on the live site until a repeat is drained in.

### The "refresh" button was doing something nobody could guess, and the status queue is now empty

- **Cause:** jay asked what the overlay's `refresh` button was for — "does it an item repeated?". It is not about repeats at all: it re-reads the Firestore pending queue and re-applies it, which matters only when a status was tapped on another device. A one-word label for a two-device operation taught the wrong thing.
- **Reasoning:** the queue is a queue, not a store — the built pages are the truth and Firestore holds only changes the repo has not folded in yet. So every document in it is by definition temporary, and leaving drained ones behind makes the overlay greet jay with "2 change(s) pending a rebuild" forever, i.e. trains him to ignore the one signal that says work is waiting.
- **Change:** the button is relabelled `re-read db` with a `title` that explains the other-device case (`docs/topics/_status.js`). Then the queue was drained and cleared: `english-22` had arrived that morning and was still unapplied, so `set-status.py` folded it in, and all three documents (`english-21`, `english-22`, `english-398`) were deleted from the `status` collection after a JSON backup of the whole collection was taken first.
- **Result:** 73 → 74 done, 8% · 74/941; `scripts/db-pending.sh` now prints "(empty — nothing waiting)". The `health/bundle` document stays — that is encrypted content, not a queue entry.
