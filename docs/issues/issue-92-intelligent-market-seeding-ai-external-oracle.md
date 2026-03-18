# Intelligent Market Seeding (AI & External Oracle)

**Issue #92** | **State:** OPEN | **Created:** 2026-01-26T07:46:33Z

**Labels:** enhancement

**Updated:** 2026-02-02T11:28:20Z | **Closed:** N/A

---

**Context**
Currently, new markets are initialized with **50/50 probability**.
For markets with Strong Consensus (e.g., Korea vs Brazil soccer match), the real probability might be skewed (e.g., 1% vs 99%).
If we seed liquidity at 50/50 (/opt/homebrew/bin/zsh.50 each), arbitrageurs will immediately buy the 'cheap' favorite, causing **financial loss to the Platform** (which funds the initial liquidity).

**Proposed Solution**
Implement an **Intelligent Seeding Mechanism** to determine fair initial prices before creating the market.

**1. AI Estimation**
Use an LLM (Claude/GPT) to analyze the question key stats.
*   Input: 'Will Samsung stock rise in Q3?'
*   Output: 'Probability ~40% (Bearish trend)' -> Seed Yes @ /opt/homebrew/bin/zsh.40, No @ /opt/homebrew/bin/zsh.60.

**2. External Reference (Polymarket/Betfair)**
Check if the same market exists on major platforms and copy their probability.
*   Check Polymarket API for 'World Cup Winner'.
*   Use their current trading price as our starting price.

**Tasks**
- [ ] Research: Polymarket/Kalshi API availability for price integration.
- [ ] Prototype: Simple AI prompt to return probability (0.0-1.0) for a given text question.
- [ ] Admin Feature: When creating a market, show 'Suggested Probability' button that pre-fills the odds.
- [ ] Risk Management: Alert if Platform Liquidity is being drained too quickly on a specific side (Bad pricing indicator).

---

## Comments

### @linked0 — 2026-02-02T11:28:20Z

Relates to #57 

---

