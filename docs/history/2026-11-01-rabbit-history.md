# 2026-11-01 — rabbit history

Source doc: no task file. This came from a chat with jay about whether showing the cloud setup on /chains is a risk, then "go" on the three changes it led to. Branch `claude/cloud-least-privilege`.

## Added

- `scripts/apply-least-privilege.sh`: the four Cloud Run services move off the default Compute Engine account (`roles/editor` on the whole project). `rabbit` moves to `rabbit-run`, which can read only its own secrets plus act as a Cloud SQL client. The three Jayverse web services move to `jayverse-run`, which has no roles. jay runs the script; `--drop-editor` is the last step.
- `/chains` → a **Where it runs** panel (`lib/cloud.ts`): each part with its cloud service, city, how it runs, and a live status. The database is pinged at most every 30 s. The panel shows no project id, IPs, zones, machine types, account names or billing.

## Done

- /chains Where it runs → every resource in both projects, one row each, in three groups (Jayverse, Verex, outside), stopped ones included
- `scripts/deploy.sh` deploys `rabbit` as `rabbit-run` (`--service-account`). Secrets are granted to that account, not the default one.
- `scripts/deploy.env.example`: `REGION` corrected to `asia-northeast1` and the Cloud SQL example to `rabbit-db`; the template still pointed at Seoul from before the July move.

### Cloud Run off the Editor account: least privilege

- **Cause:** jay asked whether showing which cloud Jayverse uses makes the service or the bill vulnerable. Read-only checks answered no, but they found the real risk. All four public services (`rabbit`, `jayverse-exchange`, `jayverse-number`, `jayverse-wallet`) run as `<number>-compute@developer`, which holds `roles/editor` on the project. A bug that reached the metadata server would hand out a token able to edit Firestore, create VMs and change the other services. The devnet VM was already fine: `devnet-vm` can only write logs and metrics.
- **Reasoning:** each service gets exactly what it uses, read from the live config rather than guessed. `rabbit` mounts 14 secrets and the Cloud SQL instance `rabbit-db`, so `rabbit-run` gets `secretAccessor` on each of those secrets plus `cloudsql.client`. The other three mount nothing and call no Google API (no Google SDK in their `package.json`), so `jayverse-run` gets no roles. Cloud Build runs `deploy --source` builds as the default account (`gcloud builds get-default-service-account`), so that account gets `cloudbuild.builds.builder` before Editor comes off; without it the next deploy would fail at the build. The switch is `gcloud run services update --service-account`: a new revision of the same image, with no rebuild.
- **Change:** I created the two accounts. Granting them roles was blocked by the permission classifier, so the grants, the switch and the Editor removal are in `scripts/apply-least-privilege.sh` for jay to run. It is idempotent: it reads the secret list from the live service, checks the URLs and the last 5 minutes of logs for permission errors, and refuses `--drop-editor` while any service still runs as the default account. `deploy.sh` now names `RUN_SA=rabbit-run@…` and passes `--service-account`.
- **Result:** not applied yet. **Order matters:** run the script before the next `deploy.sh`. Until then a deploy fails safely: `rabbit-run` cannot read the secrets, so the new revision does not start and the old one keeps serving.

### /chains: Where it runs

- **Cause:** jay: "display what cloud I use for the Jayverse service and chain in the Chain top menu" and "display cloud status".
- **Reasoning:** the provider and the city are public anyway (response headers, the devnet's IP block, the page's own "rendering on Cloud Run" line). What would help an attacker stays off: the project id, IPs, zones, machine types, service-account names and billing. The live status reuses the probes the page already makes. The only new call is a `SELECT 1` to Cloud SQL, at most every 30 s with a 2 s ceiling, because the page refreshes every 5 s. A local Anvil that isn't running shows grey "off", not red.
- **Change:** `lib/cloud.ts` (`PLACEMENTS`, `pingDatabase`) and a table panel under the chain cards in `app/chains/page.tsx`, in Korean and English. It shows: the web app, Cloud Run in Tokyo; Exchange · Wallet · Number, Cloud Run in Tokyo (n/3 up); the database, Cloud SQL in Tokyo, always on; the devnet, a Compute Engine VM in Seoul, always on; Sepolia; Anvil on jay's Mac.
- **Result:** `npx tsc --noEmit` clean, and the panel was checked in headless Chrome on `next dev`. It goes live with the next deploy. The project check also corrected two things I had told jay. A Cloud SQL instance (`db-f1-micro`, always on) runs in Tokyo, so at most **6** things run, not 5. The devnet VM is `e2-standard-2`, not `e2-small`.

### Where it runs: every resource, stopped ones included

- **Cause:** jay: "show the instance also that are not running", with a screenshot of the first version (one row per kind, right-aligned cells).
- **Reasoning:** a full inventory of both projects (`gcloud run/compute/sql list`, every status) found what the first version left out. Verex has its own project in Seoul with 4 Cloud Run services; `verex-api-prod` keeps 1 container warm, so it is always on. Verex has 2 databases: production always on, staging **stopped** (`activationPolicy NEVER`). Nothing else is hidden: no stopped VMs, unattached disks, Cloud Run jobs or spare static IPs. The page cannot read the cloud's own state, and should not (least privilege), so the rows it cannot probe show the config as of 2026-11-01. A sleeping staging service is not probed, because a probe would wake it and bill it.
- **Change:** `lib/cloud.ts` `GROUPS` + one `PLACEMENTS` row per resource, with `check: { fixed: "on" | "warm" | "sleeps" | "stopped" }`. In the page: group header rows, a hollow dot for stopped, a dimmed row for anything off, and left-aligned cells (`.gf-where` in `globals.css`).
- **Result:** checked through jay's own dev server (:3100): 13 rows in 3 groups, the staging DB and the local Anvil hollow. Across both projects, 4 things are always on: the devnet VM, two databases and Verex's warm API. At most 12 run at once.
- **Gotcha:** my earlier second `next dev -p 3011` in the same folder shared `.next` and broke jay's :3100 page (`ChunkLoadError … VerexBall_tsx`). The fix is restarting his `pnpm dev`. The rule is now in memory: one dev server per repo.
