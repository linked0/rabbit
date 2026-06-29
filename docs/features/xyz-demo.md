# XYZ Demo (employer showcase)

**Goal:** one employer-facing page (`/xyz`) that bundles three demo items for the
**trade[XYZ] / Unit Labs — Sr. Software Engineer** spec, so a reviewer sees the whole story in
one click instead of hunting across `/portfolio` and `/ap2`. Theme: **data → monetized data →
on-chain data.** Each item still plugs into an existing rabbit surface; this page is the curated
front door.

## The three items
### 1. Price-oracle + relayer mini-service
Small **Go** service: pulls real-time prices for ~3 assets (one equity, one FX pair, one
commodity — mirroring XYZ's markets), medianizes multiple sources, exposes a **signed** price
feed over HTTP/WebSocket. **Prometheus** metrics + a **Grafana** panel.
- **Spec bullets:** "oracles, relayers… real-time data integrations, internal pricing… 24/7
  trading of global markets"; stack = Go, Prometheus, Grafana.
- **Also feeds:** Market zone of `/portfolio`.
- **Est.** 1–2d.

### 2. x402 "agent pays for the price feed"
Reframe rabbit's AP2/x402 loop so the paid resource is item 1's oracle feed: agent requests
price → `402 Payment Required` → pays → receives signed quote → retries.
- **Spec bullets:** "price feeds, data pipelines, real-time data systems"; 0→1; shows working,
  deployed code.
- **Also extends:** [ap2-test.md](ap2-test.md) (`/ap2`).
- **Est.** 1d.

### 3. Hyperliquid HIP-3 market viewer + indexer
Read-only indexer subscribing to a Hyperliquid **testnet** HIP-3 perp market; indexes
trades/funding into **Postgres** (Prisma) with reconnect + gap-backfill; renders a live
order-book/funding panel.
- **Spec bullets:** "consensus mechanisms and indexing systems for complex on-chain data";
  "fault-tolerant distributed systems"; blockchain (EVM/Solana/BTC) + trading familiarity.
- **Also feeds:** a panel in `/portfolio`; reuses the Cloud SQL Postgres from roadmap S6.
- **Est.** 2–3d.

## Suggested demo cut
If time is short, ship **1 + 2** end-to-end — one "priced data, paid for by an agent" story that
hits the oracle, pricing, Go, and 0→1 bullets most directly. Item 3 is the strongest *blockchain*
signal but the heaviest; pull it in only if the Hyperliquid testnet integration lands cleanly.

## Open questions
- Is `/xyz` a **showcase page** that links to the live oracle/Grafana/indexer, or does it embed
  each panel inline? (Showcase-with-links is the cheaper first cut.)
- Which exact 3 assets for item 1 (equity / FX / commodity)?
- Gate behind login, or leave public so the employer can open it without an account?

## Features
- [ ] **(you) Confirm scope** — full 3 items vs the 1+2 cut; showcase-links vs embedded panels
- [ ] **Item 1 — oracle/relayer** (Go service, signed feed, Prometheus/Grafana)
- [ ] **Item 2 — x402 pays for feed** (extend the AP2 loop to gate item 1's feed)
- [ ] **Item 3 — HIP-3 viewer/indexer** (testnet subscribe → Postgres → live panel)
- [ ] **`/xyz` page** — curated front door linking/embedding the three items
