"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCollectionId = getCollectionId;
exports.getPositionId = getPositionId;
exports.getBinaryPositionIds = getBinaryPositionIds;
exports.balanceOf1155 = balanceOf1155;
exports.balanceOfBatch1155 = balanceOfBatch1155;
exports.getOutcomeSlotCount = getOutcomeSlotCount;
exports.getPayoutDenominator = getPayoutDenominator;
exports.getPayoutNumerator = getPayoutNumerator;
exports.prepareCondition = prepareCondition;
exports.reportPayouts = reportPayouts;
exports.splitBinaryPosition = splitBinaryPosition;
exports.mergeBinaryPosition = mergeBinaryPosition;
exports.redeemPositions = redeemPositions;
exports.setApprovalForAll = setApprovalForAll;
const abis_1 = require("./abis");
/// Minimal ERC-1155 surface for balance + approval. IConditionalTokens
/// doesn't expose ERC-1155 entrypoints in its interface (only the CT-specific
/// functions), so balance/approval calls go through this thin ABI applied to
/// the same deployed address.
const ERC1155_BALANCE_AND_APPROVAL_ABI = [
    {
        name: "balanceOf",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "account", type: "address" },
            { name: "id", type: "uint256" },
        ],
        outputs: [{ name: "", type: "uint256" }],
    },
    {
        name: "balanceOfBatch",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "accounts", type: "address[]" },
            { name: "ids", type: "uint256[]" },
        ],
        outputs: [{ name: "", type: "uint256[]" }],
    },
    {
        name: "setApprovalForAll",
        type: "function",
        stateMutability: "nonpayable",
        inputs: [
            { name: "operator", type: "address" },
            { name: "approved", type: "bool" },
        ],
        outputs: [],
    },
    {
        name: "isApprovedForAll",
        type: "function",
        stateMutability: "view",
        inputs: [
            { name: "account", type: "address" },
            { name: "operator", type: "address" },
        ],
        outputs: [{ name: "", type: "bool" }],
    },
];
// ─────────────────────────────────────────────────────────────────────
// Read helpers
// ─────────────────────────────────────────────────────────────────────
async function getCollectionId(publicClient, ct, parentCollectionId, conditionId, indexSet) {
    return publicClient.readContract({
        address: ct,
        abi: abis_1.IConditionalTokensAbi,
        functionName: "getCollectionId",
        args: [parentCollectionId, conditionId, indexSet],
    });
}
async function getPositionId(publicClient, ct, collateralToken, collectionId) {
    return publicClient.readContract({
        address: ct,
        abi: abis_1.IConditionalTokensAbi,
        functionName: "getPositionId",
        args: [collateralToken, collectionId],
    });
}
/// Convenience: derive both YES (indexSet=1) and NO (indexSet=2) position
/// IDs for a binary market in one go. Always uses parentCollectionId = 0.
async function getBinaryPositionIds(publicClient, ct, collateralToken, conditionId) {
    const ZERO_PARENT = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const [yesCollection, noCollection] = await Promise.all([
        getCollectionId(publicClient, ct, ZERO_PARENT, conditionId, 1n),
        getCollectionId(publicClient, ct, ZERO_PARENT, conditionId, 2n),
    ]);
    const [yes, no] = await Promise.all([
        getPositionId(publicClient, ct, collateralToken, yesCollection),
        getPositionId(publicClient, ct, collateralToken, noCollection),
    ]);
    return { yes, no };
}
async function balanceOf1155(publicClient, ct, account, positionId) {
    return publicClient.readContract({
        address: ct,
        abi: ERC1155_BALANCE_AND_APPROVAL_ABI,
        functionName: "balanceOf",
        args: [account, positionId],
    });
}
/// One RPC round-trip for many position ids. A portfolio has to check every
/// outcome of every market, and doing that one call at a time costs a network
/// round-trip each — seconds against a remote node.
async function balanceOfBatch1155(publicClient, ct, account, positionIds) {
    if (positionIds.length === 0)
        return [];
    const balances = await publicClient.readContract({
        address: ct,
        abi: ERC1155_BALANCE_AND_APPROVAL_ABI,
        functionName: "balanceOfBatch",
        args: [positionIds.map(() => account), positionIds],
    });
    return [...balances];
}
async function getOutcomeSlotCount(publicClient, ct, conditionId) {
    return publicClient.readContract({
        address: ct,
        abi: abis_1.IConditionalTokensAbi,
        functionName: "getOutcomeSlotCount",
        args: [conditionId],
    });
}
async function getPayoutDenominator(publicClient, ct, conditionId) {
    return publicClient.readContract({
        address: ct,
        abi: abis_1.IConditionalTokensAbi,
        functionName: "payoutDenominator",
        args: [conditionId],
    });
}
/// One outcome slot's payout numerator. For a binary condition index 0 is Yes
/// and 1 is No. Reading these back is how a caller learns an answer it did not
/// choose itself — the UMA path resolves from the oracle's verdict, so the
/// result has to be read off the chain rather than assumed.
async function getPayoutNumerator(publicClient, ct, conditionId, index) {
    return publicClient.readContract({
        address: ct,
        abi: abis_1.IConditionalTokensAbi,
        functionName: "payoutNumerators",
        args: [conditionId, index],
    });
}
// ─────────────────────────────────────────────────────────────────────
// Write helpers
// ─────────────────────────────────────────────────────────────────────
function requireAccount(wc) {
    if (!wc.account)
        throw new Error("walletClient.account required");
    return wc.account;
}
async function prepareCondition(publicClient, walletClient, ct, oracle, questionId, outcomeSlotCount) {
    const account = requireAccount(walletClient);
    const { request } = await publicClient.simulateContract({
        address: ct,
        abi: abis_1.IConditionalTokensAbi,
        functionName: "prepareCondition",
        args: [oracle, questionId, outcomeSlotCount],
        account,
    });
    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
}
async function reportPayouts(publicClient, walletClient, ct, questionId, payouts) {
    const account = requireAccount(walletClient);
    const { request } = await publicClient.simulateContract({
        address: ct,
        abi: abis_1.IConditionalTokensAbi,
        functionName: "reportPayouts",
        args: [questionId, payouts],
        account,
    });
    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
}
/// Always uses parentCollectionId = 0 (top-level split) and the binary
/// partition `[1, 2]`. For multi-outcome or nested splits, drop down to the
/// raw contract call.
async function splitBinaryPosition(publicClient, walletClient, ct, collateral, conditionId, amount) {
    const account = requireAccount(walletClient);
    const ZERO_PARENT = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const { request } = await publicClient.simulateContract({
        address: ct,
        abi: abis_1.IConditionalTokensAbi,
        functionName: "splitPosition",
        args: [collateral, ZERO_PARENT, conditionId, [1n, 2n], amount],
        account,
    });
    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
}
async function mergeBinaryPosition(publicClient, walletClient, ct, collateral, conditionId, amount) {
    const account = requireAccount(walletClient);
    const ZERO_PARENT = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const { request } = await publicClient.simulateContract({
        address: ct,
        abi: abis_1.IConditionalTokensAbi,
        functionName: "mergePositions",
        args: [collateral, ZERO_PARENT, conditionId, [1n, 2n], amount],
        account,
    });
    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
}
/// Redeem the given index sets. After a `[1, 0]` resolution pass `[1n]`
/// to collect only the winning side (cheapest); pass `[1n, 2n]` for full
/// cleanup or for fractional-payout markets.
async function redeemPositions(publicClient, walletClient, ct, collateral, conditionId, indexSets) {
    const account = requireAccount(walletClient);
    const ZERO_PARENT = "0x0000000000000000000000000000000000000000000000000000000000000000";
    const { request } = await publicClient.simulateContract({
        address: ct,
        abi: abis_1.IConditionalTokensAbi,
        functionName: "redeemPositions",
        args: [collateral, ZERO_PARENT, conditionId, indexSets],
        account,
    });
    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
}
async function setApprovalForAll(publicClient, walletClient, ct, operator, approved) {
    const account = requireAccount(walletClient);
    const { request } = await publicClient.simulateContract({
        address: ct,
        abi: ERC1155_BALANCE_AND_APPROVAL_ABI,
        functionName: "setApprovalForAll",
        args: [operator, approved],
        account,
    });
    const hash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
}
//# sourceMappingURL=ct.js.map