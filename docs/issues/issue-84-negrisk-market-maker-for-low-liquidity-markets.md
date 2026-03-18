# NegRisk: Market Maker for Low-Liquidity Markets

**Issue #84** | **State:** OPEN | **Created:** 2026-01-23T04:31:34Z

**Labels:** enhancement

**Updated:** 2026-01-23T04:38:38Z | **Closed:** N/A

---

## Summary

Implement automated market making (algorithmic quoting) for low-liquidity markets. The bot dynamically adjusts quotes based on inventory and conditions to ensure tight spreads.

## Tasks

- [ ] Design inventory-aware quoting strategy with dynamic spreads
- [ ] Implement MM bot service with WebSocket orderbook monitoring
- [ ] Define activation criteria (auto-activate when spread > X%)
- [ ] Implement risk management (position limits, stop-loss, capital allocation)
- [ ] Build admin dashboard for MM P&L, positions, and manual overrides
- [ ] Test with backtesting framework and paper trading mode

## Notes

- Dubai team currently developing crypto signal system — coordinate
- Apply initially to low-liquidity markets only, expand gradually
- Separate MM P&L tracking from platform revenue
- Inspired by Polymarket's NegRisk approach

