#!/usr/bin/env node
// J2 / R-A — 옵션 c 의 주장을 **실제 체인에서** 검증한다.
//
// 이 스크립트가 존재하는 이유: "상한과 만료를 체인이 강제한다"는 문장은 데모의
// 전부인데, 코드를 읽는 것만으로는 참인지 알 수 없다. 여기서는 세 가지를 실제로
// 실행하고 컨트랙트가 뭐라고 거절하는지 그대로 출력한다.
//
//   1. 위임 안에서의 인출 → 성공해야 한다
//   2. 상한 초과 → ERC20TransferAmountEnforcer:allowance-exceeded
//   3. 만료 후 → TimestampEnforcer:expired-delegation
//
// 3번이 핵심이다: **아무도 취소하지 않았다.** 창이 닫혔을 뿐이고, 같은 코드가
// 같은 키로 계속 돌면서 계속 무해하게 거절당한다.
//
// 선행: anvil 실행, 그리고 node scripts/deploy-delegation.mjs
// 실행: node scripts/verify-delegation.mjs
//
// MetaMask 대신 anvil #1 키로 서명하지만 **서명 방식은 완전히 같다** —
// 브라우저에서도 이것은 평범한 eth_signTypedData_v4 다.
import { createPublicClient, createWalletClient, http, defineChain, parseUnits, encodeFunctionData, publicActions } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { createDelegation, createExecution, toMetaMaskSmartAccount, Implementation, ScopeType, CaveatType, ExecutionMode } from "@metamask/smart-accounts-kit";
import { overrideDeployedEnvironment, SIGNABLE_DELEGATION_TYPED_DATA, toDelegationStruct } from "@metamask/smart-accounts-kit/utils";
import { DelegationManager } from "@metamask/smart-accounts-kit/contracts";
import { readFileSync } from "node:fs";

