# Jayverse — the cloud estate: how we run it and reorganise it

*What runs where, what it costs, and the standing decisions about how the Jayverse cloud is
maintained and reshaped. Indexed from the hub's [History section](README.md#history).
Product and protocol decisions live in the per-service design docs — this file is only about the
infrastructure underneath them.*

*Started 2026-09-14 (jay + session on the devnet rollout). Each entry: what was decided, why, and
what would have to change for it to be worth revisiting.*

## The estate today

| Project | Region | What runs there |
|---|---|---|
| `doubletree-498007` (Rabbit cloud) | asia-northeast1 (Tokyo) | Cloud Run: `rabbit`, `jayverse-wallet`, `jayverse-exchange`, `jayverse-number` · Cloud SQL `rabbit-db` · DNS zone `jaylabs-xyz` · **no VMs — Compute Engine API not enabled** |
| `verex-499205` (Verex cloud) | asia-northeast3 (Seoul) | Cloud Run: `verex-web-prod`, `verex-api-prod` (+ `verex-web`, `verex-api` staging) · Cloud SQL `verex-db-prod`, `verex-db` (stopped) |

Firebase Hosting serves `defi.jaylabs.xyz` and `verex.jaylabs.xyz`; the other five hostnames are
Cloud Run domain mappings in asia-northeast1.

**Target shape (decision 7):** the same two projects, both in **asia-northeast3 (Seoul)**, each
with its own database beside its own services. Rabbit moves; Verex is already there.

| | Projects | Regions | Databases |
|---|---|---|---|
| Today | 2 | 2 (Tokyo + Seoul) | 2 |
| **Target** | **2** | **1 (Seoul)** | **2** — one per project, each beside its app |

---

## 0. The framing decision — Jayverse is a demo estate

**Decided (jay, 2026-09-14): every Jayverse system exists to be demonstrated, not to serve real
users.** There is no production traffic, no customer data, and no uptime obligation to anyone.

This is listed first because it is the premise the rest of the page rests on. Several things that
would be requirements for a real product are simply not requirements here:

| Normally required | Here |
|---|---|
| Continuous uptime | only while a demo is running |
| Low latency for end users | only for jay and whoever is watching |
| High-availability databases | zonal, no backups — already configured that way |
| Staging before production | local testing is enough |

**What would reopen it:** a real user, or anything holding value that is not test ETH.

---

## 1. Cost posture — pay for what is being watched, park the rest

Current spend is **~$4/day (~$120/month)**, which is high for an estate with no users. The
breakdown below is an estimate from resource configuration, **not** from billing data — there is no
BigQuery billing export, so nobody has read the actual line items yet.

| Item | Est./month |
|---|---|
| `verex-api-prod` — always-on, CPU throttling disabled | **~$50** |
| `rabbit-db` Cloud SQL (`db-f1-micro`, RUNNABLE, asia-northeast1) | ~$12 |
| `verex-db-prod` Cloud SQL (`db-f1-micro`, RUNNABLE, asia-northeast3) | ~$12 |
| `verex-db` Cloud SQL (stopped, 10 GB retained) | ~$2 |
| Cloud Run requests, builds, deploys | ~$5–15 |
| DNS, Secret Manager, Artifact Registry (~3.6 GB), GCS (~3.5 GB) | ~$2 |
| **Estimated** | **~$85–95** vs ~$120 actual |

**Decided: park what is not being demonstrated, rather than re-architecting it.** Given decision 0,
an idle demo should cost nearly nothing, and the existing `staging-down.sh` already proves the
pattern works.

**~$30/month is still unexplained.** Before any further optimisation, read
**Billing → Reports grouped by SKU**. Optimising against an estimate that accounts for only 75% of
the bill is guessing.

---

## 2. Verex production is parked between demos

**Decided: mirror `staging-down.sh` / `staging-up.sh` for production** — API to `min-instances 0`
with CPU throttling restored, and `verex-db-prod` stopped. Roughly **$60/month → ~$2/month**,
reversed in about two minutes before a demo.

**Why this and not a rewrite.** `verex-api-prod` runs with `--no-cpu-throttling --min-instances 1`,
and that is not a preference — it is the fix for a production incident. From
[`verex/docs/history/2026-07-29-verex-history.md`](../../../verex/docs/history/2026-07-29-verex-history.md):

> Root cause of the drained books: pre-fix CPU throttling froze the in-process re-quote worker
> between requests.

With throttling on, the container's CPU freezes between requests, the market-maker re-quote worker
stops, and users keep trading against stale books until the books drain. That produced the
*"no liquidity at this price"* failure on prod.

**The critical constraint: this is all-or-nothing.** Re-enabling CPU throttling on `verex-api-prod`
while `verex-db-prod` stays running reproduces the 2026-07-29 incident exactly — and it fails
silently, because the site looks healthy until the books are empty. The API and the database go
down together, or neither does. `staging-down.sh` already states this:

