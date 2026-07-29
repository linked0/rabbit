# 2026-07-29 — rabbit history

> Source docs: none — direct chat request from jay (no task/design file).

### VerexBall: spin 30% faster

jay asked for the featured-card Verex ball to rotate ~30% faster. `app/home/VerexBall.tsx`
frame-loop increment went `delta * 0.5` → `delta * 0.65` rad/s; after an eyeball check
jay asked for a bit more → settled at `0.75` (one turn ≈ 8.4s, was 12.6s). Verified on the running
dev server (:3100, hot-reloaded): ball renders and animates, no console errors. On branch
`claude/ball-spin-speed`, left uncommitted for review.
