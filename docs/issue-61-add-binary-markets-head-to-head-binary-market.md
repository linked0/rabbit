# Add Binary Markets(Head-to-Head Binary Market)

**Issue #61** | **State:** CLOSED | **Created:** 2026-01-16T04:35:44Z

**Assignees:** Abdulkarim4u

**Updated:** 2026-01-30T07:22:09Z | **Closed:** 2026-01-30T07:22:09Z

---

## Context
We currently support Yes/No (proposition) binary markets, where users trade on whether an event will occur.

Example:
- "Will Bitcoin exceed $100k by Dec 2025?" → Yes / No

However, many real-world prediction markets are head-to-head (A vs B), where users choose between two mutually exclusive outcomes.

Example:
- "Who will win the football match?" → England vs Ghana

## Proposal
Introduce a new binary market type that supports two named outcomes (A vs B) instead of Yes/No.

## Key Differences from Yes/No Binary
- Outcomes are labeled entities (e.g. Team A vs Team B)
- No implicit "No" outcome
- Pricing still sums to 1.0 (or 100%)
- Resolution selects exactly one winning outcome

## Expected Scope
- Market schema update to support labeled binary outcomes
- Market creation flow for A vs B markets
- Pricing & trade logic reuse from existing binary implementation
- Frontend UI updates to display A vs B options clearly
- Resolution logic for head-to-head markets

## Example Market
- Title: Who will win the match?
- Outcomes: England, Ghana
- Market Type: Binary (Head-to-Head)