> Deliberately all-or-nothing — a throttled API with a live DB would drain the MM books.

**Alternative considered and deferred:** moving the re-quote worker out of the request path to
Cloud Scheduler + a Cloud Run Job. That is the better answer for a system with real users — it
removes the trap permanently and keeps Verex online — but it needs a code change, and decision 0
says nothing needs to be online between demos. Revisit if Verex ever has to stay up.

**What would reopen it:** Verex needing to be reachable without warning.

---

## 3. Staging is retired

**Decided (jay, 2026-09-14): the Verex staging environment is no longer used.** `verex-web`,
`verex-api` and the `verex-db` instance can go, taking Cloud SQL from three instances to two.

**Be precise about which services these are** — the names are easy to invert, and getting it wrong
deletes production:

| Service | Config file | Role |
|---|---|---|
| `verex-web`, `verex-api` | `scripts/deploy.env` | **staging** — retire these |
| `verex-web-prod`, `verex-api-prod` | `scripts/deploy.env.prod` | **production** — keep |

**This saves ~$2/month, not more.** Staging is already parked, so its cost is 10 GB of retained
storage. The reason to do it is fewer things to hold in your head; it is not a cost measure.

**Order matters, and one step is irreversible:** export `verex-db` first if any test data is worth
keeping, then delete the two Cloud Run services, then the SQL instance (irreversible), then the
four `*-verex` staging secrets, and finally remove `staging-up.sh` / `staging-down.sh` and
`deploy.env` from the repo. A script pointing at deleted infrastructure is a trap for a later
session.

**What is lost:** the 2026-07-29 incident happened *in production*. Staging was the thing that
could have caught that class of bug first. Accepted under decision 0.

---

## 4. The two production databases stay separate

**Decided: do not merge `rabbit-db` and `verex-db-prod` into one Cloud SQL instance.**

| Instance | Project | Region | Database |
|---|---|---|---|
| `rabbit-db` | `doubletree-498007` | asia-northeast1 (Tokyo) | `rabbit` |
| `verex-db-prod` | `verex-499205` | asia-northeast3 (Seoul) | `verex_prod` |

**The reason is not cost.** An earlier version of this entry claimed merging would need a size-up
to `db-g1-small` and so save nothing. Under decision 0 that is probably wrong: Postgres hosts
several databases in one cluster natively, and two demo databases with almost no concurrent
traffic would likely fit on a single `db-f1-micro`. Merging probably **would** save ~$12/month.

**The reason is that it does not actually simplify anything — yet.** Today each application talks
to a database in its own project, the default way, with no special wiring:

| Instance | Project | Region | Database | Used by |
|---|---|---|---|---|
| `rabbit-db` | `doubletree-498007` | asia-northeast1 (Tokyo) | `rabbit` | Cloud Run in the same project |
| `verex-db-prod` | `verex-499205` | asia-northeast3 (Seoul) | `verex_prod` | Cloud Run in the same project |

A Cloud SQL instance lives in exactly one project and one region. Merging across that boundary
replaces *two boring databases* with *one database plus a cross-project special case* — an IAM
binding granting the other project's service account `roles/cloudsql.client`, a non-default
connection path, and a shared failure domain where one maintenance restart takes both demos down.
Management complexity moves rather than falls, and it concentrates in the part that is hardest to
remember later. The cross-region latency (~30 ms per round trip) is a real but secondary cost, and
decision 0 makes it tolerable.

**A database cannot be "moved" between regions.** You create a new instance and migrate the data.
And moving a database alone is worse than doing nothing: if `rabbit-db` went to Seoul while
`rabbit` stayed in Tokyo, that *creates* the cross-region hop this entry exists to avoid. Services
and their database move together or not at all.

**Decision 7 (one region) settles this rather than triggering it.** Once Rabbit moves to Seoul,
each application still sits beside its own database, in its own project, with no cross-project
wiring — and the reason to merge disappears along with the reason not to. Two instances stay, both
in Seoul, each local to the services that use it. `rabbit-db` is recreated in Seoul as part of the
Rabbit move (a Cloud SQL instance cannot change region; the move is dump-and-restore), not merged
into `verex-db-prod`.

**What would reopen it:** collapsing the two *projects* into one, which decision 7 explicitly does
not do. Note the scale if it is ever tempting: merging saves ~$12/month, while parking Verex
between demos (decision 2) is roughly twenty minutes' work for ~$60/month.

---

## 5. Cloud Run services are not consolidated into `jayverse-api` + `jayverse-web`

**Decided: keep the current per-product services.** Grouping by *product* continues where it makes
sense — personas into `jayverse-exchange`, the Game and the Auditor already inside `rabbit` — but
there is no target service count.

**Why the api/web split specifically does not fit.** It is a **tier-based** split. Verex has it
because Verex genuinely is an API service plus a frontend. But `rabbit`, `jayverse-wallet`,
`jayverse-number` and `jayverse-exchange` are Next.js full-stack apps where route handlers and
pages live in one application. Forcing a tier split means cutting each app in half and reassembling
the halves — working against the framework for no gain.

