# Main Page (Home gate)

**Goal:** a simple landing "gate" where you/users enter each service — with a nice hero image.

## Current
`/` redirects to `know.html` (the knowledge page). There is no real home gate.

## Proposed
- `/` becomes **Home**: a hero image + a grid of cards linking to Knowledge, Portfolio & Market,
  AI Chat, Game, AP2 Test. Show login state.

## Imagery (recommendation)
- A clean, abstract finance/AI hero — the rabbit mascot + a market motif. Either generate an
  illustration (SVG/PNG) or use a royalty-free image. Store in `public/`, optimize (<200 KB),
  add `alt` text.

## Open questions
- Public (pre-login) — suggested, so it's the front door — or gated?
- One hero image, or per-card thumbnails?

## Features
- [ ] **Home gate page**
  - [ ] New `app/page.tsx` (stop redirecting to `know.html`)
  - [ ] Card-grid component linking each service
- [ ] **Hero image**
  - [ ] Add an optimized hero image to `public/` (+ alt text)
- [ ] **Decisions** (you)
  - [ ] Public vs gated; one hero vs per-card thumbnails