// 최소 ERC20. verex 의 MockUSDC 를 쓰지 않는 이유는 이 검증이 verex 없이도
// 돌아야 하기 때문이다 — 검증 대상은 위임이지 예측시장이 아니다.
const MOCK_USDC_BYTECODE = "0x60806040526040518060400160405280600881526020017f4d6f636b555344430000000000000000000000000000000000000000000000008152505f908162000049919062000323565b506040518060400160405280600481526020017f55534443000000000000000000000000000000000000000000000000000000008152506001908162000090919062000323565b50600660025f6101000a81548160ff021916908360ff160217905550348015620000b8575f80fd5b5062000407565b5f81519050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52604160045260245ffd5b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f60028204905060018216806200013b57607f821691505b602082108103620001515762000150620000f6565b5b50919050565b5f819050815f5260205f209050919050565b5f6020601f8301049050919050565b5f82821b905092915050565b5f60088302620001b57fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8262000178565b620001c1868362000178565b95508019841693508086168417925050509392505050565b5f819050919050565b5f819050919050565b5f6200020b62000205620001ff84620001d9565b620001e2565b620001d9565b9050919050565b5f819050919050565b6200022683620001eb565b6200023e620002358262000212565b84845462000184565b825550505050565b5f90565b6200025462000246565b620002618184846200021b565b505050565b5b8181101562000288576200027c5f826200024a565b60018101905062000267565b5050565b601f821115620002d757620002a18162000157565b620002ac8462000169565b81016020851015620002bc578190505b620002d4620002cb8562000169565b83018262000266565b50505b505050565b5f82821c905092915050565b5f620002f95f1984600802620002dc565b1980831691505092915050565b5f620003138383620002e8565b9150826002028217905092915050565b6200032e82620000bf565b67ffffffffffffffff8111156200034a5762000349620000c9565b5b62000356825462000123565b620003638282856200028c565b5f60209050601f83116001811462000399575f841562000384578287015190505b62000390858262000306565b865550620003ff565b601f198416620003a98662000157565b5f5b82811015620003d257848901518255600182019150602085019450602081019050620003ab565b86831015620003f25784890151620003ee601f891682620002e8565b8355505b6001600288020188555050505b505050505050565b610e2f80620004155f395ff3fe608060405234801561000f575f80fd5b5060043610610091575f3560e01c806340c10f191161006457806340c10f191461013157806370a082311461014d57806395d89b411461017d578063a9059cbb1461019b578063dd62ed3e146101cb57610091565b806306fdde0314610095578063095ea7b3146100b357806323b872dd146100e3578063313ce56714610113575b5f80fd5b61009d6101fb565b6040516100aa9190610a02565b60405180910390f35b6100cd60048036038101906100c89190610ab3565b610286565b6040516100da9190610b0b565b60405180910390f35b6100fd60048036038101906100f89190610b24565b610373565b60405161010a9190610b0b565b60405180910390f35b61011b610653565b6040516101289190610b8f565b60405180910390f35b61014b60048036038101906101469190610ab3565b610665565b005b61016760048036038101906101629190610ba8565b610721565b6040516101749190610be2565b60405180910390f35b610185610736565b6040516101929190610a02565b60405180910390f35b6101b560048036038101906101b09190610ab3565b6107c2565b6040516101c29190610b0b565b60405180910390f35b6101e560048036038101906101e09190610bfb565b610958565b6040516101f29190610be2565b60405180910390f35b5f805461020790610c66565b80601f016020809104026020016040519081016040528092919081815260200182805461023390610c66565b801561027e5780601f106102555761010080835404028352916020019161027e565b820191905f5260205f20905b81548152906001019060200180831161026157829003601f168201915b505050505081565b5f8160045f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f20819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040516103619190610be2565b60405180910390a36001905092915050565b5f8160045f8673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f2054101561042f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161042690610ce0565b60405180910390fd5b8160035f8673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205410156104af576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016104a690610d48565b60405180910390fd5b8160045f8673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8282546105369190610d93565b925050819055508160035f8673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8282546105899190610d93565b925050819055508160035f8573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8282546105dc9190610dc6565b925050819055508273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040516106409190610be2565b60405180910390a3600190509392505050565b60025f9054906101000a900460ff1681565b8060035f8473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8282546106b19190610dc6565b925050819055508173ffffffffffffffffffffffffffffffffffffffff165f73ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef836040516107159190610be2565b60405180910390a35050565b6003602052805f5260405f205f915090505481565b6001805461074390610c66565b80601f016020809104026020016040519081016040528092919081815260200182805461076f90610c66565b80156107ba5780601f10610791576101008083540402835291602001916107ba565b820191905f5260205f20905b81548152906001019060200180831161079d57829003601f168201915b505050505081565b5f8160035f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f20541015610843576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161083a90610d48565b60405180910390fd5b8160035f3373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f82825461088f9190610d93565b925050819055508160035f8573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020015f205f8282546108e29190610dc6565b925050819055508273ffffffffffffffffffffffffffffffffffffffff163373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef846040516109469190610be2565b60405180910390a36001905092915050565b6004602052815f5260405f20602052805f5260405f205f91509150505481565b5f81519050919050565b5f82825260208201905092915050565b5f5b838110156109af578082015181840152602081019050610994565b5f8484015250505050565b5f601f19601f8301169050919050565b5f6109d482610978565b6109de8185610982565b93506109ee818560208601610992565b6109f7816109ba565b840191505092915050565b5f6020820190508181035f830152610a1a81846109ca565b905092915050565b5f80fd5b5f73ffffffffffffffffffffffffffffffffffffffff82169050919050565b5f610a4f82610a26565b9050919050565b610a5f81610a45565b8114610a69575f80fd5b50565b5f81359050610a7a81610a56565b92915050565b5f819050919050565b610a9281610a80565b8114610a9c575f80fd5b50565b5f81359050610aad81610a89565b92915050565b5f8060408385031215610ac957610ac8610a22565b5b5f610ad685828601610a6c565b9250506020610ae785828601610a9f565b9150509250929050565b5f8115159050919050565b610b0581610af1565b82525050565b5f602082019050610b1e5f830184610afc565b92915050565b5f805f60608486031215610b3b57610b3a610a22565b5b5f610b4886828701610a6c565b9350506020610b5986828701610a6c565b9250506040610b6a86828701610a9f565b9150509250925092565b5f60ff82169050919050565b610b8981610b74565b82525050565b5f602082019050610ba25f830184610b80565b92915050565b5f60208284031215610bbd57610bbc610a22565b5b5f610bca84828501610a6c565b91505092915050565b610bdc81610a80565b82525050565b5f602082019050610bf55f830184610bd3565b92915050565b5f8060408385031215610c1157610c10610a22565b5b5f610c1e85828601610a6c565b9250506020610c2f85828601610a6c565b9150509250929050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52602260045260245ffd5b5f6002820490506001821680610c7d57607f821691505b602082108103610c9057610c8f610c39565b5b50919050565b7f616c6c6f770000000000000000000000000000000000000000000000000000005f82015250565b5f610cca600583610982565b9150610cd582610c96565b602082019050919050565b5f6020820190508181035f830152610cf781610cbe565b9050919050565b7f62616c00000000000000000000000000000000000000000000000000000000005f82015250565b5f610d32600383610982565b9150610d3d82610cfe565b602082019050919050565b5f6020820190508181035f830152610d5f81610d26565b9050919050565b7f4e487b71000000000000000000000000000000000000000000000000000000005f52601160045260245ffd5b5f610d9d82610a80565b9150610da883610a80565b9250828203905081811115610dc057610dbf610d66565b5b92915050565b5f610dd082610a80565b9150610ddb83610a80565b9250828201905080821115610df357610df2610d66565b5b9291505056fea26469706673582212204f47c51ce208e6a3f52f2af0dbdaf6565e4430f006e5bed79bd51d764f3cf3cd64736f6c63430008180033";

