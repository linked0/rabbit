# Nostra Points /Reward System  Implementation

**Issue #34** | **State:** OPEN | **Created:** 2026-01-14T05:21:54Z

**Assignees:** Abdulkarim4u

**Updated:** 2026-01-22T08:25:11Z | **Closed:** N/A

---

- [x] **### Implement points Overview  to show overview of points and banner** 
   

   - Description: Global banner and summary component.
  Details:
  - Displays the Current Season End Date (countdown).
  - Shows the Total Reward Pool for the detailed week.
  - Provides a "How it Works" modal linking to the Reward Policy specifics (Trading vs. Holding weights).


- [x] **### implement  Dashboard so that users can track their progress** 

   - Description: A personal metrics center for users to track their season progress.
 Features:
  - Real-Time Breakdown: Visualizes the split between Trading, Liquidity, and Holding points.
  - History Chart: A robust dual-axis chart showing Point Growth (Line) vs. Daily Activity (Bars).
  - Estimated Rank: Shows live projection of their rank before the weekly payout.

- [x] **### implement leaderboard to see top traders**

- Description: Public ranking system to drive competition.
- Policy:
- Update Frequency: Pseudo-real-time (cached for performance, updates every ~5 mins).
- Privacy: Users can opt to show their ENS/Username or remain anonymous (Wallet Address).
- Filtering: Viewers can toggle between "Current Season" and "All-Time" rankings.


- [x] **### implement points calculation logic**


Description: 
-  This task implements the core backend service for the Weekly Rewards Program. The system runs on a Weekly Season   basis (resets Monday 00:00 UTC).
- 
- Reward Policy & Calculation Details:
- 

1. Trading Points (Active Volume)

- Goal: Reward genuine trading activity.

- Formula: Points = (MakerVolume * MakerMultiplier) + (TakerVolume * TakerMultiplier)

Policy:

- Points are credited only for filled orders.
- Wash Trading Penalty: Users detected trading against themselves or a closed-loop of wallets (sybil attack) will have their points valid for that period voided or reduced by a penalty factor.


2. Liquidity Points (Market Making)

- Goal: Incentivize deep order books.
- Old Logic (Deprecated): Points per order placed (vulnerable to spam).
- New Policy: Volume-Weighted Liquidity Provisioning.
- Users earn points based on the Total Volume of Maker Orders that get filled.
- Anti-Spam Threshold: Orders below a minimum size (e.g., $5 value) do not generate liquidity points to prevent "dust spam."

3. Holding Points (Retention)

- Goal: Reward long-term conviction.
- Formula: Points = PositionValue * DaysHeld
- Policy:
- Weekly Cap: Holding duration is capped at 7 days per season. This prevents "Infinite Accumulation" where old dead positions generate exponential rewards forever.
- Points are calculated based on the average daily balance of positions held.

4. Performance Bonus (Win Rate)

Policy: 
- Top traders (e.g., top 10% by PnL) receive a 1.5x Multiplier on their total weekly points to incentivize profitable trading, not just churn.



- [ ] **### audit and test the points system with edge cases and fix all security issues**

- Description: Comprehensive security and logic audit of the points engine.
- Key Policies Tested:
- Infinite Accumulation Check: Verified that holding points reset/cap correctly each week so users don't earn passive income on dead markets forever.
- Liquidity Gaming: Verified strict checks on minMakerOrderSize to block bot spam.
- Data Integrity: Verified that Dashboard endpoints return data consistent with Leaderboard rankings.
- Scalability: Implemented batch processing for point calculations to handle 10,000+ active users without timeout.

---

## Comments

### @linked0 — 2026-01-14T05:52:37Z

Can you describe the detail step and policy for the reward? You should add them in detail so that we can discuss about it, I guess.
Thx.

---

### @Abdulkarim4u — 2026-01-14T06:13:04Z

yeah sure let me update them 

---

### @linked0 — 2026-01-22T08:25:11Z

You know, I heard from Mr. Park that some investors might not welcome the reward point system — maybe they see it as too complex or unnecessary. That doesn’t mean we shouldn’t prepare the feature; we should just align its implementation with the investment timeline. I definitely believe in its value, though, and we’ll roll it out once the critical issues in the Nostra V1 project are resolved.

---

