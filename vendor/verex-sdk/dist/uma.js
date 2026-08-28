"use strict";
// UmaCtfAdapter helpers — for markets whose result comes from UMA's
// Optimistic Oracle rather than from the operator's key.
//
// The one thing to keep in mind when reading this file: with UMA, a market's
// on-chain identity is derived from the QUESTION TEXT, not from its slug.
// `initialize` computes questionId = keccak256(ancillaryData), and the CTF
// then computes conditionId = keccak256(adapter, questionId, 2). So the
// ancillary data has to be unique per market — see `buildAncillaryData`.
Object.defineProperty(exports, "__esModule", { value: true });
exports.UMA_SEPOLIA = exports.UMA_UNRESOLVABLE = exports.UMA_NO = exports.UMA_YES = void 0;
exports.buildAncillaryData = buildAncillaryData;
exports.umaQuestionId = umaQuestionId;
exports.umaConditionId = umaConditionId;
exports.createUmaAdapterClient = createUmaAdapterClient;
const viem_1 = require("viem");
const abis_1 = require("./abis");
const conditions_1 = require("./conditions");
/// UMA's settled answers for a YES_OR_NO_QUERY, as the adapter interprets them.
exports.UMA_YES = 10n ** 18n;
exports.UMA_NO = 0n;
exports.UMA_UNRESOLVABLE = 5n * 10n ** 17n;
/// Sepolia deployments, verified 2026-08-03 (docs/tasks/aug-03-plan.md, G4).
exports.UMA_SEPOLIA = {
    optimisticOracleV2: "0x9f1263B8f0355673619168b5B8c0248f1d03e88C",
    /// Bond/reward currency. Verex's MockUSDC is NOT on UMA's AddressWhitelist;
    /// WETH is, and is self-service via deposit().
    weth: "0x7b79995e5f793A07Bc00c21412e50Ecae098E7f9",
};
/// Compose the bytes a UMA voter actually reads.
///
/// Two jobs, and both matter:
///
///  1. **Resolution criteria.** This text is the entire basis on which a human
///     decides the answer. A bare question with no rules is how a market ends
///     up settled "unresolvable" (0.5e18), which pays both sides half — so the
///     criteria are not decoration, they are the market's correctness.
///  2. **Uniqueness.** questionId is keccak256 of these bytes, so two markets
///     with identical text are the same on-chain question, and the second
///     `initialize` reverts AlreadyInitialized. The slug is included to make
///     collisions impossible even when two markets ask the same thing.
function buildAncillaryData(args) {
    return [
        `q: title: ${args.title}`,
        `description: ${args.resolutionCriteria}`,
        `res_data: p1: 0, p2: 1, p3: 0.5. Where p1 corresponds to NO, p2 to YES, p3 to unknown/50-50.`,
        `closes: ${args.closesAt.toISOString()}`,
        `verex_slug: ${args.slug}`,
    ].join(", ");
}
/// questionId as `initialize` will compute it — keccak256 of the ancillary
/// bytes. Lets a caller know the id before broadcasting.
function umaQuestionId(ancillaryData) {
    return (0, viem_1.keccak256)((0, viem_1.toHex)(ancillaryData));
}
/// conditionId for a UMA market: the ADAPTER is the oracle in the hash, not
/// the operator. This is why the choice is permanent — pointing an existing
/// market at a different oracle computes a different market entirely.
function umaConditionId(adapter, questionId) {
    return (0, conditions_1.getConditionId)(adapter, questionId, 2n);
}
function createUmaAdapterClient(args) {
    const { address, publicClient, walletClient } = args;
    const requireWallet = () => {
        if (!walletClient)
            throw new Error("walletClient required for write op");
        return walletClient;
    };
    const read = (functionName, callArgs = []) => publicClient.readContract({
        address,
        abi: abis_1.UmaCtfAdapterAbi,
        functionName,
        args: callArgs,
    });
    return {
        address,
        async initialize({ ancillaryData, rewardToken, reward, bond, liveness }) {
            const wallet = requireWallet();
            const data = (0, viem_1.toHex)(ancillaryData);
            const { request } = await publicClient.simulateContract({
                address,
                abi: abis_1.UmaCtfAdapterAbi,
                functionName: "initialize",
                args: [data, rewardToken, reward, bond, liveness],
                account: wallet.account,
            });
            const txHash = await wallet.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash: txHash });
            // Derived, not read back: both values are pure functions of the inputs,
            // and deriving them keeps this independent of event-log decoding.
            const questionId = umaQuestionId(ancillaryData);
            return { txHash, questionId, conditionId: umaConditionId(address, questionId) };
        },
        async resolve(questionId) {
            const wallet = requireWallet();
            const { request } = await publicClient.simulateContract({
                address,
                abi: abis_1.UmaCtfAdapterAbi,
                functionName: "resolve",
                args: [questionId],
                account: wallet.account,
            });
            const txHash = await wallet.writeContract(request);
            await publicClient.waitForTransactionReceipt({ hash: txHash });
            return txHash;
        },
        isSettleable: (questionId) => read("isSettleable", [questionId]),
        getQuestion: (questionId) => read("getQuestion", [questionId]),
        ctf: () => read("ctf"),
        oo: () => read("oo"),
        admin: () => read("admin"),
    };
}
//# sourceMappingURL=uma.js.map