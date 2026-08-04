# 2026-08-04 — rabbit history

> Source doc: [docs/tasks/current-plan.md](../tasks/current-plan.md) (§7 added below) and
> [docs/features/toss-payments.md](../features/toss-payments.md) (existing design this entry
> promotes to an active task). Direct chat requests from jay — no separate task file.

### Add Toss Payments (§7) as an active task in current-plan.md

**Cause:** jay hit Stripe's account-creation country list and his country wasn't on it, blocking
him from getting Stripe keys for §2 AP2.

**Reasoning:** the repo already had a full design for a KRW-native counterpart at
`docs/features/toss-payments.md` (written 2026-08-03, parked as backlog) — Toss doesn't have the
same signup restriction, so it's the practical unblock rather than a new idea. jay then explicitly
asked to promote it from backlog into the tracked plan.

**Change:** added §7 to `current-plan.md` (TOC, summary, prerequisites with key-acquisition
instructions, decisions, sequence step 2, and a full §7 section pointing to `toss-payments.md` for
detail); updated `toss-payments.md`'s Status line and `features/README.md`'s Toss Payments row to
point at §7 instead of marking it unscheduled backlog. Also documented in §1 where to get Stripe
test keys (`dashboard.stripe.com/test/apikeys`) and thirdweb keys (`thirdweb.com/dashboard`),
found while investigating the Stripe signup blocker.

**Result:** current-plan.md now tracks three active tasks (§2 AP2/Stripe, §7 Toss Payments, §3+§6
AA) instead of two. Toss test-mode keys still need to be pulled from
`developers.tosspayments.com` before §7 implementation can start — not yet done.

### Fill in Stripe / thirdweb / Toss keys in .env.local

**Cause:** jay pulled real test-mode credentials from each provider's dashboard over several
messages (Stripe publishable+secret, thirdweb Client ID+secret, Toss client+secret+security key)
and asked to wire each into the project as he got them.

**Reasoning:** followed the existing `.env.local`/`.env.example` convention (`AUTH_GOOGLE_ID`-style
naming, Korean comments, always update both files together). Publishable/Client keys got the
`NEXT_PUBLIC_` prefix since each provider's SDK reads them browser-side (Stripe.js, thirdweb
Connect, Toss Payment Widget); secret/security keys stayed unprefixed (server-only).

**Change:** added `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` / `STRIPE_SECRET_KEY`,
`NEXT_PUBLIC_THIRDWEB_CLIENT_ID` / `THIRDWEB_SECRET_KEY`, and
`NEXT_PUBLIC_TOSS_CLIENT_KEY` / `TOSS_SECRET_KEY` / `TOSS_SECURITY_KEY` to `.env.local` (real
values) and `.env.example` (blank, with acquisition-instructions comments).

**Result:** all §1 prerequisites for §2/§6/§7 are in place. Confirmed `.env.local` stays gitignored
(`git check-ignore -v` before touching it). Noted jay found Toss's business-registration screen was
the wrong (live-merchant) flow — the developer-center sandbox path issues test keys with no
business number required, same as Stripe.

### Build §2 AP2 (Stripe), §7 (Toss), §3+§6 (AA) — full implementation

**Cause:** jay asked to "go ahead" and implement everything now that all three providers' keys
were in place — confirmed via AskUserQuestion that the scope was all of §2 + §7 + §3/§6 in one
pass, not just the sequence's first step.

**Reasoning:** followed §5's existing sequence (AP2 → Toss → AA). For §3 (session keys), used
`erc20-token-allowance` as the closest ERC-7715 permission type to jay's "spend ≤ X to address Y,
valid 1h" framing, redeeming via a plain EOA session account (not a smart account) to keep §3
scoped to the delegation half only — bundler/smart-account complexity was deliberately deferred to
§6/thirdweb per the plan's existing stack split. For §6 pillar ④ (KYA), stayed with an explainer
card instead of a live demo — ERC-8004 Sepolia registry availability was never verified, and
faking a demo against an unconfirmed contract would be worse than an honest placeholder. Pulled
current API shapes directly from MetaMask's and thirdweb's own doc repos / installed package
`.d.ts` files (not from training-data memory) before writing code, since both SDKs' APIs had
visibly moved on: `@metamask/delegation-toolkit` → renamed to `@metamask/smart-accounts-kit`, and
its permission method renamed `wallet_grantPermissions` → `requestExecutionPermissions()`.

**Change:**
- **§2 AP2** — `lib/stripe.ts`, `lib/ap2-data.ts`, `app/api/ap2/checkout/route.ts` (creates a
  Stripe Checkout Session, redirects), `app/ap2/page.tsx` rewritten from the old x402 stub to a
  buy → Checkout → server-verified-release flow.
