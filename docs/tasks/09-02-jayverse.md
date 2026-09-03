# Overview
- Started at 2026-09-03 13:01:09 KST
- Called `Jayverse`
- Contains all the blockchain related service like Prediction Market, NFT market, DeFi service etc.
- Source: hand-drawn architecture diagram (2026-09-03). Center hub = L1/L2 + CCIP settlement
  rails; every service is a spoke on that hub. Agentic AI (LLM + ERC-7702/7710/7715 + Agent
  Commerce Layer) sits on top of Rabbit Portal.
- This file is a brainstorming/communication doc — each service gets ~10 lines of
  considerations (repo, skills, steps, subtasks). Detailed per-service docs come later.

# How to implement the services with multiple coding agents
- How to maintain the github repos
- Rabbit can contain some services
- The services should run on verex or rabbit goggle cloud
- **Policy (jay, 2026-09-03): one repo per service.** Implementations reside in each service's
  own repo — agents changing the same repo gets messy (2026-09-02's two-agents-one-worktree
  collision is the cautionary tale). Each repo has one representative agent; contracts live
  beside their service, not in a shared monorepo.
- **Rabbit imports, it doesn't contain.** Rabbit shows a service by importing its git repo
  (npm package or git submodule for UI pieces; plain links/proxy for running services) —
  the implementation never moves into rabbit.
- Shared infra to decide once, early: chain (Base + local supersim), wallet SDK, indexer
  (Ponder), and a single `addresses.json` published from the `jayverse-rails` config package.

## Repo / agent / cloud map

| # | Service | Repo | Representative agent | GCP project |
| --- | --- | --- | --- | --- |
| — | Settlement Rails (shared infra) | `jayverse-rails` (config pkg only) | rails-agent | n/a — npm package, no runtime |
| 1 | Rabbit as Portal | `rabbit` (existing) | rabbit-agent | rabbit cloud |
| 2 | Verex prediction market | `verex` (existing) | verex-agent | verex cloud |
| 3 | DeFi | `jayverse-defi` | defi-agent | verex cloud |
| 4 | Persona market | `jayverse-personas` | persona-agent | rabbit cloud |
| 5 | Unity game (+ market-bridge worker) | `jayverse-game` | game-agent | verex cloud (worker; game client ships to stores/web) |
| 6 | Wallet & Simulation service | `jayverse-wallet` | wallet-agent | rabbit cloud |
| 7 | Intra Jayverse Bridge | `jayverse-bridge` | bridge-agent | verex cloud |
| 8 | L2 (lab) | `jayverse-l2-lab` (notes + scripts) | l2-agent | local only (supersim) until go/no-go |
| 9 | Authority Auditor | `jayverse-auditor` | auditor-agent | rabbit cloud |

- Cloud split logic: money-moving/market-coupled services (#2 #3 #5 #7) on **verex cloud**;
  portal/AI/read-only services (#1 #4 #6 #9) on **rabbit cloud** — 4 : 4, #8 stays local.

# Services

## Settlement Rails — shared infra (we USE this, we don't build it)
- L1/L2 (Base mainnet + Base Sepolia, local supersim for labs), CCIP for anything cross-chain,
  USDC as the settlement unit. Every service below settles here; none of them re-implements it.
- Decisions to make once: home chain, which CCIP lanes we enable, and a shared address book.
- The only artifact we own: the `jayverse-rails` TS config package (chain configs, addresses,
  viem clients) that every app imports — plumbing, not a product.
- PoC links: `receipt-is-not-settlement`, `l2-finality-three-clocks`, `the-settlement-instant`.

## 1. Rabbit as Portal
- **What**: the front door of Jayverse and the home of **Agentic AI** — LLM agent that holds scoped permissions (ERC-7702/7710/7715) and buys via the Agent Commerce Layer (x402).
- **Repo**: existing `rabbit` (Next.js) — portal UI + agent console stay here; agent's on-chain permission contracts live in `jayverse-wallet` (the wallet repo owns key/permission code).
- **Skills**: Next.js/TS (have), Claude API/agent harness (have), ERC-7702 EOA delegation, ERC-7715 `wallet_grantPermissions`, x402 client middleware.
- **Depends on**: Wallet service (agent treasury), Settlement Rails (payments).
- **Steps**: 1) give the agent a wallet with one scoped session key (spend cap + allowed contracts); 2) let it call one paid x402 endpoint end-to-end; 3) surface every agent action in the portal UI with its permission proof; 4) grow the permission set per service.
- **Subtasks**: permission schema doc (who grants, who revokes); agent action log page; x402 client; 7702 vs 4337 decision memo; kill-switch.
- **Risk**: the agent is the highest-authority component — the Authority Auditor should audit Rabbit first.
- **Rails**: the Agent Commerce Layer settles x402 payments in USDC over the shared rails; a cross-chain payment rides CCIP — never a custom transfer path.
- **PoC links**: `x402-facilitator-market`, `agentic-intent-veto`, `walletconnect-session-authority`.

