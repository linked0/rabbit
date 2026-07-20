# Rabbit — Google Cloud × Solana "AI Agentic Hackathon" entry (Jul 20)

- **Event:** AI Agentic Hackathon — *Build the Future of Agentic Commerce* (Google Cloud × Solana Foundation)
- **Dates:** hacking 2026.07.17 – **08.03 (Mon) 23:59 submission** · Kickoff & Tech Session 07.21 (Tue, online) · **Demo Day 08.21 (Fri)**, Google for Startups Campus · prize pool $5,000
- **Source:** jay's request 2026-07-20 (LinkedIn post, official page: https://lnkd.in/gPx4AxGZ) — builds directly on [../../features/ap2-test.md](../../features/ap2-test.md) (x402 loop, mandates, rabbit-agent/rabbit-provider) and [../../features/solana.md](../../features/solana.md) (Anchor ladder; §2.3 stretch was exactly "x402-flavored tie-in").
- **Status:** idea + design (for review) — nothing implemented yet.

## 0. Idea (one line)

**CarrotPay** — an AI agent with its **own Solana wallet and a user-granted spend mandate** that
buys paid API data per-call (x402: request → 402 → pay USDC on devnet → retry → data), so a human
sets *policy once* ("0.5 USDC/week, this provider only") and the agent shops autonomously within it.

Pitch line: *"Agentic commerce needs an allowance, not a credit card."* The differentiator vs a
plain x402 demo is the **mandate**: cap + allowlist + audit trail, enforced outside the model —
first server-side, on-chain (PDA) as stretch.

Why this fits the judges: agent autonomy (Google's AP2 concept) + Solana settlement + deployed on
**Cloud Run** (already rabbit's deploy target, README §9) — both hosts' tech in one loop.

## 1. Scope — what we demo on Aug 3

A 3-minute loop, all live on devnet:

1. On `/ap2` (page exists as a stub), user grants the agent a mandate: **0.5 USDC cap, provider
   allowlist, 7-day window**. Budget bar renders.
2. User asks the chat agent: *"Get me the deep quote for market X."*
3. Agent calls `rabbit-provider` → **HTTP 402** (price 0.01 USDC, pay-to address, invoice id).
4. Agent checks the mandate, pays **0.01 devnet USDC** (SPL transfer, invoice id in the memo),
   retries with the tx signature → provider verifies on-chain → returns the data.
5. UI shows: answer, budget bar ticking down, payment log with Solana Explorer links.
6. Kill shot: ask for something **over the cap / off-allowlist** → agent refuses with the policy
   reason. (Judges always ask "what stops the agent overspending?" — answer it before they ask.)

**Out of scope (say no):** mainnet/real money, KRW on/off-ramp (Bridge-API Korea risk — see
ap2-test.md), multi-agent marketplaces, mobile.

## 2. Design

### Components

```
app/ap2 (UI: mandate form · budget bar · chat · payment log)
   │
   ▼
rabbit-agent  — Claude tool-use loop (claude-sonnet-5), server-side in app/api/agent
   tools: fetch_data(url) · pay_invoice(invoice) · check_mandate()
   │            402↑/data↓                 │ SPL transfer (memo=invoice id)
   ▼                                       ▼
rabbit-provider — app/api/provider      Solana devnet
   GET /quote → 402 {price, payTo,        agent keypair (server-held, devnet-only)
   invoiceId} · with X-Payment-Sig:       USDC = own SPL mint ("dUSDC", 6 dp)
   verify tx on-chain → 200 + data        faucet route mints test funds
```

- **Mandate (MVP): server-side** — Prisma table `Mandate {cap, spent, allowlist[], expiresAt}`;
  `pay_invoice` refuses when `spent + price > cap` or provider not allowlisted. Enforced in the
  tool implementation, **not** in the prompt.
- **Payment verify:** provider looks up the tx by signature (`getTransaction`), checks recipient
  ATA, amount, and memo == invoiceId, and that the signature wasn't used before (replay guard,
  one DB unique column).
- **Provider product:** premium market snapshot — reuse the public data plumbing from
  `/api/indices` / `/api/orderbook` so the "product" is real, not lorem ipsum.
- **Stretch — on-chain mandate (Anchor):** PDA `MandateAccount {cap, spent, allowlist}` +
  `spend()` instruction that CPIs the token transfer and enforces the cap on-chain; this is
  solana.md §2's escrow rung repurposed. Only start after W1–W6 are demoable.

### Key decisions

- **devnet + own SPL mint** instead of official devnet USDC — no faucet dependency, same code path.
- **Agent wallet is a server-held keypair** (env), *not* the user's Phantom — the whole point is
  the agent paying autonomously; the user's trust boundary is the mandate, not a signing popup.
- **Claude tool-use** (not LangChain etc.) — smallest loop, matches existing rabbit AI-chat work.

## 3. Work items

| # | Item | Size | Notes |
|---|------|------|-------|
| W0 | Register team + attend Kickoff/Tech session **Jul 21** | ½d | capture judging criteria → adjust this doc |
| W1 | Solana leg: devnet keypairs, dUSDC mint script, transfer + memo lib (`lib/solana.ts`) | 1d | `@solana/web3.js`; script in `scripts/` |
| W2 | rabbit-provider: 402 endpoint + on-chain verify + replay guard | 1d | `app/api/provider` |
| W3 | Mandate: Prisma model + enforcement lib + unit tests for cap/allowlist/expiry | ½d | tests here matter — it's the pitch |
| W4 | rabbit-agent: Claude tool-use loop with the 3 tools, refusal path | 1d | `app/api/agent` |
| W5 | `/ap2` UI: mandate form, budget bar, chat, payment log w/ Explorer links | 1d | replace stub page |
| W6 | Deploy to Cloud Run, end-to-end run on deployed URL | ½d | existing standalone build |
| W7 | Submission: 3-min demo video + README-style writeup + submit **by Aug 3** | 1d | record the §1 script incl. refusal |
| W8 | *(stretch)* Anchor mandate PDA program + swap enforcement to on-chain | 2d | only if W1–W6 done by ~Jul 29 |

~6.5 days core against a 2-week window — fits with slack for the unknown (first Solana code in
this repo). Suggested order: W1 → W2 → W4 → W3 → W5 → W6 → W7 (payment leg first; it has the
most unknowns).

## 4. Risks

- **First Solana code in the repo** — mitigation: W1 is isolated plumbing with a script harness;
  no Anchor/Rust in the core path (stretch only).
- **Devnet flakiness during demo** — record the video early (W7 start), keep a local
  `solana-test-validator` fallback profile.
- **Judging criteria unknown until kickoff** — W0 explicitly feeds back into this doc.