- **§7 Toss** — `lib/toss.ts`, `lib/toss-data.ts`, `app/etc/toss/page.tsx` +
  `app/etc/toss/TossBuyButton.tsx` (Toss's hosted-checkout `requestPayment` flow via script-tag
  SDK load, server-side confirm on return).
- **§3 AA foundation** — `app/etc/aa/SessionKeyDemo.tsx`: connect MetaMask → generate a
  browser-only throwaway session account → request an ERC-7715 `erc20-token-allowance` permission
  → session account redeems it with `sendTransactionWithDelegation`, no re-signing popup.
- **§6 AA pillars** — `app/etc/aa/AgenticPillars.tsx` + `lib/thirdweb-client.ts`: thirdweb
  `ConnectButton` with `accountAbstraction={{chain: sepolia, sponsorGas: true}}`, pillar ②
  (`useSendTransaction`, sponsored self-send), pillar ③ (`useSendBatchTransaction`, 2 calls in one
  UserOperation), pillar ④ (explainer only).
- **Wiring** — `lib/poc-cards.ts` (ap2/toss-payments/aa cards flipped to `status: "live"`),
  `middleware.ts` (added `/ap2`, `/api/ap2/checkout`, `/etc/toss`, `/etc/aa` to `PUBLIC_PATHS`),
  `app/Nav.tsx` (removed `/ap2` as a standalone nav item — same PoCs-hub consolidation pattern as
  Market/XYZ), `.env.example`/`.env.local` (commented out now-unread `ALLOW_AP2`, matching the
  existing Market/XYZ precedent).
- New deps: `stripe`, `@metamask/smart-accounts-kit` + `viem` (peer), `thirdweb` +
  `@x402/core`/`@x402/evm`/`@x402/svm` (transitive resolution fix for thirdweb's optional Base
  Account connector).

**Result:** `pnpm build` succeeds clean; all new routes (`/ap2`, `/etc/toss`, `/etc/aa`) return 200
on the dev server; `/etc` hub shows all 5 live cards (Hyperliquid, PBS, AP2, Toss, AA) as
clickable. §2/§7 verified **live against each provider's real test API** (Stripe Checkout Session
creation + redirect + payment-status verification; Toss confirm endpoint correctly reached and
correctly rejected an invalid payment). §3/§6 verified at the build/type level only — the actual
wallet-popup interactions (MetaMask permission grant, thirdweb Connect) need jay's own browser,
which an agent can't click through. Two bugs caught and fixed during this pass: `/etc/aa`'s static
generation hung on `@metamask/smart-accounts-kit`'s module load (fixed with `export const dynamic
= "force-dynamic"`), and passing a `t()` translation function as a prop from the server-component
page to the client components crashed at runtime ("functions cannot be passed to Client
Components") — fixed by having each client component read `lang` from `LangContext` itself instead
of receiving a function prop. Work is on branch `claude/ap2-toss-aa-demos`, uncommitted — pending
jay's review.

### Add portfolio-facing "Technical Notes" to PoCs/TIL hubs (purpose, how-it-works, flow diagrams)

**Cause:** jay asked for a structured, per-item technical explanation at the bottom of `/etc` and
`/til` — explicitly framed as something for prospective employers to read to gauge his technical
depth, not just visitor-facing card copy. Mid-turn he added: for today's built items especially,
include a diagram of how messages/transactions/calls flow between entities (Toss, MetaMask, etc).

**Reasoning:** researched the two pre-existing "live" items (Hyperliquid Trading, PBS) via a
read-only Explore agent rather than writing from memory/assumption, since inaccurate technical
claims would undercut the whole point of a credibility-signal section. Kept the short card-grid
copy untouched and added a separate, longer section — matches jay's explicit "at the bottom"
placement rather than expanding the cards themselves. Chose Mermaid (dynamically imported,
client-only) for diagrams over hand-rolled SVG, since sequence diagrams are exactly its use case
and it avoids maintaining custom diagram-drawing code. Only gave diagrams to today's three built
flows (AP2, Toss, AA) per jay's explicit scoping ("especially"), not the older Hyperliquid/PBS
items or the unbuilt "soon" cards, where a flow diagram would either duplicate existing content or
diagram something that doesn't exist yet.

**Change:** extended `DemoCard` (`lib/demo-cards.ts`) with `purpose`/`purposeKo` and
`howItWorks`/`howItWorksKo` fields, plus an optional `diagram` (Mermaid sequence-diagram source).
Wrote this content for all 8 PoCs cards and all 3 TIL cards in `lib/poc-cards.ts` /
`lib/til-cards.ts` — for "live" items, describing the actual shipped implementation (signing
model, request flow, what's client vs. server); for "soon" items, the planned approach, clearly
labeled as not yet built. Added three Mermaid diagrams (AP2 Checkout flow, Toss confirm flow, AA's
combined ERC-7715 session-key + ERC-4337 smart-account flow). New components: `app/TechNotes.tsx`
(server component, renders one block per card: title, Purpose, How it works, optional diagram) and
`app/MermaidDiagram.tsx` (client component, dynamically `import("mermaid")`s so the ~600KB library
never loads on pages with no diagram, e.g. `/til`). Wired `<TechNotes>` into both `/etc` and `/til`
below their existing card grids, in the same `liveFirst` order as the cards.

**Result:** `pnpm build` and `tsc --noEmit` both pass clean; `/etc` and `/til` return 200 with the
new "Technical Notes"/"기술 노트" section confirmed present in the rendered HTML. One diagram bug
caught before it could reach the browser: the AA diagram's `<=5 USDC` label risked being
misparsed by Mermaid's HTML-aware text parser (leading `<`) — changed to "up to 5 USDC" instead of
shipping it and hoping. Caveat, same as the AA feature itself: Mermaid renders client-side only
(via a `useEffect`, needs an actual wallet-permission SDK-style async render pipeline), so the
diagrams' *visual* correctness — layout, arrow rendering — couldn't be confirmed by an agent and
needs jay's own browser.

### Move Technical Notes onto each demo's own page, add a top-of-page jump link

**Cause:** jay clarified (after a "no Korean version" report that turned out to be a stale
`lang` cookie in his browser, not a bug) that the Technical Notes content should live on **each
individual demo page** (`/ap2`, `/etc/toss`, `/etc/aa`, `/market`, `/xyz`), not only centralized
on the `/etc`/`/til` hub pages — reasoning: an employer clicking straight into a live demo link
shouldn't have to go back to the hub to find the explanation. He then added: since the demo
content above it can be long, put a link at the top of each page so the note isn't missed.

**Change:** reused the existing `TechNotes` component (it already accepts an array, so passing a
single relevant card — found via `POC_CARDS.find(c => c.key === "...")` — works without any new
component) and added it to the bottom of `/ap2`, `/etc/toss`, `/etc/aa`, `/market`, and `/xyz`,
in addition to (not instead of) the consolidated list still on `/etc`/`/til`. Gave `TechNotes`'s
wrapping `<section>` an `id="tech-notes"` anchor, and added a small new `app/TechNotesLink.tsx`
component (a bilingual `<a href="#tech-notes">` line) placed right under each page's intro
paragraph — same 7 pages.

**Result:** `pnpm build` and `tsc --noEmit` pass clean; confirmed via dev-server `curl` that all
7 pages return 200 with exactly one `#tech-notes` anchor and one jump link each. Separately
resolved the "no Korean version" report during this same exchange: traced `LangProvider` to the
root layout (`app/layout.tsx`), confirmed there's no per-page language logic anywhere in the
codebase, and concluded jay's browser had a stale `lang=en` cookie/localStorage value from
earlier in the session — not a code bug, no fix needed there.

