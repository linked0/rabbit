# Support multi-outcome markets with probability sum > 100%

**Issue #70** | **State:** OPEN | **Created:** 2026-01-22T10:50:53Z

**Updated:** 2026-01-22T10:53:16Z | **Closed:** N/A

---

## Summary
Add support for markets where the sum of all outcome probabilities can exceed 100%, such as "Top N" prediction markets.

## Use Case
Markets like "Who will be in the top 10 most searched people of 2025?" where:
- Each person has an independent YES/NO market
- Multiple outcomes can resolve to YES simultaneously
- Total probability across all outcomes naturally exceeds 100%

Reference: [Polymarket Top 5 Most Searched People](https://polymarket.com/event/top-5-most-searched-people-on-google-2025)
           
## Requirements
- [ ] Support creating linked markets under a single event 
- [ ] Allow multiple outcomes to resolve YES
- [ ] Handle collateral and payouts for overlapping outcomes
- [ ] UI to display grouped markets as a single event
 
## Technical Considerations
- Market resolution logic for multi-winner scenarios
- Collateral management across linked markets
- Oracle design for batch resolution

