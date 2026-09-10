# Base App — what a Mini App buys, and what it rents

*Jayverse **Dark Horse candidate #10(c)** (added 2026-09-08 as a numbered service; moved to the
Dark Horse section 2026-09-10, jay — a candidate that could become a service but isn't one yet; see
[jayverse-darkhorse.md](jayverse-darkhorse.md)). **Strategy / analysis draft** — captured from
jay's write-up as-is; jay will review and turn it into a build plan later, so it is **not yet a
build task** and has no Phases table. Sibling docs indexed in
[README.md](README.md).*

> **Verify before building — this is genuinely fast-moving.** Every mid-2026 platform specific
> below (manifest path/filename, SDK and React-framework names, whether `ready()` still clears the
> splash, whether swap/trade intents are exposed to Mini Apps, whether a review/allowlist step
> exists, any revenue share) is a **claim to check, not a fact** — confirm against Base's current
> Mini App / MiniKit docs and the Base App release notes first.

---

The thing worth wanting from Base App is not the audience. It is that every user arrives with a passkey smart account already created and already funded — which deletes the two steps that kill most of a crypto product's funnel. The cost is that discovery belongs to somebody else.

An afternoon, and the first task is a manifest rather than a rewrite. A Mini App is an ordinary web app running inside the client with a wallet already present, so an existing Next.js app is most of the work already done: serve the manifest the client looks for, call the SDK's ready() so the splash screen clears, and open it in the client's own preview tool before publishing anything. Then measure the only number that decides whether it was worth it — of the people who see a share, how many open it, and of those, how many transact. Everything specific below (the manifest path, SDK and framework names, whether swap or trade intents are exposed to Mini Apps, and whether there is a review or allowlist step) is from a mid-2026 understanding and moves fast: confirm against Base's current Mini App and MiniKit documentation and the Base App release notes before building.

## Why

**"The ecosystem is hot" is not a distribution channel, and treating it as one is the mistake this card exists to prevent.** A feed is a ranking algorithm, and a ranking algorithm is somebody's product decision that can change on a Tuesday. Every card in this catalogue that starts from a growth number ends in the same place — `priced-by-the-wrong-thing` on an exchange's own volume figures, `two-currencies-one-ledger` on eighty million customers who are an option on distribution rather than distribution. **The honest question is not how big the ecosystem is. It is what specifically becomes possible that was not possible before.**

**And there is a real answer, which is why the card is worth writing.** It is not reach. **It is that the two steps where crypto products lose most of their funnel — create a wallet, fund it — have already happened before the user arrives.** A Base App user has a passkey-based smart account that exists, works without a seed phrase, and has a balance. Shipping a Mini App is not buying an audience; **it is deleting an onboarding sequence.** That is measurable against your own numbers today: take your web funnel's connect → funded → first-transaction rates and compare them with the same three inside the client. If the gap is small, the platform is not doing much for you. If it is large, **the gap is the entire business case** and it has nothing to do with how hot anything is.

**What it costs is a lease, and this catalogue already has the argument in another costume.** `choosing-a-chain-is-a-lease` works out that picking an L2 is signing a lease — sequencer control, fee split, exit cost. **A client is the same lease one layer up.** Discovery is algorithmic and not yours. The review path, if there is one, is not yours. The shape of what you are permitted to build is set by a party whose interests will diverge from yours the moment your product matters. So the question to answer before building, not after, is the same one that card asks: **if the Mini App becomes the main way people reach you, what does leaving cost?** A link out to your own domain is a weaker product and a stronger position; a Mini App is the reverse. **That is a real trade with no free corner, and it should be made deliberately.**

**For a prediction market the fit is unusually good and unusually dangerous, and both halves come from the same property: the share is the market.** A post that opens a market inline collapses the distance between reading a claim and pricing it — which is precisely the failure `priced-by-the-wrong-thing` documents, a well-formed question expressed through the wrong instrument **because no better one was reachable at the moment it was asked.** A feed makes the better instrument reachable exactly then. That is the strongest argument for shipping this that this catalogue can make.

**The dangerous half is jurisdictional and it is not hypothetical.** `jurisdiction-below-the-country` records four US states acting against event contracts, and `jurisdiction-decides-the-category` records the same product getting three verdicts in eight days. **A Mini App inside a mainstream consumer client inherits that client's regulatory posture**, which means shipping there is not neutral — **it is choosing to operate under the strictest jurisdiction your host operates in**, and doing so without a negotiation. For anything that could be read as an event contract, the eligibility and geofencing design has to exist before the manifest does, not after the first complaint.

