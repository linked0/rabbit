# Knowledge Base

**Goal:** move the knowledge page off `/` to its own **Knowledge** menu.

## Current
`public/know.html` is served at `/` (the de-facto landing).

## Proposed
- Serve it at **`/knowledge`**, linked from the top menu.
- `/` is freed for the Home gate (see [main-page.md](main-page.md)).

## Open questions
- Keep `know.html` as static HTML, or convert to a React page for consistency?

## Features
- [ ] **Move to `/knowledge`**
  - [ ] Add the `/knowledge` route serving `know.html` (or a React page)
  - [ ] Update `Nav.tsx` + `middleware.ts` public paths
  - [ ] Fix in-page links in `know.html`
- [ ] **Decision** (you)
  - [ ] Static HTML vs React page
