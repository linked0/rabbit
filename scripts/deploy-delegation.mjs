#!/usr/bin/env node
// J2 / R-A — MetaMask delegation framework를 로컬 anvil에 배포한다.
//
// 왜 필요한가: `app/poc/aa/SessionKeyDemo.tsx`가 쓰는 ERC-7715
// (`wallet_requestExecutionPermissions`)는 **MetaMask 확장이 답하는** 호출이라
// 확장이 그 체인을 지원해야 하고, DelegationManager 주소도 지갑이 응답으로
// 알려준다(SDK에 하드코딩된 주소가 하나도 없다는 점이 그 증거다). anvil(31337)은
// 그 목록에 없을 가능성이 높다.
//
// 그래서 우리는 프레임워크를 **직접 배포**하고, mandate를 평범한 EIP-712
// typed-data 서명(`eth_signTypedData_v4`)으로 받는다 — 이 경로는 ERC-7715 지원과
// 무관하게 어느 체인에서든 동작한다. 상한과 만료를 실제로 강제하는 것은 그래도
// 온체인 컨트랙트다: ERC20TransferAmountEnforcer 와 TimestampEnforcer.
//
// 실행: node scripts/deploy-delegation.mjs
// 산출: .delegation-anvil.json  (git 에 넣지 않는다 — reset.sh 때마다 달라진다)

import { createPublicClient, createWalletClient, http, defineChain } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { deploySmartAccountsEnvironment } from "@metamask/smart-accounts-kit/utils";
import { writeFileSync } from "node:fs";

const RPC = process.env.ANVIL_RPC_URL ?? "http://127.0.0.1:8545";
// anvil 기본 계정 0. 로컬 전용 키이고, 이 파일 밖으로 나가지 않는다.
const DEPLOYER =
  process.env.ANVIL_DEPLOYER_KEY ??
  "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const OUT = ".delegation-anvil.json";

const probe = createPublicClient({ transport: http(RPC) });
const chainId = await probe.getChainId().catch(() => {
  console.error(`\n  anvil에 닿지 않습니다: ${RPC}\n  먼저 anvil을 띄우세요.\n`);
  process.exit(1);
});

// chainId 를 하드코딩하지 않는 이유는 verex 의 exchange 주소와 같다 — 로컬 환경이
// 바뀌면 조용히 틀린 도메인에 서명하게 된다.
const chain = defineChain({
  id: chainId,
  name: `local-${chainId}`,
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: { default: { http: [RPC] } },
});

const account = privateKeyToAccount(DEPLOYER);
const publicClient = createPublicClient({ chain, transport: http(RPC) });
const walletClient = createWalletClient({ account, chain, transport: http(RPC) });

console.log(`deploying delegation framework → chainId ${chainId} (${RPC})`);
console.log(`deployer ${account.address}`);
console.time("deployed in");

const environment = await deploySmartAccountsEnvironment(walletClient, publicClient, chain);

console.timeEnd("deployed in");

writeFileSync(OUT, JSON.stringify({ chainId, environment }, null, 2) + "\n");

console.log(`\n  DelegationManager               ${environment.DelegationManager}`);
console.log(`  SimpleFactory                   ${environment.SimpleFactory}`);
console.log(`  HybridDeleGatorImpl             ${environment.implementations.HybridDeleGatorImpl}`);
// R-A 가 실제로 기대는 두 컨트랙트. 상한과 만료가 여기서 강제된다.
console.log(`  ERC20TransferAmountEnforcer     ${environment.caveatEnforcers.ERC20TransferAmountEnforcer}`);
console.log(`  TimestampEnforcer               ${environment.caveatEnforcers.TimestampEnforcer}`);
console.log(`\n  → ${OUT}\n`);
