# 2026-09-14 — rabbit

Source: [`docs/features/README.md`](../features/README.md) (jay's request, no separate task file).

### Features README: Status column → "Deployed on (GCP)"

- **Cause:** jay asked to replace the design-table Status column (all "drafting") with the GCP
  instance where each service is deployed.
- **Reasoning:** verified against `gcloud run services list` / domain mappings and DNS rather than
  docs: Rabbit cloud = `doubletree-498007` (asia-northeast1), Verex cloud = `verex-499205`; DeFi is
  on Firebase Hosting in the Verex project, not Cloud Run; Game runs inside the `rabbit` service.
- **Change:** column renamed, one-line key above the table; Wallet P2 and Token P1 cells in the
  Phase overview marked ✅ for the Sepolia/Cloud Run work landed today.
- **Result:** Personas and OFA show "not deployed"; everything else points at its Cloud Run
  service or Hosting site and public URL.
