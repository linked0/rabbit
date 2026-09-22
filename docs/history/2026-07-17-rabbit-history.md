# 2026-07-17 — rabbit history

**Source docs:** [docs/features/dsrv-portal.md](../features/dsrv-portal.md) (new; canonical
copy of jay's DSRV Portal analysis summary pasted in-session — no prior source file).

### features: add DSRV Portal study/PoC item
Added `docs/features/dsrv-portal.md` as a new development item from jay's DSRV '포탈'
analysis: core custody-platform knowledge (MPC/TSS, approval workflow, ERC-4337 AA,
AML/Travel Rule) plus three no-VASP PoC tracks (Fireblocks/ZenGo MPC sandbox, ZeroDev/
Biconomy AA, Etherscan-based mini AML dashboard). Registered in the
[features README](../features/README.md) index as a backlog row; suggested first cut is
the mini AML dashboard since it reuses the S6 Postgres and an existing rabbit surface.

### tasks: add TOC to the design file (all sections back-linked)
Per jay (file grew large): inserted a linked Table of contents at the top of
[docs/tasks/jun-30-rabbit-design.md](../tasks/jun-30-rabbit-design.md), grouped as
"Original Jun-30 (§0–§11)" and "Added 2026-07-17 (§12–§21)". Every `## N.` heading got an
explicit `<a id="sN">` anchor (robust against title edits, unlike slug-based links) and a
`[↑ TOC]` back-link line beneath it. Done via a script pass over all 22 headings.

### features + tasks: add CRE × cloud hybrid use-cases item (design §21)
From jay's CRE note: new [docs/features/cre-cloud.md](../features/cre-cloud.md) — four
patterns (RWA asset servicing · stablecoin PoR · DvP settlement · AI prediction-market
settlement) sharing one shape: cloud = private truth, CRE = verified bridge, chain =
settlement. Tie-ins recorded: §12 DSRV (RWA strategy B), §17 KB flow (reserve attestation),
and verex's oracle track ("AI-as-oracle via CRE" as candidate stage 4 after
manual → Chainlink → UMA). README row + design §21 (📎 Reference) added.

### knowledge + tasks: add 5-layer web-stack map (design §20)
From jay's 5-layer stack note: new
[docs/knowledge/web-stack-layers.html](../knowledge/web-stack-layers.html) — layered map
(Presentation/Edge → Integration/Messaging → Business Logic/Data Access →
Storage/Analytics → Infrastructure) with example tools per layer, plus a "where rabbit
sits" overlay naming the deliberate gaps (no CDN/broker/analytics at current scale).
know.html card + design §20 (📎 Reference) added.

### features + tasks: merge WalletChan case study into Agentic AA
From jay's WalletChan v3 note — merged into the existing item per jay ("이미 있으면 거기다
합쳐주고"): new §5 in [docs/features/agentic-aa.md](../features/agentic-aa.md). Key points:
EIP-1193/6963 provider injection + remote signing in Bankr's TEE (keys never in browser);
v3 feature table mapped to pillars (batch tx → pillar 3, gasless relayer → pillar 2, TEE →
custody, simulation → safety rail to copy); control-flow inversion noted vs aiaas (human
drives UI, agent executes). Design §15 got a matching bullet. Note: jay's message also
contained a Naver-dictionary vocab dump — treated as accidental clipboard content, not
acted on.

### knowledge + tasks: add Linera microchains learning page (design §19)
From jay's Linera note (pasted in-session): new self-contained
[docs/knowledge/linera-microchains.html](../knowledge/linera-microchains.html) — SVG
congestion diagrams (shared L2 gas auction vs per-user microchain lanes), tx-flow sequence
comparison, side-by-side table (fees/latency/composability/maturity), and the
agent-payments angle ("cost isolation is a spectrum: shared L2 → Evergreen subnet →
microchain"). Markup validated + raw ampersands in SVG text escaped (browser-pane
navigation was stuck, so verification was via markup check; template identical to the
verified Merkle page). Registered as a know.html card and design §19 (📎 Reference).

