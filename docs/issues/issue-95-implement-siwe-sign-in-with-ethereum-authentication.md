# Implement SIWE (Sign-In with Ethereum) Authentication

**Issue #95** | **State:** OPEN | **Created:** 2026-01-26T09:12:48Z

**Updated:** 2026-01-26T09:12:48Z | **Closed:** N/A

---

## Context
The current authentication system relies on client-side wallet connection state. While sufficient for reading public blockchain data, the MMP (Minimum Marketable Product) introduces off-chain features that require strict security:

- **Points & Rewards System (#34)**: Users earn points stored in the database.
- **User Settings**: Storing user preferences or profile data.

## Problem
Without cryptographic verification of a login session (JWT), a malicious actor could potentially spoof API requests to:
- Act as another user in off-chain systems.
- Cheat the points/rewards leaderboard.

## Requirement
Implement **Sign-In with Ethereum (SIWE)** (EIP-4361) to establish a secure, authenticated session.

1.  **Challenge-Response**: The server sends a nonce.
2.  **Signature**: The wallet signs the message.
3.  **Verification**: The server verifies the signature and issues a JWT.
4.  **Session**: Subsequent API requests use the JWT to prove identity.

## Strategic Alignment
- **Phase**: MMP
- **Priority**: High (Prerequisite for a secure Points System)

