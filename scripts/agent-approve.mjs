#!/usr/bin/env node
// J2 / R-B — 에이전트 EOA 가 verex Exchange 에 USDC 사용을 승인한다.
//
// **왜 별도 단계인가** (2026-08-27, jay 가 "Recent activity 에 거래가 안 보인다"고
// 물어서 드러났다). verex 의 `checkExternalFunds` 는 외부 메이커에 대해 **읽고
// 거절**한다 — 대신 발행해 주지도, 대신 승인해 주지도 않는다. 그게 V-B 의 요지다.
// 그런데 rabbit 쪽에는 승인을 넣는 코드가 어디에도 없었다. 그래서 에이전트가
// USDC 를 갖고 가스를 갖고 있어도 매수 주문은 전부 400 으로 거절된다:
//
//   insufficient USDC allowance for the exchange: have 0, need N
//
// 서명은 오프체인이지만 **승인은 온체인 트랜잭션**이라 에이전트에게 가스가 필요하다.
// 거래 자체는 여전히 무료다(체결은 verex operator 가 보낸다) — 승인 한 번만 예외다.
//
// 멱등: 이미 충분히 승인돼 있으면 아무것도 보내지 않는다.
// Exchange 주소는 **반드시 /config 에서 읽는다** — reset.sh 마다 바뀐다.

import { createWalletClient, createPublicClient, http, parseUnits, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { anvil } from "viem/chains";
import { readFileSync, existsSync } from "node:fs";

const RPC = process.env.ANVIL_RPC_URL ?? "http://127.0.0.1:8545";
const VEREX = process.env.VEREX_API_URL ?? "http://127.0.0.1:4000";
// 무한 승인을 쓰지 않는 이유: 이 데모의 주장이 "상한은 온체인에서 강제된다"인데,
// 화면 밖에서 무한 승인을 걸어 두면 그 문장이 읽는 사람에게 덜 정직해진다.
// 위임 상한과는 다른 축이지만, 기본값은 넉넉하되 유한한 편이 낫다.
const AMOUNT = Number(process.env.AGENT_APPROVE_USDC ?? 10_000);

function agentKey() {
  if (process.env.AGENT_PRIVATE_KEY) return process.env.AGENT_PRIVATE_KEY.trim();
  for (const f of [".env", ".env.local"]) {
    if (!existsSync(f)) continue;
    const m = readFileSync(f, "utf8").match(/^AGENT_PRIVATE_KEY=(.+)$/m);
    if (m) return m[1].trim().replace(/^["']|["']$/g, "");
  }
  throw new Error("AGENT_PRIVATE_KEY is not set (env or .env) — see .env.example §17");
}

const ERC20 = [
  { name: "approve", type: "function", stateMutability: "nonpayable",
    inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }],
    outputs: [{ type: "bool" }] },
  { name: "allowance", type: "function", stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }],
    outputs: [{ type: "uint256" }] },
  { name: "balanceOf", type: "function", stateMutability: "view",
    inputs: [{ name: "account", type: "address" }], outputs: [{ type: "uint256" }] },
];

const cfg = await fetch(`${VEREX}/config`).then((r) => r.json());
if (!cfg.usdc || !cfg.exchange) throw new Error("verex /config has no usdc/exchange — is it seeded?");

const account = privateKeyToAccount(agentKey());
const publicClient = createPublicClient({ chain: anvil, transport: http(RPC) });
const wallet = createWalletClient({ account, chain: anvil, transport: http(RPC) });

const need = parseUnits(String(AMOUNT), 6);
const [allowance, balance, gas] = await Promise.all([
  publicClient.readContract({ address: cfg.usdc, abi: ERC20, functionName: "allowance", args: [account.address, cfg.exchange] }),
  publicClient.readContract({ address: cfg.usdc, abi: ERC20, functionName: "balanceOf", args: [account.address] }),
  publicClient.getBalance({ address: account.address }),
]);

console.log(`agent    ${account.address}`);
console.log(`exchange ${cfg.exchange}   (read from /config — it changes on every reset.sh)`);
console.log(`USDC     ${formatUnits(balance, 6)}   allowance ${formatUnits(allowance, 6)}   gas ${formatUnits(gas, 18)} ETH`);

if (allowance >= need) {
  console.log(`\n✓ already approved for ≥ ${AMOUNT} USDC — nothing sent.`);
  process.exit(0);
}
if (gas === 0n) {
  console.error(
    `\n✗ the agent holds no native token, so it cannot send the approval.\n` +
      `  Approving is the one on-chain transaction the agent pays for itself; trading is free\n` +
      `  (verex's operator sends the match). On anvil:\n` +
      `  cast send ${account.address} --value 1ether --private-key <anvil #0 key>`,
  );
  process.exit(1);
}

const hash = await wallet.writeContract({
  address: cfg.usdc, abi: ERC20, functionName: "approve", args: [cfg.exchange, need],
});
await publicClient.waitForTransactionReceipt({ hash });
console.log(`\n✓ approved ${AMOUNT} USDC to the exchange — ${hash}`);
