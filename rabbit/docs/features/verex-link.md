# Verex (external link)

**Goal:** add a **Verex** item to the top menu that links to the Verex site — a separate
prediction-market app (`/Users/jay/work/verex`) to be deployed soon.

## Current
No Verex entry. Verex is its own project, not yet deployed.

## Proposed
- Add **Verex** to the top menu. Since Verex is its own deployed site, the item is an
  **external link** to the Verex URL (opens the Verex app), not an internal rabbit route.
- Until the Verex site exists, point it at a placeholder or hide it behind a flag.

## Open questions
- External link (opens the Verex site) vs embed Verex in an `<iframe>` under `/verex`?
- The Verex site URL — set via an env var once it's deployed?
- Open in a new tab, or the same tab?

## Features
- [ ] **Verex menu link**
  - [ ] Add "Verex" to `app/Nav.tsx` (external `<a href>` to the Verex URL)
  - [ ] Put the URL in an env var (`NEXT_PUBLIC_VEREX_URL`), placeholder until live
  - [ ] (you) Decide external link vs embedded iframe; new tab vs same tab
