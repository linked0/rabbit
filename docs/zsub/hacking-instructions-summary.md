# Smart Contract Hacking Instructions — Summary

Two sets of CTF-style smart contract security exercises. Each `.md` defines an attacker scenario (Intro / Accounts / Tasks) on a target contract; the standard task structure is **(1) exploit the vulnerability → (2) patch the contract → (3) sometimes propose alternate fixes**. Each exercise has a paired `.pdf`.

- 📁 [hacking-Instructions-1/](./hacking-Instructions-1/) — fundamentals (19 exercises across 7 categories)
- 📁 [hacking-instructions-2/](./hacking-instructions-2/) — DeFi & advanced attacks (35 exercises across 11 categories)

---

## Set 1 — Fundamentals

Core vulnerability classes. Start here if new to smart contract security.

| Category | What it teaches | Exercises |
|---|---|---|
| **Access Control** | Missing/incorrect permission checks (modifiers, owner roles, delegatecall to untrusted code) | 1 ([md](./hacking-Instructions-1/access-control-1.md) / [pdf](./hacking-Instructions-1/access-control-1.pdf)) · 2 ([md](./hacking-Instructions-1/access-control-2.md) / [pdf](./hacking-Instructions-1/access-control-2.pdf)) · 3 ([md](./hacking-Instructions-1/access-control-3.md) / [pdf](./hacking-Instructions-1/access-control-3.pdf)) · 4 ([md](./hacking-Instructions-1/access-control-4.md) / [pdf](./hacking-Instructions-1/access-control-4.pdf)) |
| **Arithmetic Overflows** | Integer over/underflow (pre-0.8 Solidity, unchecked blocks, casting bugs) | 1 ([md](./hacking-Instructions-1/arithmetic-overflows-1.md) / [pdf](./hacking-Instructions-1/arithmetic-overflows-1.pdf)) · 2 ([md](./hacking-Instructions-1/arithmetic-overflows-2.md) / [pdf](./hacking-Instructions-1/arithmetic-overflows-2.pdf)) · 3 ([md](./hacking-Instructions-1/arithmetic-overflows-3.md) / [pdf](./hacking-Instructions-1/arithmetic-overflows-3.pdf)) · 4 ([md](./hacking-Instructions-1/arithmetic-overflows-4.md) / [pdf](./hacking-Instructions-1/arithmetic-overflows-4.pdf)) |
| **ERC20** | Token-spec edge cases — approval race, fee-on-transfer, missing return values | 1 ([md](./hacking-Instructions-1/erc20-1.md) / [pdf](./hacking-Instructions-1/erc20-1.pdf)) · 2 ([md](./hacking-Instructions-1/erc20-2.md) / [pdf](./hacking-Instructions-1/erc20-2.pdf)) |
| **ERC721** | NFT-spec pitfalls — `safeTransferFrom` reentrancy hooks, ownership checks | 1 ([md](./hacking-Instructions-1/erc721-1.md) / [pdf](./hacking-Instructions-1/erc721-1.pdf)) · 2 ([md](./hacking-Instructions-1/erc721-2.md) / [pdf](./hacking-Instructions-1/erc721-2.pdf)) |
| **Randomness Vulnerabilities** | On-chain "randomness" using `block.timestamp`/`blockhash` is predictable | 1 ([md](./hacking-Instructions-1/randomness-vulnerabilities-1.md) / [pdf](./hacking-Instructions-1/randomness-vulnerabilities-1.pdf)) · 2 ([md](./hacking-Instructions-1/randomness-vulnerabilities-2.md) / [pdf](./hacking-Instructions-1/randomness-vulnerabilities-2.pdf)) |
| **Reentrancy** | Classic + cross-function + read-only reentrancy. Bank/EtherBank-style targets | 1 ([md](./hacking-Instructions-1/reentrancy-1.md) / [pdf](./hacking-Instructions-1/reentrancy-1.pdf)) · 2 ([md](./hacking-Instructions-1/reentrancy-2.md) / [pdf](./hacking-Instructions-1/reentrancy-2.pdf)) · 3 ([md](./hacking-Instructions-1/reentrancy-3.md) / [pdf](./hacking-Instructions-1/reentrancy-3.pdf)) · 4 ([md](./hacking-Instructions-1/reentrancy-4.md) / [pdf](./hacking-Instructions-1/reentrancy-4.pdf)) |
| **tx.origin Phishing** | Why `tx.origin` for auth is unsafe — attacker contract can impersonate user | 1 ([md](./hacking-Instructions-1/tx-origin-phishing-1.md) / [pdf](./hacking-Instructions-1/tx-origin-phishing-1.pdf)) |

---

## Set 2 — DeFi & Advanced

Composability, oracles, MEV, governance — the categories that produce real-world losses.