### features + tasks: add ERC-8021 builder-codes attribution to Agentic AA
From jay's ERC-8021 note (pasted in-session): new §4 in
[docs/features/agentic-aa.md](../features/agentic-aa.md) — calldata-suffix attribution
standard (schema ID + builder code + 16B marker; EVM ignores it, ledger keeps it), framed
as the companion to pillar 4 (ERC-8004 = who the agent is, 8021 = what it produced), with
a ~+0.5d demo hook (tag the 4-pillar demo txs and parse the suffix back) and an x402/aiaas
tie-in (agent leaves its code on settlement txs). Design §15 got a matching add-on bullet;
features-README row updated.

### tasks: register Merkle-vs-Verkle page as design §18 (follow-up)
Per jay, added §18 (📎 Reference only) to
[docs/tasks/jun-30-rabbit-design.md](../tasks/jun-30-rabbit-design.md) linking the
[comparison page](../knowledge/merkle-vs-verkle.html) and its know.html card, with the
one-line takeaway inline.

### knowledge: add Merkle vs Verkle comparison page
Per jay's request: new self-contained
[docs/knowledge/merkle-vs-verkle.html](../knowledge/merkle-vs-verkle.html) — side-by-side
SVG proof diagrams (Merkle sibling-hash path vs Verkle single aggregated opening proof),
comparison table (primitive, width, proof size ~3–4 KB vs ~150 B, PQ trade-off), and the
"why" (Ethereum The Verge / stateless-client witnesses). Verified rendering in the browser
(fixed a bogus extra level in the first Merkle diagram). Registered as a card in
[docs/know.html](../know.html); knowledge content, so not a features-README item.

### tasks: expand design §17 with the KB flow content (follow-up)
Per jay, §17 in [docs/tasks/jun-30-rabbit-design.md](../tasks/jun-30-rabbit-design.md) grew
from a two-line pointer into a full reference section: ASCII four-layer flow,
authorize-now/settle-later summary, one-line whys, and tie-ins — matching the detail level
of the file's other sections. The feature doc keeps the mermaid diagrams as canonical.

### features: add KB hybrid payment flow map (reference only, per jay)
From the KB국민카드 card×stablecoin analysis note (pasted in-session): new
[docs/features/kb-hybrid-payment-flow.md](../features/kb-hybrid-payment-flow.md) — two
mermaid diagrams (4-layer flow + authorize-now/settle-later sequence) with one-line
rationales (Avalanche subnet, ERC-2612/4337+paymaster, MPC custody, oracle FX, KRW
liquidity pool) and tie-ins to ap2-test/agentic-aa/dsrv-portal. Deliberately **no dev
items** — jay scoped it to a flow map. README row + design §17 pointer added.

### features + tasks: add Solana study + sample-contract item
Per jay's request: new [docs/features/solana.md](../features/solana.md) — rabbit's first
non-EVM item. Ladder: EVM-vs-Solana research note → Anchor counter on devnet → SPL escrow
with PDA vault → (stretch) x402-style pay-for-data in SPL tokens; surfaced at `/etc/solana`
(Phantom wallet-adapter, Explorer links), Anchor project in its own Rust workspace.
Registered in the features README and as §16 in
[docs/tasks/jun-30-rabbit-design.md](../tasks/jun-30-rabbit-design.md). First cut = note +
counter + minimal page (~2–2.5d).

### features + tasks: add Agentic AA 4-pillars demo item
From jay's "4 Pillars of Agentic AA" note (pasted in-session): new
[docs/features/agentic-aa.md](../features/agentic-aa.md) — testnet demo of session-key
scoping, ERC-20/sponsored paymaster, atomic batched UserOperation, and ERC-8004 KYA;
designed as an extension of the §7 ETC page (ZeroDev/permissionless.js + Pimlico, Sepolia)
since §7's ERC-7715 demo *is* pillar 1. Registered in the features README and as §15 in
[docs/tasks/jun-30-rabbit-design.md](../tasks/jun-30-rabbit-design.md). Est. 2–3d for
pillars 1–3 on top of §7, +1d for the exploratory ERC-8004 pillar.

