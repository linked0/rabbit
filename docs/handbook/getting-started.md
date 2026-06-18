# Getting Started

Day-1 setup for a new project or contributor.

## Prerequisites
- **Node.js 20+** and [pnpm](https://pnpm.io) v9+ (JS/TS projects)
- [Foundry](https://book.getfoundry.sh) (Solidity projects)
- **Git** + a GitHub account with repo access

## Typical first run
```bash
git clone <repo-url> && cd <repo>
pnpm install      # install dependencies
pnpm build        # build all packages
pnpm test         # run the test suite
```
For Solidity packages: `forge build` / `forge test`.

## Per-project specifics
Each repo's own `README.md` is the source of truth for how to run and deploy it
(environment variables, local services, ports). **Start there.**
