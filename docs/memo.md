# Temp

> **Rule: newest first.** Temporary notes for the current task. Add new entries at the top of this part.

## 2026-09-01 — why local resets did NOT use `packages/contracts/.env`'s VEREX_OPERATOR_KEY

The split was not "secrets in their own file" — it was **"the real-network key stays off the local path"**:

1. That key is the **real Sepolia deployer** (`0xABDB…`, nonce 434 upstream). If local resets used it, a shell
   that had sourced `packages/contracts/.env` could broadcast a "local" reset to real Sepolia (runbook 0).
   `reset.sh:44` therefore defaults to anvil #0 (`0xac0974…` → `0xf39F…`) and `export`s it; dotenv in
   `seed.ts` never overrides an existing variable, so the file's key loses.
2. anvil #0 is the right local operator anyway: 10 000 ETH, seed strips its 7702 code, faucet/MM/resolution sign as it.
3. The file is still used where it should be: Foundry auto-loads `.env` from `packages/contracts` for manual
   `forge script … --broadcast` (the testnet path).

`${VAR:-default}` reads a **shell variable**, never a file — a `.env` only enters the shell via `source` or dotenv.

**2026-09-01 change (jay):** `VEREX_OPERATOR_KEY` moved to verex root `.env` for convenience. Consequences:
the local fork is now deployed/operated by `0xABDB…` (fund it on the fork before `reset.sh`; ~32 seed txs);
the API warns `Operator mismatch` until `reset.sh` re-seeds; safety now rests only on `VEREX_RPC_URL` being loopback.

## 2026-09-01 — why approve / seed-news / faucet before a tick

```bash
ANVIL_RPC_URL=http://127.0.0.1:8545 pnpm agent:approve
pnpm agent:seed-news
curl -s -X POST -H 'content-type: application/json' -d '{"address":"<AGENT_OR_OWNER_ADDRESS>"}' http://127.0.0.1:4000/faucet
```

- **`agent:approve`** — one-time on-chain approvals from the **agent** EOA: ERC-20 `approve` (BUY) and
  ERC-1155 `setApprovalForAll` (SELL). verex's `checkExternalFunds` only *reads* an external
  maker's balance/allowance; it never approves on its behalf, so without this every BUY fails with
  `insufficient USDC allowance` and every SELL with `has not approved the exchange for CTF transfers`.
  Two txs → the agent needs ETH first. `ANVIL_RPC_URL=` prefix because the script reads it from the
  process env, not `.env` (bare, it talks to :8545). Idempotent.
- **`agent:seed-news`** — `estimate()` refuses to call the LLM with no news (a prior can't beat a live
  book), so an empty news store always yields `SKIP_NO_ESTIMATE`. Seeds use relative timestamps
  (90/55/20 min ago) to stay inside the 48 h window — rerun before each demo.
- **`/faucet`** — MockUSDC mint on the fork. Fund the **owner** you grant from (the mandate lets the
  agent *pull* USDC out of the owner; the 7715 path skips `/prepare`, which is what funded the owner
  on 31337) and optionally the **agent** as a cushion.

Order: ETH → approve → faucet → seed → grant → tick.

# Memo

## 2026-09-09 — anvil default accounts (deterministic dev keys)

Mnemonic `test test test test test test test test test test test junk`. **Public dev keys — never secrets**; identical on every anvil. Jayverse deployers: personas → **#4**, token → **#7**, defi/others → **#0**.

| # | Address | Private key |
|---|---------|-------------|
| 0 | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| 1 | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| 2 | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |
| 3 | `0x90F79bf6EB2c4f870365E785982E1f101E93b906` | `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6` |
| 4 | `0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65` | `0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a` |
| 5 | `0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc` | `0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba` |
| 6 | `0x976EA74026E726554dB657fA54763abd0C3a0aa9` | `0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e` |
| 7 | `0x14dC79964da2C08b23698B3D3cc7Ca32193d9955` | `0x4bbbf85ce3377467afe5d46f804f221813b2bb87f24d81f60f1fcdbf7cbf4356` |
| 8 | `0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f` | `0xdbda1821b80551c9d65939329250298aa3472ba22feea921c0cf5d620ea67b97` |
| 9 | `0xa0Ee7A142d267C1f36714E4a8F75612F20a79720` | `0x2a871d0798f97d79848a013d4936a73bf4cc922c825d33c1cf7073dff6d409c6` |

## 1. Sepolia fork anvil (persistent state)

```bash
cd /Users/jay/work
set -a; source rabbit/.env; set +a
anvil --fork-url "$SEPOLIA_RPC" --fork-block-number 11609470 --chain-id 11155111 --state ./anvil-sepolia-state.json --state-interval 60
```

**First run** creates the state file — keep `--fork-block-number` to pin the fork block.

**Resume** — same command, but the file now exists so `--state` *loads* it. **Drop `--fork-block-number`** (the block env is restored from the file; a mismatch can conflict):

```bash
cd /Users/jay/work
set -a; source rabbit/.env; set +a
anvil --fork-url "$SEPOLIA_RPC" --chain-id 11155111 --state ./anvil-sepolia-state.json --state-interval 60
```

`--state` = `--load-state` + `--dump-state` (load if the file exists, dump on exit); `--state-interval 60` snapshots every 60 s so a crash keeps the session. `forge test` needs no anvil; `deploy`/`study`/`dev` do.

## 2. verex (API only — root `pnpm dev` also starts web on :3000)

```bash
cd /Users/jay/work/verex
./scripts/reset.sh                      # first time / after deleting the state file
pnpm --filter @verex/api dev            # :4000
curl -s http://127.0.0.1:4000/config    # expect chainId 11155111, tradingEnabled true
```

## 3. rabbit (rerun approve + faucet after every reset.sh — USDC/exchange addresses change)

```bash
cd /Users/jay/work/rabbit
pnpm dev                                # :3100
ANVIL_RPC_URL=http://127.0.0.1:8545 pnpm agent:approve
pnpm agent:seed-news
curl -s -X POST -H 'content-type: application/json' -d '{"address":"<AGENT_OR_OWNER_ADDRESS>"}' http://127.0.0.1:4000/faucet
```

## 4. Test

1. MetaMask → Sepolia, RPC `http://127.0.0.1:8545`, an account that is **not** the agent.
2. Fund it: faucet (above) + ETH (below).
3. `http://127.0.0.1:3100/live/agent/console` → Connect → **Grant mandate** → MetaMask's own "up to 10 USDC, 60 min" popup.
4. Tick `us-federal-stablecoin-law-2026` with a short `cooldownSec` → expect `TRADED … (drawn on-chain 0x…)`.
5. Tick `eth-above-10k-2026` → expect `SKIP_EDGE`.

## Transfer ETH from a private key to an address

```bash
cast send <TO_ADDRESS> --value 10ether --private-key <PRIVATE_KEY> --rpc-url http://127.0.0.1:8545
cast balance <TO_ADDRESS> --ether --rpc-url http://127.0.0.1:8545
```

Example — anvil #0 (`0xf39F…2266`) → `0xABDB…6d8B`:

```bash
cast send 0xABDB93C5642f3342D5195fcf8c1A735e32266d8B --value 10ether --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545
cast balance 0xABDB93C5642f3342D5195fcf8c1A735e32266d8B --ether --rpc-url http://127.0.0.1:8545
```

# Backup