### Remove Technical Notes from the PoCs/TIL hub pages (keep only on individual demo pages)

**Cause:** with Technical Notes now on every individual demo page (previous entry), jay decided
the hub pages (`/etc`, `/til`) no longer need their own copy — redundant once each demo carries
its own.

**Reasoning:** straightforward removal, no new abstraction needed since `TechNotes`/
`TechNotesLink` were already separate, optionally-used components. Flagging one side effect for
awareness, not blocking on it: the 3 PoCs cards with no live page yet (Solana, Zapier MCP,
ERC-8141) and all 3 TIL cards (all still "soon") now have `purpose`/`howItWorks` content in
`lib/poc-cards.ts`/`lib/til-cards.ts` that isn't rendered anywhere until those pages get built —
harmless (just unused data), and it'll surface automatically once each gets its own page using the
same `TechNotes cards={[...]}` pattern already used for the 5 live items.

**Change:** removed the `<TechNotes>` and `<TechNotesLink>` usage (and their imports) from
`app/etc/page.tsx` and `app/til/page.tsx`. The components themselves, and all the card content,
are untouched — still live on `/ap2`, `/etc/toss`, `/etc/aa`, `/market`, `/xyz`.

**Result:** `pnpm build` passes clean; `/etc` and `/til` dropped back to their pre-TechNotes
bundle size (~1.9 kB, from ~2.2 kB). Confirmed via dev-server `curl` that both hub pages no
longer render "Technical Notes"/"기술 노트" while all 5 individual demo pages still do.

### Diagnose "clicking each PoCs card takes a long time" + code-split /etc/aa's bundle

**Cause:** jay reported clicking into PoCs cards feels slow "at first."