## 2. Verex as Prediction Market
- **What**: the flagship — prediction market, upgraded per the diagram with AA (ERC-4337), a UMA-style optimistic oracle for resolution, and an MCP server so agents can trade it.
- **Repo**: existing `verex` repo; market contracts stay in `verex` beside the app (one repo per service).
- **Skills**: existing verex stack (have), ERC-4337 bundler/paymaster flow, UMA optimistic-oracle assertion/dispute pattern, MCP server authoring (stateless 2026-07-28 spec).
- **Depends on**: Settlement Rails (collateral), Wallet (user smart accounts), Oracle choice.
- **Steps**: 1) wrap market entry in a 4337 smart account so users get gasless one-click bets; 2) replace admin resolution with an optimistic oracle + dispute window; 3) expose `verex-mcp` (list markets, quote, bet) consumed by Rabbit's agent; 4) meta-market: "which Jayverse service ships next".
- **Subtasks**: paymaster budget policy; oracle liveness/dispute runbook; MCP tool schema; agent-vs-human market-integrity note.
- **Risk**: oracle disputes are the product's trust core — design the dispute path before the happy path.
- **Rails**: collateral is USDC on the home chain; cross-chain market entry (if ever) comes via a CCIP lane, not a Verex-owned bridge.
- **PoC links**: `decision-market-uncontrollability`, `bundler-paymaster-dependencies`, `mcp-three-sides`.

## 3. DeFi
- **What**: yield/restaking corner of the diagram (EtherFi node) — start as a read-only dashboard over restaking positions, only later custody anything.
- **Repo**: new thin app repo `jayverse-defi` (or a page inside rabbit until it earns a repo).
- **Skills**: DeFi protocol reading (EtherFi/LRT mechanics, where yield actually comes from), Ponder indexing, viem; later vault patterns (ERC-4626).
- **Depends on**: Settlement Rails, Wallet; independent of Verex/Unity.
- **Steps**: 1) read-only: index one EtherFi position and render yield decomposition (staking vs restaking vs points); 2) simulate deposits via the Wallet's simulate-before-sign; 3) only then consider an ERC-4626 wrapper vault on our rails.
- **Subtasks**: yield-source table per protocol; risk labels (slashing, depeg, exit queue); position indexer; decision memo "aggregate vs originate".
- **Risk**: custody of user funds is a different business than everything else here — keep read-only as long as possible.
- **PoC links**: `where-yield-comes-from`, `lp-is-a-short-volatility-position`, `risk-free-rate-is-the-floor`.

## 4. Persona market as NFT market
- **What**: NFT marketplace whose first asset is real utility — openclone AI personas, mintable/rentable, talkable.
- **Repo**: `jayverse-personas` — app and contracts (ERC-721 + ERC-4907 rental) together, one repo per service; reuse `~/.claude/skills/openclone` runtime.
- **Skills**: ERC-721/4907, token-gated access (sign-in-with-Ethereum), openclone internals (have), IPFS/metadata hygiene.
- **Depends on**: Settlement Rails (payments), Wallet (mint/rent UX); optional Rabbit agent as a persona buyer.
- **Steps**: 1) mint one persona NFT whose holder can chat with it (token-gated); 2) add ERC-4907 rentals (rent a persona for a day); 3) open creator flow from openclone's `new`; 4) list on the market with x402-priced chat as ongoing revenue.
- **Subtasks**: persona knowledge licensing note (who owns ingested content); token-gate middleware; rental pricing experiment; royalty policy.
- **Risk**: IP/likeness of real-person clones — market only original or clearly-parody personas.
- **Rails**: mint/rent payments settle in USDC over the shared rails; x402 chat revenue uses the same path as the Agent Commerce Layer.
- **PoC links**: `st-self-distribution`, `the-only-commitment-is-the-issuer` (utility claim framing).

## 5. Unity
- **What**: blockchain-connected Unity game, wired to Verex via the **Game ↔ Market bridge** — match outcomes and drop rates become markets; items settle on our rails.
- **Repo**: new `jayverse-game` (Unity, C#); bridge service as a small TS worker beside verex.
- **Skills**: Unity/C# (new for us — biggest skill gap in the diagram), wallet-in-game UX (embedded wallet SDK), event signing/attestation for game results.
- **Depends on**: Verex (markets), Settlement Rails/L2 (items), Wallet (player accounts).
- **Steps**: 1) tiny game loop first (one score, one item); 2) sign game results server-side and post as oracle input for a Verex market; 3) mint items as NFTs on the rails; 4) close the loop — winnings buy items.
- **Subtasks**: pick the minimal game genre; result-attestation design (anti-cheat = oracle integrity); embedded-wallet-in-Unity spike; market templates for game events.
- **Risk**: game dev is a time sink with different muscles — timebox the first playable to weeks, not months.
- **Rails**: items and purchases settle on the shared rails (home chain first); no game-specific payment path.
- **PoC links**: `simulate-before-sign` (item trades), `arb-bots-are-the-peg` (in-game economy pricing).

