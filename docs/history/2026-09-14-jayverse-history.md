# 2026-09-14 — Jayverse (hub)

> Source doc: [`../features/README.md`](../features/README.md) — the Jayverse feature-design hub
> (service table, phase overview, cloud split).

### Hub README: three end-to-end scenarios + one imaginary service each

- **Cause:** jay asked for "three great scenarios using all the Jayverse services, plus imaginary
  services I could create", written into the README.
- **Reasoning:** the per-service docs already carry single-service scenarios (Nari/LST, Jun/OFA);
  the missing view was cross-service — one story per *lens* (UX, invariants, time) so the same
  eleven services read differently each time, and so each story ends at a gap that motivates a
  candidate service rather than a twelfth product. Imaginary services are glue that holds no
  funds and reads what the existing services produce; each is placed on the existing cloud split.
- **Change:** new section "Three end-to-end scenarios" in `docs/features/README.md` (before Open
  Questions) + TOC entry: A "Mina's first evening" → `jayverse-passport` (attestations, rabbit
  cloud); B "The Saturday the market resolved" → `jayverse-watchtower` (invariant monitor with
  halt, verex cloud); C "Coach Han runs a tournament" → `jayverse-clock` (one Chainlink-Automation
  keeper for every time edge, verex trigger · rabbit UI). Closing comparison table.
- **Result:** working tree only, branch `claude/jayverse-scenarios` — uncommitted, awaiting jay's
  review. Open: whether any of the three candidates should move into the Dark Horse doc as a
  tracked track.
