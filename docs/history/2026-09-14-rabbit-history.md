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

### docs: move features / tasks / history / memo to the alice repo

- **Cause:** jay decided alice is the repo for Jayverse design, planning, history, and tech
  notes, and asked to move those docs out of rabbit, keeping only what is tightly tied to the
  portal itself.
- **Reasoning:** alice already held a 09-12 snapshot of `docs/`, so this was a sync-then-split,
  not a copy. The rule applied: whole folders `docs/features/`, `docs/tasks/`, `docs/history/`
  plus `docs/memo.md` go; `rabbit-design.md`, `runbooks/`, `handbook/`, `images/`, and the
  generated notes site (`index.html`, `notes.html`, `knowledge/`, `archive/`, `zsub/`, …) stay.
  The notes site was left alone because rabbit's own generators (`docs:pocs`, `docs:curriculum`)
  still write it; that is a separate decision.
- **Change:** removed the four paths and their `docs/html/` mirrors (311 files). Root `README.md`
  and `docs/handbook/workflow.md` now point at alice; the five docs cards on `docs/index.html`
  link to `linked0.github.io/alice/…`. `scripts/generate-docs-html.mjs` skips the tasks/history
  indexes when the folders are absent, so the pre-commit hook no longer throws.
- **Result:** working tree only on `claude/docs-to-alice` (stacked on `claude/jayverse-scenarios`),
  uncommitted. Source comments in `app/` that cite `docs/features/*.md` or
  `docs/tasks/current-plan.md` are unchanged and now describe files in alice. `pnpm docs:logs`
  in rabbit will fail without `docs/history/`; `docs/logs.html` is frozen at its last output.

### Nav: the Game tab is labelled "jayverse-game" (Codex session, 2026-09-14)

#### Rabbit navigation: rename the Game tab

Changed the `/game` top-menu label to `jayverse-game` in both Korean and English so the navigation consistently names the embedded game project. The route, visibility gate, and page title remain unchanged.

#### Rabbit local server: run from the Codex worktree

Confirmed no Rabbit process was using port 3100, left unrelated Verex and Gitboard servers untouched, and started Rabbit from `/Users/jay/work-codex/rabbit`. Initialized and built the existing JayVerse submodule, then verified HTTP 200 responses for `/game` and `/jayverse-game/street`, including the renamed menu and real iframe embed.