## 6. Wallet & Simulation-before-sign as a service
- **What**: the shared glue — embedded-wallet UX for every Jayverse app plus a simulation API/widget that decodes any transaction's effect before the prompt.
- **Repo**: `jayverse-wallet` (SDK package + small API service); consumed by rabbit, verex, personas, game.
- **Skills**: embedded-wallet provider integration (Privy learnings from the PoC), viem `simulateContract`/state-override, 4337/7702, custom-error decoding.
- **Depends on**: Settlement Rails only — everything else depends on *it*, so build early.
- **Steps**: 1) pick provider vs self-managed keys using the four-path test (new device, lost factor, export, scoped signer); 2) ship `simulate()` returning decoded effects + warnings; 3) one drop-in React component (connect, preview, sign); 4) publish the authority matrix of our own config.
- **Subtasks**: provider decision memo; simulation API with fork-backed state; warning taxonomy (revert, approval widening, value drain); per-app session-key policy templates.
- **Risk**: our config choices become every user's custody reality — the embedded-wallet card's lesson applies to us now.
- **PoC links**: `embedded-wallet-policy`, `simulate-before-sign`, `pick-a-signer-not-a-brand`.

## 7. Intra Jayverse Bridge
- **What**: internal value movement between services — Verex winnings buy a persona, game items collateralize a bet — one ledger view across the umbrella.
- **Repo**: `jayverse-bridge` — vault/credit contracts + reconciliation worker in one repo; not a public bridge product.
- **Skills**: accounting-style invariants (every credit backed 1:1 in the vault), CCIP if services ever live on different chains, idempotent transfer workers.
- **Depends on**: Settlement Rails (it is basically rails + bookkeeping); at least two live services to bridge.
- **Steps**: 1) define the unit (USDC balance in the shared vault, no new token); 2) internal transfer API with idempotency keys; 3) per-service earmarking + one reconciliation job; 4) only add CCIP when a service actually leaves the home chain.
- **Subtasks**: ledger schema; reconciliation cron + alert; abuse limits (rate/size); "no new token" decision recorded.
- **Risk**: this is where double-spend bugs would live — invariant tests before features, always.
- **Rails**: transport for any cross-chain leg is CCIP; we implement only the ledger, earmarking, and reconciliation on top.
- **PoC links**: `x402-settlement-retry` (retry semantics), `the-bridge-is-inside-the-token`, `rwa-multichain`.

## 8. L2
- **What**: our own chain ambition — explicitly marked **start at last** in the diagram, with **supersim** as the local on-ramp.
- **Repo**: none yet — a `docs/` research folder first; infra-as-code repo only if we truly commit.
- **Skills**: OP Stack components (sequencer/batcher/proposer), supersim local runs, devops muscle (the real cost), fee economics.
- **Depends on**: everything else being alive — an empty chain serves nobody; also the Bridge (assets would migrate).
- **Steps**: 1) supersim locally, point a Verex prototype at it, break the batcher and watch the three finality clocks; 2) write the lease memo (choosing-a-chain-is-a-lease applied to *being* the landlord); 3) evaluate RaaS (Conduit/Caldera) vs self-run; 4) go/no-go with numbers, not vibes.
- **Subtasks**: supersim lab notes; cost model (infra + ops hours/month); sequencer-downtime user story; RaaS comparison table.
- **Risk**: the single most expensive line in the diagram to operate — hence "start at last" is the right call; local learning now, production maybe never.
- **PoC links**: `choosing-a-chain-is-a-lease`, `l2-finality-three-clocks`, `l1-data-pricing-dimensions`.

## 9. Authority Auditor
- **What**: the authority-matrix idea productized — feed it a wallet/dapp config and get the filled matrix (who can sign/recover/export/change policy) as a shareable report.
- **Repo**: `jayverse-auditor` (small Next.js app + rules engine); pure read/analyze, no keys, no custody.
- **Skills**: provider config knowledge (Privy/Dynamic/Web3Auth/Turnkey docs), contract-permission reading (owners, roles, upgradeability), report UX.
- **Depends on**: nothing on-chain — can ship first; richest when Wallet exists to dogfood against.
- **Steps**: 1) hardcode the matrix for our own wallet config (dogfood = launch content); 2) rules engine mapping config → matrix cells (alone / cooperation / cannot); 3) add contract-side checks (owner, proxy admin, pause); 4) public report page per audited app.
- **Subtasks**: matrix schema (actions × actors × evidence); provider config parsers; severity labels; "verified by test, not docs" badge for cells actually exercised.
- **Risk**: wrong cells are worse than no cells — every claim needs an evidence link or a "not verified" mark.
- **PoC links**: `embedded-wallet-policy`, `safe-module-root-key`, `third-party-blast-radius`.

## 10.Dark Horse
- **데이터 과학**(온체인 데이터 분석·pandas/numpy·Dune/The Graph)
- PoCs items
