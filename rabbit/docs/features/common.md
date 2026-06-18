# Common (Cross-Cutting)

Concerns that span every feature rather than a single page.

## Navigation (Common #1)
**Goal:** one top menu anchored by **Home**, linking every section.

- **Current:** `app/Nav.tsx` has 지식(`/`) · 요약(`/summary`) · AI 챗(`/chat`) · 포트폴리오(`/dashboard`) ·
  게임(`/game`); `/` redirects to `know.html`.
- **Proposed menu:** Home · Knowledge · Portfolio & Market · AI Chat · Game · AP2 Test · Verex (external).
  - `/` → Home gate (see [main-page.md](main-page.md)); `/knowledge` → knowledge base;
    `/portfolio` → merged summary + portfolio; `/chat`, `/game` stay; add `/ap2`.

**Open questions**
- Which menus are public vs login-gated? (Suggest Home + Knowledge public, rest gated.)
- Menu labels in Korean or English?

## CI/CD (Common #2)
Automate checks on PRs and deploys on merge.

**GitHub Actions**
- **CI** (`.github/workflows/ci.yml`, on PR): `pnpm install` → `pnpm lint` → `pnpm build`
  (+ tests once they exist). Block merge on failure.
- **CD** (`.github/workflows/deploy.yml`, on push to `main`): auth to GCP via Workload Identity
  Federation, then run the existing `scripts/deploy.sh` (or `gcloud run deploy --source .`).

**Open questions**
- Deploy on every merge to `main`, or gate on a tag/release?
- Run DB migrations in CD once Portfolio & Market has a database?

## Features
- [ ] **Navigation**
  - [ ] Rewrite `app/Nav.tsx` menu items + active-link highlighting
  - [ ] Add/rename routes under `app/`; update `middleware.ts` public paths
  - [ ] (you) Decide public vs gated menus + label language
- [ ] **CI/CD**
  - [ ] (you) Create a GCP deploy service account + Workload Identity Federation
  - [ ] Add repo vars (PROJECT_ID, region)
  - [ ] Add `.github/workflows/ci.yml` (lint/build/test on PR)
  - [ ] Add `.github/workflows/deploy.yml` (deploy on merge to `main`)
  - [ ] Test on a throwaway PR