// The devnet (313370) is the primary target now, so the RPC is configurable —
// the same ANVIL_RPC_URL that deploy-delegation.mjs reads.
const RPC = process.env.ANVIL_RPC_URL ?? "http://127.0.0.1:8545";

// The expiry check warps time with evm_increaseTime, which the hosted devnet's
// proxy treats as an admin method — moving the chain's own clock is exactly
// what the allowlist exists to gate. A bare anvil ignores the header, so the
// same script works against both.
//   ADMIN_TOKEN=$(gcloud secrets versions access latest --secret=devnet-admin-token) \
//   ANVIL_RPC_URL=https://devnet.jaylabs.xyz/rpc node scripts/verify-delegation.mjs
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;
const transport = () =>
  http(RPC, ADMIN_TOKEN ? { fetchOptions: { headers: { Authorization: `Bearer ${ADMIN_TOKEN}` } } } : undefined);
let deployment;
try {
  deployment = JSON.parse(readFileSync(".delegation-anvil.json", "utf8"));
} catch {
  console.error("\n  .delegation-anvil.json 이 없습니다. 먼저: node scripts/deploy-delegation.mjs\n");
  process.exit(1);
}
const { chainId, environment } = deployment;
overrideDeployedEnvironment(chainId, "1.3.0", environment);
const chain = defineChain({ id: chainId, name: "anvil", nativeCurrency: { name: "E", symbol: "E", decimals: 18 }, rpcUrls: { default: { http: [RPC] } } });

// anvil #0 = deployer, #1 = "MetaMask 사용자", #2 = 에이전트
const deployer = privateKeyToAccount("0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80");
const ownerEoa = privateKeyToAccount("0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d");
const agent    = privateKeyToAccount("0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a");

const pub = createPublicClient({ chain, transport: transport() });
const wDeploy = createWalletClient({ account: deployer, chain, transport: transport() });
const wAgent = createWalletClient({ account: agent, chain, transport: transport() }).extend(publicActions);