**Reasoning:** measured rather than guessed — checked the dev server's own compile log and timed
requests directly. Found two distinct, real things: (1) Next.js dev mode compiles each route
on-demand the first time it's ever requested (measured: `/ap2` took 3.2s / 5171 modules on its
first hit in the log; `/etc/aa` took 8.9s wall-clock via `curl` on first hit, then 0.027s on the
second) — this is inherent to `next dev` and doesn't happen in production, where `next build`
precompiles everything ahead of time. (2) Independent of that, `/etc/aa`'s *client* bundle really
was oversized — 651 kB First Load JS, from bundling `thirdweb` + `@metamask/smart-accounts-kit` +
`viem` directly into the page — a real, worth-fixing issue regardless of the dev-mode compile
delay, since it would also slow real visitors in production.

**Change:** added `app/etc/aa/LazyAA.tsx`, a client-component wrapper using `next/dynamic(...,
{ssr: false})` to code-split `SessionKeyDemo` and `AgenticPillars` into separate on-demand chunks
(a Server Component page can't pass `ssr:false` to `next/dynamic` directly — hence the wrapper).
`app/etc/aa/page.tsx` now imports `LazySessionKeyDemo`/`LazyAgenticPillars` instead of the
components directly.

**Result:** `/etc/aa`'s First Load JS dropped from 651 kB to 3.22 kB (`pnpm build` output) — the
page shell (Nav, heading, description) now renders immediately, with the heavy Web3 SDKs loading
in behind it. Told jay honestly that this fixes the *client bundle* problem but not the *dev-mode
first-compile* delay he's most likely actually seeing — that's expected `next dev` behavior
(confirmed via the 8.9s → 0.027s first-vs-second-hit timing) and is absent in a production build.

### Toss client-key "인증되지 않은 키" root cause: O-vs-0 transcription error from a screenshot

**Cause:** jay's `/etc/toss` buy button kept failing with Toss's `UNAUTHORIZED_KEY` error
("인증되지 않은 시크릿 키 혹은 클라이언트 키") even though the keys were saved in `.env.local`.

**Reasoning:** narrowed it down by elimination. The Toss dev-center API log showed my earlier
`curl` confirm test had *authenticated successfully* (404 business error, not 401) — so the
secret key was proven good. The page showed Toss's own error rather than the component's
"widget still loading" fallback — so a client-key value *was* reaching the SDK (ruling out the
stale-dev-server theory). That left the client key's *value* itself — which, unlike the secret
key, had never been validated by any successful call, and had been transcribed by me from a
pasted screenshot image, where `0`/`O` are visually ambiguous.

**Change:** jay re-pasted the keys as text: the real client key ends `...qY50Q9R` (digit zero),
my transcription had `...qY5OQ9R` (letter O) — one character off, exactly the predicted failure
mode. Fixed `.env.local` line 100; secret/security keys were character-identical, unchanged.

**Result:** client key now matches the dev center exactly. Requires a dev-server restart to take
effect (`NEXT_PUBLIC_*` is inlined at startup). Lesson for future sessions: keys received as
*images* should be re-verified as text before debugging anything downstream of them — the one
credential that was never proven by a live call was the one that was wrong.

### Structured payment receipts for the Stripe (AP2) and Toss success states

**Cause:** jay asked for a "more professional and structured result" after a successful payment on
both `/ap2` and `/etc/toss` — the success state was previously a one-line green panel + the mock
quote.

**Reasoning:** both providers already return rich payment metadata on the server-side verification
call this app makes anyway (Stripe's session retrieve, Toss's confirm response) — so a structured
receipt costs no extra API calls, and showing verified metadata (not client-side echoes) fits the
portfolio framing: it demonstrates the server-verification design visibly. Built one shared
presentational component instead of two page-specific blocks since the shape (label/value rows +
verification note + released content + optional official-receipt link) is identical.

**Change:** new `app/PaymentReceipt.tsx` (bilingual: header + "승인 완료/Approved" badge,
label/value `<dl>` grid with monospace for IDs, a "re-verified server-side via <API> — the client
redirect alone is never trusted" note, the purchased-data box, optional receipt link). Extended
`lib/toss.ts` to surface `paymentKey/orderId/totalAmount/method/approvedAt/receipt.url` from the
confirm response (was `{ok, status}` only). `/etc/toss` renders order ID, paymentKey, method,
amount, approval time (KST), status + Toss's official receipt URL; `/ap2` keeps the retrieved
`Stripe.Checkout.Session` and renders session ID, PaymentIntent ID, amount, payer email, paid-at
(KST), status.

**Result:** build + type-check clean. Verified both new code paths against the real test APIs
without completing a payment: a freshly-created (unpaid) Stripe session correctly hits the new
"pending" branch, and an invalid Toss confirm correctly hits the error branch. The receipt
rendering itself only appears after a real paid transaction — needs jay's browser click-through
(test card) to see visually.
