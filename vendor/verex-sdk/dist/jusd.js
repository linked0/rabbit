"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBalance = getBalance;
exports.getAllowance = getAllowance;
exports.mint = mint;
exports.approve = approve;
const abis_1 = require("./abis");
/// Minimal ERC-20 surface re-derived from JUSD; in prod we'd swap the
/// ABI for the real jUSD ABI on Polygon. Same function signatures, so the
/// helpers below work either way.
function requireAccount(wc) {
    if (!wc.account)
        throw new Error("walletClient.account required");
    return wc.account;
}
async function getBalance(publicClient, token, account) {
    return publicClient.readContract({
        address: token,
        abi: abis_1.JUSDAbi,
        functionName: "balanceOf",
        args: [account],
    });
}
async function getAllowance(publicClient, token, owner, spender) {
    return publicClient.readContract({
        address: token,
        abi: abis_1.JUSDAbi,
        functionName: "allowance",
        args: [owner, spender],
    });
}
/// JUSD has an open `mint(address,uint256)`. Real jUSD does not — this
/// is for anvil / dev only.
async function mint(publicClient, walletClient, token, to, amount) {
    const account = requireAccount(walletClient);
    const { request } = await publicClient.simulateContract({
        address: token,
        abi: abis_1.JUSDAbi,
        functionName: "mint",
        args: [to, amount],
        account,
    });
    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
}
async function approve(publicClient, walletClient, token, spender, amount) {
    const account = requireAccount(walletClient);
    const { request } = await publicClient.simulateContract({
        address: token,
        abi: abis_1.JUSDAbi,
        functionName: "approve",
        args: [spender, amount],
        account,
    });
    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
}
//# sourceMappingURL=jusd.js.map