// MockUSDC 배포
const bytecode = MOCK_USDC_BYTECODE;
const usdcHash = await wDeploy.deployContract({ abi: [], bytecode });
const usdc = (await pub.waitForTransactionReceipt({ hash: usdcHash })).contractAddress;
const erc20 = [
  { type: "function", name: "mint", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [], stateMutability: "nonpayable" },
  { type: "function", name: "balanceOf", inputs: [{ type: "address" }], outputs: [{ type: "uint256" }], stateMutability: "view" },
  { type: "function", name: "transfer", inputs: [{ type: "address" }, { type: "uint256" }], outputs: [{ type: "bool" }], stateMutability: "nonpayable" },
];
console.log("MockUSDC        ", usdc);

// 소유자 스마트 계정 배포
const sa = await toMetaMaskSmartAccount({ client: pub, implementation: Implementation.Hybrid, deployParams: [ownerEoa.address, [], [], []], deploySalt: "0x" });
const { factory, factoryData } = await sa.getFactoryArgs();
await pub.waitForTransactionReceipt({ hash: await wDeploy.sendTransaction({ to: factory, data: factoryData }) });
console.log("owner EOA       ", ownerEoa.address);
console.log("owner smart acct", sa.address);
console.log("agent           ", agent.address);

// 스마트 계정에 100 USDC
await pub.waitForTransactionReceipt({ hash: await wDeploy.writeContract({ address: usdc, abi: erc20, functionName: "mint", args: [sa.address, parseUnits("100", 6)] }) });

const bal = (who) => pub.readContract({ address: usdc, abi: erc20, functionName: "balanceOf", args: [who] }).then((v) => Number(v) / 1e6);

// mandate: 상한 10 USDC, 60초 뒤 만료
const block = await pub.getBlock();
const expiry = Number(block.timestamp) + 60;
const delegation = createDelegation({
  environment, from: sa.address, to: agent.address,
  scope: { type: ScopeType.Erc20TransferAmount, tokenAddress: usdc, maxAmount: parseUnits("10", 6) },
  caveats: [{ type: CaveatType.Timestamp, afterThreshold: 0, beforeThreshold: expiry }],
});
// MetaMask 가 하는 것과 같은 서명 — 평범한 EIP-712 typed data
const signature = await ownerEoa.signTypedData({
  domain: { chainId, name: "DelegationManager", version: "1", verifyingContract: environment.DelegationManager },
  types: SIGNABLE_DELEGATION_TYPED_DATA, primaryType: "Delegation",
  message: toDelegationStruct({ ...delegation, signature: "0x" }),
});
const signed = { ...delegation, signature };

const draw = async (amount) => {
  const execution = createExecution({ target: usdc, callData: encodeFunctionData({ abi: erc20, functionName: "transfer", args: [agent.address, parseUnits(String(amount), 6)] }) });
  const hash = await DelegationManager.execute.redeemDelegations({
    client: wAgent, delegationManagerAddress: environment.DelegationManager,
    delegations: [[signed]], modes: [ExecutionMode.SingleDefault], executions: [[execution]],
  });
  await pub.waitForTransactionReceipt({ hash });
};

console.log("\n--- 1. 위임 안에서 4 USDC 인출 ---");
await draw(4);
console.log("   agent USDC:", await bal(agent.address), "(기대 4)");

console.log("\n--- 2. 상한 초과: 누적 4+9 > 10 ---");
try { await draw(9); console.log("   !! 통과함 — 상한이 강제되지 않았다"); }
catch (e) { console.log("   거절됨:", JSON.stringify(DelegationManager.decode.redeemDelegationsError(e) ?? String(e).slice(0,120))); }
console.log("   agent USDC:", await bal(agent.address), "(여전히 4여야 함)");

console.log("\n--- 3. 만료 후 (시계를 120초 앞으로) ---");
await pub.request({ method: "evm_increaseTime", params: ["0x78"] });
await pub.request({ method: "evm_mine", params: [] });
try { await draw(1); console.log("   !! 통과함 — 만료가 강제되지 않았다"); }
catch (e) { console.log("   거절됨:", JSON.stringify(DelegationManager.decode.redeemDelegationsError(e) ?? String(e).slice(0,120))); }
console.log("   agent USDC:", await bal(agent.address), "(여전히 4여야 함)");