## How it works

### Three ways to use it, in increasing order of commitment

| Surface | What it is | What it buys | What it rents |
|---|---|---|---|
| **A link out** | A post pointing at your own domain | Nothing you did not have | **Nothing** — you keep the whole relationship |
| **A Mini App** | Your web app running inside the client, wallet present | **The funded account, and inline opening from a post** | **Discovery, review, and the shape of what you may build** |
| **Payments / trade intents** | Handing an action to the host's rails | Fewer screens, the host's UX | A dependency on the host's product roadmap |

**A link out is a weaker product and a stronger position. A Mini App is the reverse.** Most of the decision is choosing which of those two you actually want, and it is worth writing down before any code.

### What is actually being deleted

| Funnel step | Ordinary web app | **Inside Base App** |
|---|---|---|
| Install a wallet | A drop-off cliff | **Already done** |
| Back up a seed phrase | Another cliff | **No seed phrase — passkey account** |
| Fund the account | **The biggest cliff** | **Already funded** |
| Connect | A modal, a signature | Present on arrival |
| **First transaction** | What you were hoping for | **The first thing that can happen** |

### The measurement, and it decides the whole thing

Three ratios, taken twice — once on your own site, once inside the client:

1. **Impression → open.** Of the people who see a share, how many open it.
2. **Open → funded and ready.** The step that should be near 1.0 inside the client and is nowhere near it on the web.
3. **Ready → first transaction.**

**The product of the three is the answer.** If it barely moves, the platform is a marketing channel with extra steps and a link out is the better trade. If it moves by a multiple, **that multiple is the business case**, and it is a number nobody else can publish for you.

### The lease terms to read before signing

| Question | Why it decides things |
|---|---|
| **How is discovery ranked?** | If it is algorithmic, your reach is a product decision you do not control |
| **Is there review or an allowlist?** | Determines whether you can ship on your own schedule |
| **What can a Mini App not do?** | The boundary, not the feature list, is what you design against |
| **What is the exit?** | **If the Mini App becomes the main path to you, what does leaving cost?** |
| **Whose jurisdiction applies?** | You inherit the host's, and for event contracts that is the strictest one it operates in |

### What to verify before building — this is genuinely fast-moving

The specifics below are a mid-2026 understanding and should be treated as **claims to check, not facts**: the manifest path and filename the client looks for; the current names of the SDK and React framework and whether they have been folded together; whether `ready()` is still how the splash is cleared; whether swap or trade intents are exposed to Mini Apps at all or only to first-party surfaces; whether a review or allowlist step exists; and whether there is any revenue share or fee. **Confirm every one against Base's current documentation before writing code** — and note in passing that a card whose facts expire this quickly is itself an argument for the link-out option, since a link to your own domain has no version to keep up with.

---

## How this maps onto Jayverse (jay to plan later)

*Placeholder — not yet decided. Left for jay's planning pass:*

- **Which Jayverse surface ships as the Mini App first.** Verex (a prediction market) is the "unusually good and unusually dangerous" fit called out above — the share *is* the market — so it is the obvious first candidate, but the jurisdictional half (eligibility + geofencing before the manifest) has to be designed first.
- **Link-out vs Mini App vs trade intents** — pick the commitment level deliberately per the first table; the winnings → bridge → wallet flow ([jayverse-token-bridge.md](jayverse-token-bridge.md), [jayverse-wallet.md](jayverse-wallet.md)) is what a funded passkey account most directly shortens.
- **The measurement baseline** — capture verex's current connect → funded → first-transaction rates *now*, so the "multiple" the Mini App buys is provable later against real numbers.
- **Numbering:** listed as design doc #9 in the hub; the umbrella plan still has L2 at §9. Reconcile the two when this gets a plan.

---

## Chainlink — infra we use, not build

The whole thesis of this doc — **rent the rail, don't rebuild it** — is exactly the Chainlink posture: consume the oracle stack, don't reimplement it (umbrella map: [README.md](README.md)).

- **Data Feeds** — if the Mini App ever surfaces prices or USD values, read them from a feed rather than hand-rolling a price source. **If wrong or late:** displayed values mislead.
- **CCIP** — for any cross-chain hop the Mini App needs, rather than a bespoke bridge. **If a message is stuck or forged:** the transfer's invariant breaks.

> Every feed is a dependency with a failure mode — keep the "if wrong / late" guard in code, not only here.
