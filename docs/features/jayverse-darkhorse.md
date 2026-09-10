# Jayverse — Dark Horse (#10) — candidates that could be services, but aren't yet

*Jayverse #10 (added 2026-09-10, jay). **Not committed services** like #1–9 — these are candidate
tracks: each *could* become a real service, none is one yet. Picked up only after the core is
built. Sibling docs indexed in [README.md](README.md); the umbrella plan
[`../tasks/09-02-jayverse.md`](../tasks/09-02-jayverse.md) §10 carries the full step/risk detail.*

> **Why a section, not a backlog line.** Each of these is big or uncertain enough that committing it
> now would distort the build order. Keeping them here — named, with the argument written down —
> means the decision to promote one to a numbered service is deliberate, not accidental.

---

## (a) L1 / L2 — our own chain (start at last)

The own-chain ambition, explicitly **start-at-last**, with **supersim** as the local on-ramp. No
repo yet — a `docs/` research folder first, infra-as-code only if we truly commit. The single most
expensive line in the architecture to operate, so: learn locally now, production maybe never. PoC
links: `choosing-a-chain-is-a-lease`, `l2-finality-three-clocks`, `l1-data-pricing-dimensions`.
(Plan §9 has the full writeup.)

## (b) Security-hole research (보안 취약점 연구)

The offensive-security muscle of Jayverse — study the exploit classes that actually drain protocols
(reentrancy, price-oracle manipulation, access-control gaps, signature/permit replay, bridge
message-validation bugs, proxy/upgradeability pitfalls, and the one we ourselves ship: 7702/7715
session-key scope abuse) and run them against **our own contracts on a local fork before anyone else
does**. Dark horse because it compounds across every service — verex caps, the bridge's 1:1 vault
invariant, the wallet's session keys, the agent's mandate enforcers are all attack surfaces — and it
pairs with data-science (exploit detection is on-chain analysis). Skills: Foundry fuzz/invariant
testing, Slither/Aderyn, Echidna, fork-based exploit reproduction, later Halmos/Certora.
**Dual-use guardrail:** exploits live on local forks only; external findings go through responsible
disclosure, always. (Plan ETC section has the full writeup.)

## (c) Base App — Mini App (moved here 2026-09-10, was #8)

What a Base App Mini App **buys** (a funded passkey account, inline market open from a post) versus
what it **rents** (discovery, review, the shape of what you may build, and the host's jurisdiction).
A **strategy / analysis draft** — the argument is written; the build is deferred. It sits here rather
than in the numbered list because it *could* become a service but is not one yet: it's a distribution
lease to make deliberately, not a committed build. Full write-up:
[jayverse-base-app.md](jayverse-base-app.md).

---

Every entry here is a **candidate for review**, not committed work. Promote one to a numbered service
only when the core is built and the argument above still holds.
