# Cloud SQL (Postgres) setup — rabbit / Task 1

> How to provision the Postgres instance Task 1 needs, connect Cloud Run to it, and put the
> `DATABASE_URL` in Secret Manager. Project **`doubletree-498007`** (billing enabled),
> region **`asia-northeast3`**, smallest tier. _(2026-06-25)_

> ⚠️ **Billable.** A Cloud SQL instance bills monthly even when idle (~$8–10+ at the smallest
> tier). Run these only when you're ready. **Claude does not run these automatically** — they
> create real, billed cloud resources.

## 0. Prereqs (local)
```bash
gcloud config set project doubletree-498007
gcloud services enable sqladmin.googleapis.com secretmanager.googleapis.com
```

## 1. Create the instance + DB + user
```bash
# smallest shared-core tier; pick a strong password for the app user
gcloud sql instances create rabbit-pg \
  --database-version=POSTGRES_16 \
  --tier=db-f1-micro \
  --region=asia-northeast3 \
  --storage-size=10GB --storage-auto-increase

gcloud sql databases create rabbit --instance=rabbit-pg

gcloud sql users create rabbit_app --instance=rabbit-pg --password='REPLACE_ME_STRONG'
```
Get the instance connection name (used by the Cloud SQL connector):
```bash
gcloud sql instances describe rabbit-pg --format='value(connectionName)'
# → doubletree-498007:asia-northeast3:rabbit-pg
```

## 2. DATABASE_URL → Secret Manager
Cloud Run reaches Cloud SQL over a unix socket at `/cloudsql/<connectionName>`:
```bash
CONN=doubletree-498007:asia-northeast3:rabbit-pg
DB_URL="postgresql://rabbit_app:REPLACE_ME_STRONG@localhost/rabbit?host=/cloudsql/${CONN}"

printf '%s' "$DB_URL" | gcloud secrets create DATABASE_URL --data-file=- || \
printf '%s' "$DB_URL" | gcloud secrets versions add DATABASE_URL --data-file=-
```

## 3. Run the Prisma migration
- **Local (recommended first):** point `DATABASE_URL` at a local Docker Postgres and run the
  migration there to validate the schema:
  ```bash
  docker run -d --name rabbit-pg -e POSTGRES_PASSWORD=dev -p 5432:5432 postgres:16
  # .env.local → DATABASE_URL=postgresql://postgres:dev@localhost:5432/rabbit
  pnpm db:migrate   # creates the Trade table
  pnpm dev          # http://localhost:3000/invest
  ```
- **Cloud SQL:** either run the migration through the Cloud SQL Auth Proxy, or apply
  `pnpm db:push` once connected. (Keep `prisma migrate` history in git.)

## 4. Wire Cloud Run → Cloud SQL (in `scripts/deploy.sh`)
Add to the `gcloud run deploy` flags:
```
--add-cloudsql-instances=doubletree-498007:asia-northeast3:rabbit-pg \
--update-secrets=DATABASE_URL=DATABASE_URL:latest
```

## Teardown (stop billing)
```bash
gcloud sql instances delete rabbit-pg
```