| Category | What it teaches | Exercises |
|---|---|---|
| **DAO Attack** | Governance hijacking — token-borrow voting, proposal/queue/execute flaws | 1 ([md](./hacking-instructions-2/dao-attack-1.md) / [pdf](./hacking-instructions-2/dao-attack-1.pdf)) · 2 ([md](./hacking-instructions-2/dao-attack-2.md) / [pdf](./hacking-instructions-2/dao-attack-2.pdf)) · 3 ([md](./hacking-instructions-2/dao-attack-3.md) / [pdf](./hacking-instructions-2/dao-attack-3.pdf)) |
| **DEX** | AMM invariant violations — pool draining via reserve manipulation | 1 ([md](./hacking-instructions-2/dex-1.md) / [pdf](./hacking-instructions-2/dex-1.pdf)) · 2 ([md](./hacking-instructions-2/dex-2.md) / [pdf](./hacking-instructions-2/dex-2.pdf)) |
| **DoS (Denial of Service)** | Out-of-gas loops, blocked withdrawals, push-vs-pull payment patterns | 1 ([md](./hacking-instructions-2/dos-1.md) / [pdf](./hacking-instructions-2/dos-1.pdf)) · 2 ([md](./hacking-instructions-2/dos-2.md) / [pdf](./hacking-instructions-2/dos-2.pdf)) · 3 ([md](./hacking-instructions-2/dos-3.md) / [pdf](./hacking-instructions-2/dos-3.pdf)) · 4 ([md](./hacking-instructions-2/dos-4.md) / [pdf](./hacking-instructions-2/dos-4.pdf)) |
| **Flash Loan Attacks** | Using flash loans to drain pools (combined with reentrancy / price manipulation) | 1 ([md](./hacking-instructions-2/flash-loan-attacks-1.md) / [pdf](./hacking-instructions-2/flash-loan-attacks-1.pdf)) · 2 ([md](./hacking-instructions-2/flash-loan-attacks-2.md) / [pdf](./hacking-instructions-2/flash-loan-attacks-2.pdf)) |
| **Flash Loans** | Flash loan provider mechanics — fee accounting, repayment checks | 1 ([md](./hacking-instructions-2/flash-loans-1.md) / [pdf](./hacking-instructions-2/flash-loans-1.pdf)) · 2 ([md](./hacking-instructions-2/flash-loans-2.md) / [pdf](./hacking-instructions-2/flash-loans-2.pdf)) · 3 ([md](./hacking-instructions-2/flash-loans-3.md) / [pdf](./hacking-instructions-2/flash-loans-3.pdf)) |
| **Frontrunning** | Mempool MEV — sandwich, replay-with-higher-gas, commit-reveal as defense | 1 ([md](./hacking-instructions-2/frontrunning-1.md) / [pdf](./hacking-instructions-2/frontrunning-1.pdf)) · 2 ([md](./hacking-instructions-2/frontrunning-2.md) / [pdf](./hacking-instructions-2/frontrunning-2.pdf)) · 3 ([md](./hacking-instructions-2/frontrunning-3.md) / [pdf](./hacking-instructions-2/frontrunning-3.pdf)) |
| **Money Markets** | Lending protocol exploits — collateral pricing, liquidation manipulation | 1 ([md](./hacking-instructions-2/money-markets-1.md) / [pdf](./hacking-instructions-2/money-markets-1.pdf)) · 2 ([md](./hacking-instructions-2/money-markets-2.md) / [pdf](./hacking-instructions-2/money-markets-2.pdf)) |
| **Oracle Manipulation** | Spot-price oracle attacks (TWAP defense), off-chain oracle key/source hijack | 1 ([md](./hacking-instructions-2/oracle-manipulation-1.md) / [pdf](./hacking-instructions-2/oracle-manipulation-1.pdf)) · 2 ([md](./hacking-instructions-2/oracle-manipulation-2.md) / [pdf](./hacking-instructions-2/oracle-manipulation-2.pdf)) · 3 ([md](./hacking-instructions-2/oracle-manipulation-3.md) / [pdf](./hacking-instructions-2/oracle-manipulation-3.pdf)) |
| **Replay Attack** | Signature reuse across chains/contracts/nonces — EIP-712 domain separation | 1 ([md](./hacking-instructions-2/replay-attack-1.md) / [pdf](./hacking-instructions-2/replay-attack-1.pdf)) · 2 ([md](./hacking-instructions-2/replay-attack-2.md) / [pdf](./hacking-instructions-2/replay-attack-2.pdf)) · 3 ([md](./hacking-instructions-2/replay-attack-3.md) / [pdf](./hacking-instructions-2/replay-attack-3.pdf)) |
| **Sensitive On-Chain Data** | "Private" storage isn't private — slot reading, leaked secrets | 1 ([md](./hacking-instructions-2/sensitive-on-chain-data-1.md) / [pdf](./hacking-instructions-2/sensitive-on-chain-data-1.pdf)) · 2 ([md](./hacking-instructions-2/sensitive-onchain-data-2.md) / [pdf](./hacking-instructions-2/sensitive-onchain-data-2.pdf)) · 3 ([md](./hacking-instructions-2/sensitive-onchain-data-3.md) / [pdf](./hacking-instructions-2/sensitive-onchain-data-3.pdf)) |
| **Unchecked Returns** | `call` / `send` / low-level calls silently fail; missing success checks | 1 ([md](./hacking-instructions-2/unchecked-returns-1.md) / [pdf](./hacking-instructions-2/unchecked-returns-1.pdf)) · 2 ([md](./hacking-instructions-2/unchecked-returns-2.md) / [pdf](./hacking-instructions-2/unchecked-returns-2.pdf)) · 3 ([md](./hacking-instructions-2/unchecked-returns-3.md) / [pdf](./hacking-instructions-2/unchecked-returns-3.pdf)) |

---

## Suggested Study Order

1. **Set 1** in listed order (Access Control → Reentrancy is the natural progression for breaking single contracts).
2. **Set 2 — Unchecked Returns / DoS / Sensitive Data** before DeFi attacks (cheap fundamentals first).
3. **Set 2 — Oracle Manipulation → Flash Loans → Flash Loan Attacks → DEX → Money Markets** (DeFi composability stack — these build on each other).
4. **Set 2 — Frontrunning, Replay, DAO** as standalone categories.

## Format Convention

Every exercise file follows:
- **Intro** — scenario / target contract description
- **Accounts** — usually 0 = deployer, last index = Attacker (You)
- **Tasks** — numbered, with Task 1 = exploit, Task 2 = patch, Task 3+ = alternate defenses

Solutions are **not** included in this folder — these are practice prompts, not write-ups.
