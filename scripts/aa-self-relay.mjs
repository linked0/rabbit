// Jayverse AA §7 — 로컬 anvil 셀프 릴레이. 설계: docs/features/jayverse-rabbit.md §7.
//
// 번들러를 구현하지 않는다(2026-09-07 결정): anvil 은 Sepolia 의 chainId 를 그대로
// 보고하므로 thirdweb 의 chainId 기반 번들러는 진짜 Sepolia 로 가버린다. 대신 이
// 스크립트가 "그 한 번의 콜에 한해 우리가 번들러"가 된다 — 서명된 UserOp 하나를
// 자금 있는 anvil 계정으로 EntryPoint.handleOps([userOp], beneficiary) 에 직접 넣는다.
// 페이마스터도 생략한다: 스마트 계정에 anvil ETH 를 미리 넣는다.
//
// 전제: Sepolia 포크 anvil (canonical EntryPoint v0.6 0x5FF1…2789 와 Coinbase
// 스마트 월렛 팩토리를 포크로 물려받는다). 실행: node scripts/aa-self-relay.mjs
import { concat, createPublicClient, createWalletClient, http, parseEther } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { sepolia } from "viem/chains";
import {
  entryPoint06Abi,
  entryPoint06Address,
  getUserOperationHash,
  toCoinbaseSmartAccount,
} from "viem/account-abstraction";

const RPC = process.env.ANVIL_RPC_URL ?? "http://127.0.0.1:8545";
// anvil 기본 키 #0(오너)·#1(릴레이어) — 테스트 체인 전용의 공개된 키다.
const owner = privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
const relayer = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");

const publicClient = createPublicClient({ chain: sepolia, transport: http(RPC) });
const wallet = createWalletClient({ account: relayer, chain: sepolia, transport: http(RPC) });

const account = await toCoinbaseSmartAccount({ client: publicClient, owners: [owner] });
console.log("smart account:", account.address);

// 페이마스터 생략(§7) — 스마트 계정이 자기 가스를 내도록 anvil ETH 를 미리 넣는다.
const fund = await wallet.sendTransaction({ to: account.address, value: parseEther("1") });
await publicClient.waitForTransactionReceipt({ hash: fund });

// executeBatch 를 증명하는 무해한 2콜 배치 (0 ETH 셀프 송금 x2) — /live/aa pillar ③과 동일.
const callData = await account.encodeCalls([
  { to: owner.address, value: 0n },
  { to: relayer.address, value: 0n },
]);
const deployed = await account.isDeployed();
const { factory, factoryData } = await account.getFactoryArgs();
const gasPrice = await publicClient.getGasPrice();

const userOp = {
  sender: account.address,
  nonce: await account.getNonce(),
  initCode: deployed ? "0x" : concat([factory, factoryData]), // §4 counterfactual deploy — 첫 op 에만
  callData,
  callGasLimit: 400_000n,
  verificationGasLimit: 600_000n,
  preVerificationGas: 100_000n,
  maxFeePerGas: gasPrice * 2n,
  maxPriorityFeePerGas: 1_000_000_000n,
  paymasterAndData: "0x",
  signature: "0x",
};
userOp.signature = await account.signUserOperation(userOp);

const userOpHash = getUserOperationHash({
  chainId: sepolia.id,
  entryPointAddress: entryPoint06Address,
  entryPointVersion: "0.6",
  userOperation: userOp,
});
console.log("userOpHash:", userOpHash);

// 우리가 번들러다 — 릴레이어가 handleOps 를 부르고 beneficiary 로 가스를 돌려받는다.
const tx = await wallet.writeContract({
  address: entryPoint06Address,
  abi: entryPoint06Abi,
  functionName: "handleOps",
  args: [[userOp], relayer.address],
});
const receipt = await publicClient.waitForTransactionReceipt({ hash: tx });
console.log("handleOps tx:", receipt.transactionHash, "→", receipt.status);
console.log("account deployed:", await account.isDeployed());
