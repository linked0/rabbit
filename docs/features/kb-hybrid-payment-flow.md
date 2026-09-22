# KB Hybrid Card × Stablecoin Payment — Flow Map (reference)

**Scope: flow map only** (jay, 2026-07-17) — a reference diagram of how a TradFi card rail
(ISO 8583) combines with on-chain settlement (Avalanche subnet + stablecoin), modeled on
KB국민카드's reported design. **Not a dev item** — no PoC ladder; kept for architecture
reference and future tie-ins.

*Source: analysis note pasted in session 2026-07-17 (no URL — this doc is the canonical copy).*

## The four layers at a glance

```mermaid
flowchart TB
    subgraph OFF["① Off-chain — TradFi card rail (1–2s)"]
        U[User swipes card] --> VAN[VAN / PG]
        VAN -->|ISO 8583 auth request| KB[Card-issuer server]
    end

    subgraph MID["② Middleware — bridge"]
        KB --> CHOICE{Funding source?}
        CHOICE -->|Credit| LEGACY[Legacy credit path<br/>unchanged]
        CHOICE -->|Stablecoin| CUST[Custody / WaaS<br/>MPC wallet infra, e.g. OpenAsset]
        CUST -->|balance check + hold| AUTH[✅ Authorize<br/>off-chain, asset frozen]
    end

    subgraph ON["③ On-chain — Avalanche subnet (minutes–daily batch)"]
        AUTH -.->|batched, later| BURN[Burn / lock stablecoin<br/>ERC-20 + ERC-2612 permit]
        ORACLE[Oracle: Chainlink / Pyth<br/>jUSD↔KRW rate] --> BURN
        AA[ERC-4337 AA wallet<br/>card# ↔ address 1:1<br/>Paymaster pays gas] -.-> BURN
    end

    subgraph SETTLE["④ Merchant settlement"]
        BURN --> POOL[KRW liquidity pool<br/>issuer's fiat reserves]
        POOL -->|KRW payout| M[Merchant<br/>receives won, never coins]
    end
```

## Timing split — the core trick (authorize now, settle later)

```mermaid
sequenceDiagram
    participant U as User/Card
    participant KB as Issuer server
    participant C as Custody (MPC)
    participant AVAX as Avalanche subnet
    participant M as Merchant

    Note over U,KB: t = 0 (must finish in 1–2s)
    U->>KB: ISO 8583 auth request
    KB->>C: balance check
    C-->>KB: OK + hold (freeze) stablecoin
    KB-->>U: APPROVED ✅ (nothing on-chain yet)

    Note over KB,AVAX: t = minutes ~ T+1 (batch)
    KB->>AVAX: batch settle (burn/lock held coins)
    AVAX->>AVAX: oracle-fixed jUSD↔KRW rate
    KB->>M: KRW payout from liquidity pool
```

Card auth must return in 1–2s; chain finality can't. So **authorization is purely off-chain**
(hold on the custody balance) and the **on-chain movement is deferred batch settlement** —
the same authorize/settle split card networks already use, with the settle leg on-chain.

## Why each piece (one line each)
- **Avalanche subnet (Evergreen)** — an issuer-dedicated lane: public-chain security with
  gas-free config and KYC'd validators; Solidity carries over unchanged.
- **ERC-2612 permit + ERC-4337/Paymaster** — end users never see gas or seed phrases; card
  number ↔ wallet address is 1:1, issuer sponsors gas.
- **MPC custody** — no single private key to leak (same pillar as [dsrv-portal.md](dsrv-portal.md) ①).
- **Oracle (Chainlink/Pyth)** — fixes the jUSD↔KRW rate per settlement batch to bound FX drift.
- **KRW liquidity pool** — merchants want won, not coins; the pool fronts fiat while the
  stablecoin leg settles.

## Tie-ins (future, not scheduled)
- **AP2/x402 track** ([ap2-test.md](ap2-test.md)): the source note's closing idea — *agent
  earns stablecoin → spends it via a real card* — is exactly the aiaas wallet with this flow
  map as its off-ramp.
- **[agentic-aa.md](agentic-aa.md)**: pillar 2 (paymaster) and pillar 1 (scoped keys) are the
  same building blocks this design assumes.
- **[dsrv-portal.md](dsrv-portal.md)**: MPC custody + compliance pipeline are shared pillars.

## Status
Reference only — flow map, not a dev item.
