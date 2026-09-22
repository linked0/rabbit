# JayVerse (eye-popping showcase)

**Goal:** a flashy, self-contained showcase menu (`/jayverse`) — the "쩌는" front door of rabbit.
Replaces the old **ETC** catch-all (its trivial experiments moved into
[xyz-demo.md](xyz-demo.md)); the freed slot now hosts a single high-"wow" piece: a live-trading
**terminal dashboard** reproduced purely for look and motion, clearly labeled `SIMULATED / DEMO`.

> Source design: **New Second** in [../tasks/jul-01-rabbit-design.md](../tasks/jul-01-rabbit-design.md)
> (Gravia-style dashboard). This doc is the feature-level summary of that design.

## Concept
A single client-side page at **`/jayverse`** (Gravia panel at `/jayverse/gravia`) — dark cyberpunk
terminal aesthetic: neon magenta/green on near-black, monospace, a tight grid of glowing panels,
subtle scanline/CRT glow, everything animating in real time off one **mock** feed. **Not** a real
trading bot — no profit logic, no live capital. We copy the aesthetic + UX, not any profit claim,
and label the page `SIMULATED` up front.

## Panels (mirror the reference screenshot)
1. **Top ticker bar** — model tag, market name, BTC/ETH prices, trade count, uptime clock.
2. **Wallet panel** — balance, win-rate, trade count (animated counters).
3. **Live candlestick chart** — BTC 5m, streaming candles.
4. **Order book ladder** — bids/asks with size bars.
5. **#1 Trader · Live Streak** — multiplier + sparkline.
6. **Market force-graph** — signature centerpiece: bear/bull/median/catalyst/cluster nodes on a
   physics-driven network, pulsing. (Hardest panel.)
7. **P&L cumulative curve** — the "up and to the right" line.
8. **Recent trades table** — streaming rows.
9. **Analytics bars** — volume/heat mini bar charts.
10. **Execution log** — bottom terminal log, new lines appended live.

## Tech (all client-side, no backend)
- **Charts:** `lightweight-charts` (TradingView) for candles + P&L line — tiny, canvas, fast.
- **Force graph:** `react-force-graph-2d` or raw `d3-force` on a canvas.
- **Data:** one **mock feed** — a seeded pseudo-random walk on `requestAnimationFrame`/`setInterval`
  driving every panel. Deterministic seed → looks alive but reproducible (and SSR-safe).
- **Styling:** Tailwind + a monospace font + CSS glow/scanline. No new heavy deps beyond the two
  chart libs.
- **State:** a single `useGravia()` hook holds the simulated world; panels subscribe.

## Optional "make it real" tie-ins (v2, not MVP)
- **Hyperliquid orderbook** (Market §3) → drive the real L2 book panel.
- **Flashbots relay Data API** (New First / PBS section) → a "builder auction" panel showing real
  winning bids — turns the page into a genuine PBS/MEV live board, not just eye-candy.

## Scope / recommendation
- **MVP:** all panels, **100% mock** animated feed, one route, no auth, no persistence. Fast, high
  "wow", zero infra.
- **v2:** wire the Hyperliquid book + relay Data API into two panels for authenticity.
- Keep it **clearly labeled SIMULATED** with a one-line "what this is / isn't" note.

## Features
- [ ] **Route + shell** — `/jayverse` page, dark terminal layout, `SIMULATED / DEMO` label
- [ ] **Mock feed** — seeded `useGravia()` world driving all panels
- [ ] **Core panels** — ticker, wallet, candles, order book, P&L, trades, analytics, exec log
- [ ] **Force-graph centerpiece** (hardest; defer to v2 if MVP time is short)
- [ ] **v2 real tie-ins** — Hyperliquid L2 book + Flashbots relay auction panel

## Open questions (from New Second)
1. Route name — `/jayverse` (chosen) with the panel at `/jayverse/gravia`, or a neutral
   `/jayverse/trading-terminal`?
2. MVP fully mock, or wire the real Hyperliquid book from day one?
3. Is the **force-graph** centerpiece a must-have for MVP (most work), or defer to v2?

---

## Chainlink — infra we use, not build

The showcase is **client-side, no backend** (see *Tech*), so today it uses **no Chainlink at all** — it renders panels; it doesn't price or resolve anything.

**If a "make it real" v2 tie-in** (the optional section) ever reads live prices or values, it should pull them from **Data Feeds** rather than a hand-rolled source — consume the rail, don't rebuild it. (Umbrella map: [README.md](README.md).)