### features + tasks: add Zapier MCP sample-page item
From jay's Zapier MCP summary (pasted in-session): new
[docs/features/zapier-mcp.md](../features/zapier-mcp.md) — `/etc/zapier` sample page where
the agent triggers real SaaS actions (Gmail/Notion/Slack) through Zapier MCP; two wiring
options (Anthropic API MCP connector vs generic MCP SDK client), three demo scenarios,
first cut = email-to-self via the connector (~0.5–1d). Registered in the features README and
as §14 in [docs/tasks/jun-30-rabbit-design.md](../tasks/jun-30-rabbit-design.md). Noted the
complement to §5: KB-over-MCP makes rabbit an MCP server, this makes it an MCP client.

### tasks: §1 final form — title + ✅ only (jay's call)
Final resolution after two iterations (stub → full delete): §1 restored as just the heading
with a ✅ and a one-line status linking to the
[2026-06-30 history](../history/2026-06-30-rabbit-history.md). Keeps §2–§13 numbering and
all dated "design §N" citations valid, with no explanatory clutter needed in §0.

### tasks: delete §1 entirely from jun-30 design doc (follow-up)
Per jay's follow-up ("better to remove it since it's done"), deleted the §1 stub too — the
doc now goes §0 → §2. Kept §2–§13 numbering unchanged on purpose: dated history files
(2026-06-29/30, 07-07) cite "design §N", so renumbering would silently break those records.
A note in §0 explains the gap.

### tasks: trim done §1 from jun-30 design doc
Per jay, collapsed §1 (Portfolio/Market split — ✅ done 2026-06-30) in
[docs/tasks/jun-30-rabbit-design.md](../tasks/jun-30-rabbit-design.md) to a one-line stub.
Heading kept so §2–§13 numbering and cross-references stay valid; the decisions it recorded
remain in §9 and the full text is in git history.

### features + tasks: add PET data clean room (homomorphic encryption) PoC item
From a news article on DESILO supplying its HE-based Data Clean Room to 국립암센터 (pasted
in-session): new [docs/features/pet-clean-room.md](../features/pet-clean-room.md) with four
hands-on PoC options (TenSEAL/Pyfhel encrypted stats → two-role provider/analyst split →
Zama Concrete ML encrypted inference on the sklearn breast-cancer set → optional PSI join);
registered in the features README and as §13 in
[docs/tasks/jun-30-rabbit-design.md](../tasks/jun-30-rabbit-design.md). Suggested order
A→C→B, est. 2–3 focused days, surfaced under ETC or XYZ.

### tasks: register DSRV Portal item in jun-30 design doc
Added §12 to [docs/tasks/jun-30-rabbit-design.md](../tasks/jun-30-rabbit-design.md) as the
last item (backlog, to-do), linking to the detail doc
[docs/features/dsrv-portal.md](../features/dsrv-portal.md); noted the AA PoC overlaps with
§7's session-key stack.

### git: Jul-17 batch landed on main (PR #20)
Per jay's explicit request: committed today's docs on `claude/2026-07-07-session`, pushed,
opened [PR #20](https://github.com/linked0/rabbit/pull/20), rebase-merged (repo allows
rebase only). The branch's three Jul-07 commits (market orderbook §3, staging plan §11,
port 3000→3100) rode along — disclosed in the PR body. Stale `.git/index.lock` (Jul 8,
0 bytes) removed first. Untracked stray `docs/history/2026-07-07-verex-history.md`
(verex-named file inside rabbit) left uncommitted — needs jay's call.
