# Number — math & investment, split out of Rabbit's Portfolio

*Jayverse service #9 (added 2026-09-10, jay). **Design draft** — captures jay's decision to lift
Portfolio out of Rabbit into its own standalone, admin-only project. Sibling docs indexed in
[README.md](README.md).*

---

## The decision

Portfolio no longer belongs inside Rabbit. Rabbit is the **public** portal (portfolio site + PoC
demos, anonymous visitors welcome); the money/investment surface is **private** and personal, so
mixing the two forced one app to be both public-read and admin-only at once. The split resolves that:

- **New repo:** `jayverse-number` (sibling under `~/work`, like every other service).
- **Domain:** `number.jaylabs.xyz`.
- **Audience:** **admin only** — the whole site is login-gated (jay's Google account, same
  `ALLOWED_EMAILS` owner model Rabbit already uses). There is no public read surface.
- **Hosting:** the **rabbit GCP instance/project** (Cloud Run, asia-northeast1) — same project,
  its own Cloud Run service and its own `deploy.sh`, per the "one portal, many backends" rule in
  [README.md](README.md).
- **UI:** the **same basic shell as Rabbit** (Next.js App Router, the shared Nav/theme/lang
  toggles, shadcn tokens) so it feels like part of the family without Rabbit having to carry it.

## What it is for

A private workbench for **investment information plus research** — three strands:

1. **Investment information** — the portfolio/holdings/trade views that used to live in Rabbit
   (`/portfolio`, `/invest`, `/dashboard`, `/simulate`, the `api/trades` + `api/portfolio` routes).
2. **Math & economy research** — the quantitative notes (pricing, rates, market-microstructure
   math) that were drafted as Rabbit docs but are really investment-facing.
3. **Algorithm research** — strategy/algorithm experiments (backtests, signal studies) that only
   make sense behind a login.

## Migration out of Rabbit

Rabbit's Portfolio footprint (to move, not duplicate): the `/portfolio`, `/invest`, `/dashboard`,
`/simulate` routes, the `api/portfolio` + `api/trades` handlers, `Dashboard.tsx`, and the
`PORTFOLIO` Nav entry. The Nav entry is removed from Rabbit first (visible change, low risk); the
route/code removal follows once `jayverse-number` actually hosts them, so nothing goes dark in
between.

## Status

Design draft. **Not yet scaffolded** — the repo, the auth gate, the deploy target, and the code
migration are the build steps, to be picked up as a focused effort. `pnpm dev` port **:3090** is
reserved by the `3000 + #×10` rule.
