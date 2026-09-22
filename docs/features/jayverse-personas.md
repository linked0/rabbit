# Jayverse — Persona market (NFT)

**Purpose:** an NFT marketplace whose first asset is real utility — mint, rent, and chat with
**openclone** (`~/.claude/skills/openclone`) AI personas; the NFT is the access token to a token-gated chat, and
per-message x402 payments turn "owning a persona" into ongoing creator revenue.

*Source: [09-02-jayverse.md](../tasks/09-02-jayverse.md) "## 4. Persona market as NFT market"
(jay's comment: "Show me the user scenario and what web app shows and the flow…"). Repo:
`jayverse-token` — Personas moved into the Token + Exchange project (#7) on 2026-09-14; it was
its own `jayverse-personas` repo before. Hub: [README.md](README.md).
DESIGN DRAFT for review — nothing here is built yet.*

> **Part of #7 Token + Exchange (jay, 2026-09-14).** Personas is a package of the `jayverse-token` repo
> and ships inside the `jayverse-exchange` Cloud Run service — token market and NFT market as one
> project, personas priced in JYVE through the pool ([jayverse-token-bridge.md](jayverse-token-bridge.md)).
> Hub row #4 now belongs to the own L1/L2 chain. Paths below written as `jayverse-personas/...` read as
> `jayverse-token/personas/...`. See the hub's [Ownership changes](README.md#ownership-changes-jay-2026-09-14).

---

## Phases (build order)

| Phase | Focus | What we implement |
|---|---|---|
| **1 (MVP)** | Mint + token-gated chat (Slice A) | `Persona721` (ERC-721); marketplace grid + detail page; **SIWE gate** verifying `ownerOf` on-chain → session → chat opens; stubbed persona reply. |
| **2** | Day rentals (Slice B) | ERC-4907 `setUser`/`userOf`/`userExpires` + `rent()`; gate checks owner **or** active renter; rental UI + automatic expiry. |
| **3** | Revenue + market | x402 per-message chat metering; openclone runtime wiring; IPFS pinning; creator flow `/personas/create`; public market listing + earnings tab. |

---

## 1. What we build (basic feature)

Ship in two thin slices, smallest first.

**Slice A — mint + token-gated chat (the MVP).**
One `Persona721` ERC-721 collection. A creator mints a persona NFT that points (via IPFS
metadata) to an openclone persona bundle. Whoever holds `tokenId` — and *only* the holder —
can open a chat window and talk to that persona. Access is proven with **Sign-In-with-Ethereum
(SIWE / EIP-4361)**: sign a nonce, backend checks `ownerOf(tokenId) == signer`, issues a short
session. No holder, no chat. This is the whole first milestone — one contract, one gate, one
chat window.

**Slice B — day rentals (ERC-4907).**
Add the ERC-4907 `user`/`expires` layer so the owner can rent chat access for a day without
transferring ownership. The token-gate check becomes "are you the current *user* (rental) OR
the *owner*?". Rental price and duration are set per persona; payment settles in jUSD.

**Later (noted, not first):** creator onboarding straight from openclone's `new`, public market
listing, and **x402-priced chat** (pay-per-message) as the recurring revenue rail. Kept out of
the MVP so the first build stays "mint one, gate it, chat."

---

## Why an NFT — the demand, and why on-chain

*Added 2026-09-07 (jay's questions: why buy or rent a persona at all, and why must it be an NFT?).*

**The root demand — access to a mind you couldn't otherwise reach.** People don't want an NFT; they
want to talk to a specific, curated, knowledgeable mind. That pull is real and proven (Character.AI,
celebrity chatbots) and it's three instincts: **mentorship / expertise-on-demand** (ask a VC, a
founder, a domain expert — exactly openclone's categories), **parasocial / fandom** (talk to someone
you admire but can't meet), and **curiosity / play**. Everything else rests on this: nobody collects
or invests in a persona no one wants to talk to.

**Three tiers of that one need — the tier *is* the product:**

| Tier | Primitive | The need |
|---|---|---|
| Pay-per-message | x402 | cheapest access, zero commitment — "just ask once" |
| Rent a day | ERC-4907 | heavy but temporary use, without owning |
| Own (mint) | `Persona721` | access **+ the right to earn from others' access + control + resale** |

So **owning is the *investment/control* form of access, not the *consumption* form.** A pure chatter
should rent or pay-per-message. Someone *buys* for **income** (collect chat + rental revenue whenever
anyone else uses the persona — a cash-flowing asset, like a rentable apartment), **cost** (heavy
personal use is cheaper owned), **control** (extend/curate the persona, set prices), or **resale** (a
persona that gains a following appreciates). Picture the NFT as a **publicly visible ticket you can
also resell, sublet, and collect income from** — a season pass that pays you rent, not a one-time stub.

**Why an NFT and not just a chatbot service.** For pure chat you don't need one — a Web2 chatbot is
simpler. The NFT earns its place only because the persona is an **asset in an open market**:

- **Ownership + resale** — token #7 is genuinely yours and tradable; a database row isn't.
- **Trustless access rights** — the token-gate and the ERC-4907 rental (auto-expiry) are enforced by
  the chain, not a company's server deciding who's in.
- **Disintermediated revenue** — x402 + ERC-2981 royalties flow directly to owner/creator, no
  platform taking a cut and controlling payouts.
- **Composability (the Jayverse reason)** — because the persona is an open on-chain object with an
  open payment rail, **any service or agent can consume it permissionlessly**: Rabbit's agent rents
  Astra via the *same* x402 path a human uses, the Unity street can show your persona as a companion,
  the Auditor reads its ownership. That cross-service reuse is impossible with ownership trapped in
  one app's database.
- **Provenance** — on-chain proof of who authored a persona (matters for expert/celebrity clones).

**Honest caveat:** the NFT is overhead if the market layer doesn't matter; it's the right primitive
precisely when creators monetize, buyers invest, and other agents consume — which is the whole point
of Jayverse. Portability note: the token carries *rights* across services, while shared
**jayverse-rails** (addresses) + a shared **openclone runtime** carry *behavior*, so "chat with #7"
means the same thing everywhere.

---

## 2. User scenario

**Nova (creator).** Nova has built an openclone persona — "Astra, a synthwave music historian" —
with a few ingested articles as its knowledge. In the web app she clicks **Create persona**,
picks her local openclone bundle, sets a name, avatar, a one-line pitch, a mint price (25 jUSD),
and a per-message chat price (0.02 jUSD). The app pins the persona metadata + knowledge manifest
to IPFS, she signs one transaction, and `Persona721` mints token #7 to her wallet. Astra now
appears on the marketplace grid as "by Nova".

**Kai (buyer — for the asset, not just the chat).** Kai isn't buying only to talk once; for that
he'd pay-per-message or rent (see "Why an NFT" above). He mints because he thinks Astra will get
*used*: he pays the 25 jUSD mint over the shared rails, one signature, and now holds token #7 as an
income asset. He can still chat (SIWE prompt → backend confirms he holds #7 → chat opens), but the
point of owning is what comes next — whenever **anyone else** talks to Astra (Ren's rental, the
agent's consult, other buyers' chats), the rental fees and per-message x402 revenue flow to **Kai
as the owner**, with a creator-royalty slice to Nova (ERC-2981). If Astra's following grows, Kai can
resell #7. Ownership is the *investment/control* form of access; the two tiers below are consumption.

**Ren (renter).** Ren doesn't want to own Astra, just to use her for a day. On the detail page
he clicks **Rent 1 day** (3 jUSD). The contract's `setUser(7, ren, now+24h)` records him as the
temporary user. For 24h Ren passes the token-gate exactly like an owner and can chat; after
`expires`, the gate closes automatically and access reverts to Nova.

**Agent (optional buyer).** Rabbit's Agentic-AI, holding a scoped session key, can itself rent a
persona to consult it — e.g. rent "Astra" to answer a music question — paying via the same x402
path a human uses. The persona market is thus also a service the agent consumes.

---

## 3. What the web app shows

Next.js app in `jayverse-personas`, imported/linked by the Rabbit portal.

**(a) Marketplace grid — `/personas`**
Card grid of personas: avatar, name, creator handle, category tag, mint price, "rentable"
badge, and a live status chip (Owned / Rentable / Rented-until). Filters by category
(vc / tech / founder / expert / …, reusing openclone's categories) and sort by newest / price.

**(b) Persona detail — `/personas/[tokenId]`**
- Header: avatar, name, creator, current holder (or "rented by … until …").
- Pitch + knowledge summary (what the persona knows, source count — not the raw content).
- **Free sample**: 2–3 canned exchange lines so a buyer can judge voice before paying.
- Action buttons, state-aware:
  - not owned → **Mint** (price) and **Rent 1 day** (price).
  - owned/rented by you → **Chat** (primary).
  - you are the owner → **Manage** (set rent price/availability, view earnings).
- Provenance/utility panel: contract address, tokenId, IPFS metadata link, royalty %, and a
  plain-language "what you get" note (chat access, not IP ownership).

**(c) Token-gated chat window — `/personas/[tokenId]/chat`**
Opens only after the SIWE gate passes. Standard chat UI (message list, input, streaming
responses) driven by the openclone runtime. A small meter shows per-message cost and running
spend; a header badge shows access basis ("Owner" / "Rented — 6h left"). If access lapses
mid-session (rental expiry), the input disables with a "rental ended — renew?" prompt.

**(d) Creator flow — `/personas/create`**
Step form: pick openclone bundle → name/avatar/pitch/category → set mint price, chat price,
rent price + duration, royalty % → review IPFS manifest → **Mint**. After mint, redirect to
the new detail page. An **earnings** tab shows mint proceeds, rent income, and x402 chat
revenue per persona.

---

## 4. The flow

```
CREATE / MINT (ERC-721)
  creator: pick openclone bundle
    → pin persona metadata + knowledge manifest to IPFS  → tokenURI = ipfs://…
    → Persona721.mint(to, tokenURI)   [creator mint]  OR  buyer pays mintPrice (jUSD) → mint(to)
    → token #N now held by owner

TOKEN-GATE CHECK (SIWE / EIP-4361)
  user clicks Chat
    → frontend requests nonce  → wallet signs SIWE message (no gas)
    → backend verifies signature recovers `addr`
    → access = (Persona721.ownerOf(N) == addr) || (isRenter(N, addr))
    → on pass: issue short-lived session (JWT/cookie) scoped to tokenId N

CHAT (openclone runtime)
  gated session → backend loads persona bundle for #N → openclone answers as the persona
    → each message metered; x402 charges chatPrice in jUSD (see below)

RENTAL (ERC-4907)
  renter clicks Rent 1 day
    → pay rentPrice (jUSD over rails)
    → Persona721.setUser(N, renter, expires = now + 1 day)
    → gate's isRenter(N, addr) == (userOf(N)==addr && userExpires(N) > now)
    → at expiry, userOf() falls back to address(0); access auto-reverts to owner

X402-PRICED CHAT (ongoing revenue)
  per message (or per session bucket):
    → backend returns 402 Payment Required with price + pay-to (persona payout splitter)
    → wallet/agent pays via x402 facilitator (same path as Agent Commerce Layer)
    → on payment proof, message is answered; revenue split creator/marketplace by royalty policy
```

---

## 5. Cooperate with existing services

- **openclone runtime** (`~/.claude/skills/openclone`) — the persona engine. A minted NFT's
  metadata references an openclone persona bundle (persona card + knowledge manifest); the chat
  backend runs that bundle to answer as the persona. Creator flow reuses openclone `new` /
  `ingest`. This is the "real utility" the NFT unlocks — reused, not rebuilt.
- **Settlement Rails / jUSD** — every payment (mint, rent, x402 chat) settles in jUSD on the
  home chain via `jayverse-rails`; cross-chain, if ever, rides CCIP. No persona-specific
  payment path.
- **Wallet service** (`jayverse-wallet`) — supplies connect + embedded-wallet UX and
  simulate-before-sign for mint/rent transactions, so a buyer previews "you will pay 25 jUSD,
  receive token #7" before signing. SIWE signing uses the same wallet.
- **Rabbit portal + Agentic-AI** — Rabbit imports the persona market UI and lists it in the
  Jayverse portal. The agent, with a scoped session key, can **rent/consult a persona as a
  buyer**, paying via x402 exactly like a human — persona market as an agent-consumable service.

---

## 6. Implementation sketch

**Contracts (`jayverse-personas/contracts`)**
- `Persona721` — ERC-721 + **ERC-4907** (`setUser`/`userOf`/`userExpires`) + ERC-2981 royalties.
  `tokenURI` → IPFS. Optional `mintPrice`/`rentPrice` per-token or per-collection.
- A tiny **payout splitter** (creator / marketplace share) as the x402 pay-to target; or reuse a
  standard splitter. Keep custody minimal.

**Token-gate middleware (new, small)**
- `/api/siwe/nonce`, `/api/siwe/verify` → recover signer, check `ownerOf || renter`, mint a
  short session bound to `tokenId`. Middleware on chat routes re-checks expiry on each request
  (cheap `userOf`/`ownerOf` read via viem, cached briefly). Rental lapse = session invalidated.

**IPFS metadata**
- Standard ERC-721 metadata JSON (name, description, image, attributes: category, chatPrice) +
  a `knowledge` manifest (content hashes/pointers, not raw text inline). Pin via a pinning
  service; store CID in `tokenURI`. Metadata is public — knowledge *access* stays gated.

**x402 chat metering**
- Chat endpoint returns `402` with price + pay-to per message (or per N-message bucket to cut
  overhead); client/agent pays via the shared x402 facilitator; on proof, answer streams.
  Revenue split by ERC-2981/ splitter policy. Reuses the Agent Commerce Layer path — not new.

**What's new vs reused**
- *New:* `Persona721` (721+4907+2981), SIWE token-gate middleware, IPFS manifest packer, x402
  chat meter, the marketplace/detail/chat/create UI.
- *Reused:* openclone runtime (persona brain), rails/jUSD + x402 facilitator, wallet connect +
  simulate-before-sign, openclone categories.

**Risk — IP / likeness**
- Cloning a real person's voice/likeness is the core legal risk. **Policy: market only original
  or clearly-parody personas.** Creator flow requires an attestation ("original or parody, not
  impersonation"); listings carry a parody label where relevant; a takedown path removes a
  persona from the market (NFT stays on-chain, but chat backend + listing are disabled).
  Knowledge licensing (who owns ingested content) needs its own note — see open questions.

**Open questions**
- Knowledge licensing: if a creator ingests third-party articles, what rights transfer to a
  renter? (Likely: access to *answers*, never redistribution of source.)
- x402 granularity: per-message vs per-session bucket vs prepaid credits — UX vs on-chain cost.
- Where the persona bundle + knowledge actually run at chat time (Rabbit cloud backend vs
  a per-persona sandbox) and how gating maps to that runtime.
- Rental during an active chat session: hard cut at expiry vs grace period.
- Royalty enforcement on secondary sales (ERC-2981 is a hint, not enforced by all markets).

---

## Chainlink — infra we use, not build

Chainlink's oracle stack is settlement-rail infrastructure the persona market *consumes*, not reimplements — see the umbrella map in [README.md](README.md).

- **CCIP** — cross-chain transport *if* a persona ever moves off the home chain (already noted in §5); on the home chain there is nothing to bridge. **If a message is stuck or forged:** an ownership transfer could double-count.
- **VRF** — *optional*, only if persona drops / mints ever need provably fair randomness. **If biased:** the drop is riggable.

**Deliberate non-use — pricing.** Persona rent / purchase is a plain ERC-20 transfer priced in **JYVE** (via the mini-AMM), so no external price feed is involved.

> Every feed is a dependency with a failure mode — keep the "if wrong / late" guard in code, not only here.
