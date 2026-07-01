# XYZ Demo (employer showcase)

**Goal:** one employer-facing page (`/xyz`) that bundles three demo items for the
**trade[XYZ] / Unit Labs — Sr. Software Engineer** spec, so a reviewer sees the whole story in
one click instead of hunting across `/portfolio` and `/ap2`. Theme: **data → monetized data →
on-chain data.** Each item still plugs into an existing rabbit surface; this page is the curated
front door.

## Live now — C2 searcher: submit a bundle (Sepolia) ✅
A working form at the top of `/xyz` (built 2026-07-01) submits a **bundle** to the **Flashbots
Sepolia relay** (`relay-sepolia.flashbots.net`). Enter `to` / `value` / gas, hit **번들 제출** →
the server simulates (`eth_callBundle`) then submits (`eth_sendBundle`), returning `bundleHash`,
target block, nonce, and the raw simulation.

**Security:** the signing key never touches the browser. `app/api/bundle/route.ts` (Node runtime,
**login-required**) reads `SEPOLIA_RPC` + `ADMIN_KEY` from env, signs with ethers v6, and talks to
the relay's JSON-RPC directly (no `@flashbots/ethers-provider-bundle` SDK → avoids the ethers-v5 peer
pin). Client `app/xyz/BundleSubmit.tsx` only posts form fields. Testnet only, keep `ADMIN_KEY` funded
with a little Sepolia ETH. Source design: **New First / C2** in
[../tasks/jul-01-rabbit-design.md](../tasks/jul-01-rabbit-design.md). Note: on Sepolia, inclusion
isn't guaranteed per block (needs a Flashbots-connected builder to win the slot) — resubmit as needed.

**Full walkthrough:** [c2-searcher.md](c2-searcher.md) explains what the sample does end-to-end
(bundle concept, sign → `eth_callBundle` sim → `eth_sendBundle`, the Flashbots auth header, security,
and how to run it).

## Live now — C4 PBS relay observer dashboard ✅
A working, **key-free** dashboard already shipped at `/xyz` (built 2026-07-01). It polls several
public relay **Data APIs** (`proposer_payload_delivered`) server-side and aggregates:
- **Builder market share** — delivered blocks grouped by `builder_pubkey` (deduped by `block_hash`).
- **Bid-value distribution** — min / median / avg / max of delivered payload value (ETH).
- **Per-relay latency + status** — Flashbots · bloXroute · Agnostic · Ultra Sound.
- **Recent delivered blocks** — slot, block, builder, value, tx count, which relay(s).

**Impl:** `app/api/relay/route.ts` (server proxy, `Promise.all` fan-out + 6s timeout per relay,
public via `middleware.ts`), `app/xyz/RelayDashboard.tsx` (client, 20s auto-refresh). Reference:
[flashbots/relayscan](https://github.com/flashbots/relayscan). Source design: **New First / C4** in
[../tasks/jul-01-rabbit-design.md](../tasks/jul-01-rabbit-design.md). Mainnet public data — no keys.

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
- [x] **C2 searcher bundle submit** — form at `/xyz` → Sepolia relay (`eth_callBundle`+`eth_sendBundle`), server-signed (2026-07-01)
- [x] **C4 relay observer dashboard** — live builder share / bid distribution / relay latency at `/xyz` (2026-07-01)
- [ ] **(you) Confirm scope** — full 3 items vs the 1+2 cut; showcase-links vs embedded panels
- [ ] **Item 1 — oracle/relayer** (Go service, signed feed, Prometheus/Grafana)
- [ ] **Item 2 — x402 pays for feed** (extend the AP2 loop to gate item 1's feed)
- [ ] **Item 3 — HIP-3 viewer/indexer** (testnet subscribe → Postgres → live panel)
- [ ] **`/xyz` page** — curated front door linking/embedding the three items

## Misc experiments (absorbed from ETC)
The old **ETC** catch-all was retired — its `/etc` slot was repurposed as **JayVerse**
([jayverse.md](jayverse.md)). Its small, low-stakes experiments live here now; keep them
deliberately small, and if one grows, **promote it** to its own menu + feature doc.
- [ ] **SimpleX Chat test** — try [SimpleX Chat](https://simplex.chat) (privacy-first messenger,
  no user IDs or phone numbers). Smallest cut: embed or link a SimpleX chat invite and confirm a
  message round-trips. Decide later whether it graduates to its own feature.
