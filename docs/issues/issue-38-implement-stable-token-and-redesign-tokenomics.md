# Implement Stable Token and Redesign Tokenomics

**Issue #38** | **State:** OPEN | **Created:** 2026-01-14T07:43:44Z

**Assignees:** linked0

**Updated:** 2026-01-30T07:36:52Z | **Closed:** N/A

---

## Overview

**Alea ($ALEA)** is the platform's stable token used for all prediction market activities.

> "Alea" is Latin for "chance" or "opportunity"

## Token Triangle: Nostra

| Token Name | Details |
|------------|---------|
| **Point Token** | • DB-based points for user activity (not ERC token)<br>• Points awarded bi-weekly based on activity: logins, trades, etc.<br>• Convertible to Governance Token at fixed ratio before TGE<br>• Total Point Token value = 20~30% of Governance Token value |
| **Stable Token (Alea, $ALEA)** | • Settlement token used like cash in prediction markets<br>• Can be pegged to real USDC<br>• Shares TVL (Total Value Locked) as platform revenue info<br>• Burns Governance Tokens equal to TVL value to increase token value |
| **Governance Token (Nostra, $NSTR)** | • Represents the Nostra ecosystem<br>• Platform governance and decision-making |

### Use Cases for Alea ($ALEA)
- Trading on prediction markets
- Providing liquidity for market creation
- Paying platform fees (2% settlement fee: 1% creator + 1% platform)
- Receiving settlement payouts

## Tasks to be done
- [x] Decide on category, the token name, and ticker
- [ ] Deploy a new Stable Token named `ALEA` with 18 decimals (full name: `Alea`)
- [ ] Summarize all the information into the tokenomics document
- [ ] Update user guide with contract addresses after deployment

### Strategic Alignment
- **Phase**: MMP (Minimum Marketable Product)
- **Integration**: This token is the foundation for liquidity and rewards.

### Related Issues
- **#34 (Nostra Points / Rewards)**: The Point Token system will function alongside the Stable Token (Alea).
- **#51 (Support Market Maker Bot)**: Market Maker bots require this token for providing liquidity and arbitrage.

---

## Comments

### @linked0 — 2026-01-29T06:50:40Z

This issue needs to be discussed throughly with the board members, @Abdulkarim4u , and @tschanyoo , so I'll set it aside for later. Currently, I have implemented and deployed the $ALEA token, but this could be replaced with another concept or token in the future.

---

### @Abdulkarim4u — 2026-01-30T07:36:52Z

Great   that sounds cool , lets talk about it .

---