**It is also not a cost measure.** All four Rabbit services scale to zero; eight services and two
services cost about the same. The genuine benefit would be fewer cold starts, which is small.

Two further costs: merging Verex in crosses a project *and* a region boundary, and
`jayverse-number` is admin-only while `jayverse-wallet` holds keys — putting those in one process
with public surfaces is a security regression unless routed very carefully.

**What would reopen it:** the repos becoming a monorepo for independent reasons.

---

## 6. The devnet is hosted on a GCE VM, not Cloud Run

**Decided (task doc, 2026-09-14, verified in build):** the devnet runs as a hosted Anvil on a
**GCE VM**. (The chain's own properties — chain id 313370, node modes, the seeded contract set —
belong to [jayverse-devnet.md](jayverse-devnet.md); only the hosting decision is recorded here.)

- **A VM, not Cloud Run** — and Verex is the proof rather than the theory. Cloud Run's writable
  filesystem is `tmpfs` and counts against RAM, so a growing chain state eventually OOMs; instances
  are recycled at Google's discretion; and `max-instances=1` is a limit, not a guarantee, so a
  redeploy can briefly run two nodes against one state file and fork the chain. Verex already hit
  the milder version of this and paid ~$50/month to disable scale-to-zero.
- **Sizing: `e2-small`, 10 GB disks, ~$20/month** — the design doc's original sizing. The task doc
  fixed `e2-medium` (~$38); under decision 0, `e2-small` is enough for a demo chain. `e2-micro` was
  rejected: 1 GB of RAM will not survive the fork cache growing.
- **Region: `asia-northeast3` (Seoul)**, per decision 7 — not the `asia-northeast1` the task doc
  fixed. Building it in Tokyo and moving it later would mean redoing the static IP, the DNS record
  and the TLS certificate. Both this and the sizing are deliberate departures from a "do not
  reopen" row, recorded here and in the task doc rather than made quietly.
- **There is nothing to reuse.** The Compute Engine API has never been enabled in
  `doubletree-498007`; the project holds four Cloud Run services and zero VMs. The DNS zone
  `jaylabs-xyz` and the `rabbit-sepolia-rpc` secret are reused.

**What would reopen it:** mode B (own genesis) removing the fork cache, which would make a smaller
machine viable.

---

## 7. One region — Seoul. Two projects — kept

**Decided (jay, 2026-09-14): the whole estate standardises on `asia-northeast3` (Seoul).** Rabbit
moves from Tokyo; Verex is already there. **The two GCP projects stay separate.**

**Why the region split has no defence.** Every ordinary reason for two regions fails here:

| Usual reason | Applies? |
|---|---|
| Users in different places | No — one audience, mostly jay |
| Regional failure isolation | No — a region down during a demo means no demo anyway |
| Data residency / compliance | No — no real user data |
| Cost difference | No — Tokyo and Seoul price about the same |
| Latency to a specific market | No — both serve Korea |

The split is **history, not design**: Verex was built as its own project in Seoul while Rabbit grew
in Tokyo, and nothing ever forced a choice. Seoul wins over Tokyo because Verex is already there,
jay is in Korea, and so is the demo audience.

**Why the project split is different, and stays.** Region and project were conflated in earlier
discussion; they are separate questions with different answers. Two projects buy real things:
billing visible per product without unpicking a shared invoice, separate IAM and service accounts,
blast-radius isolation between an experiment and everything else — and Verex genuinely is a
distinct product with its own repo and deploy scripts. None of that is history; all of it is worth
keeping.

**What it costs to get there.** Redeploy the four Rabbit Cloud Run services (source-deployed, so
straightforward), recreate `rabbit-db` in Seoul by dump and restore, then delete and recreate the
five region-bound domain mappings — `www`, `wallet`, `exchange`, `number`, `num` — each of which
reissues a TLS certificate. Expect roughly an hour where those hostnames are unreliable. A
one-time afternoon, not an ongoing cost; Tokyo and Seoul price the same, so this buys clarity and
~20 ms, not money.

**What would reopen it:** an audience outside Korea.

---

## Open — not yet settled

- **The ~$30/month gap** between the estimate in decision 1 (~$85–95) and the actual ~$120. Nobody
  has read the billing line items — there is no BigQuery export and the CLI exposes no cost data,
  so this needs **Billing → Reports grouped by SKU** in the console. Worth doing before any further
  optimisation: a third of the bill is currently unexplained.
- **Sequencing.** Decisions 2, 3 and 7 are all unexecuted. Cheapest-first would be: park Verex
  (~20 min, ~$60/mo), delete staging (~15 min, ~$2/mo), then the Seoul move (~an afternoon, ~$0/mo
  but it is the prerequisite for building the devnet in the right place).
