"use strict";
// Oracle-side helpers for UMA markets: the request lifecycle as seen from the
// ORACLE, not the adapter. Propose / dispute / (mock-only) vote & finalize.
//
// One client serves both oracles. `proposePrice` and `disputePrice` share
// their signatures with the real OptimisticOracleV2, so those calls work
// against either; `vote`, `finalizeVote` and `getBallots` exist only on the
// MockOptimisticOracleV2 — the demo jury that stands in for UMA's DVM. The
// caller decides what to offer based on ChainConfig's `umaOracleMock` flag,
// not by probing the contract.
Object.defineProperty(exports, "__esModule", { value: true });
exports.UMA_REQUEST_STATES = void 0;
exports.createUmaOracleClient = createUmaOracleClient;
const viem_1 = require("viem");
const abis_1 = require("./abis");
/// UMA's request lifecycle states, by enum value. `Expired` = liveness passed
/// undisputed (settleable); `Resolved` = a dispute was voted on (settleable);
/// `Settled` = someone already collected the answer.
exports.UMA_REQUEST_STATES = [
    "Invalid",
    "Requested",
    "Proposed",
    "Expired",
    "Disputed",
    "Resolved",
    "Settled",
];
const YES_OR_NO_QUERY = (0, viem_1.toHex)("YES_OR_NO_QUERY", { size: 32 });
function createUmaOracleClient(args) {
    const { address, publicClient, walletClient } = args;
    const requireWallet = () => {
        if (!walletClient)
            throw new Error("walletClient required for write op");
        return walletClient;
    };
    const ancBytes = (v) => (v.startsWith("0x") ? v : (0, viem_1.toHex)(v));
    const write = async (functionName, callArgs) => {
        const wallet = requireWallet();
        const { request } = await publicClient.simulateContract({
            address,
            abi: abis_1.MockOptimisticOracleV2Abi,
            functionName,
            args: callArgs,
            account: wallet.account,
        });
        const txHash = await wallet.writeContract(request);
        await publicClient.waitForTransactionReceipt({ hash: txHash });
        return txHash;
    };
    const read = (functionName, callArgs) => publicClient.readContract({
        address,
        abi: abis_1.MockOptimisticOracleV2Abi,
        functionName,
        args: callArgs,
    });
    const key = (k) => [k.requester, YES_OR_NO_QUERY, k.timestamp, ancBytes(k.ancillaryData)];
    return {
        address,
        proposePrice: (a) => write("proposePrice", [...key(a), a.price]),
        disputePrice: (a) => write("disputePrice", [...key(a)]),
        vote: (a) => write("vote", [...key(a), a.answer]),
        finalizeVote: (a) => write("finalizeVote", [...key(a)]),
        async getState(a) {
            const s = await read("getState", [...key(a)]);
            return exports.UMA_REQUEST_STATES[s] ?? "Invalid";
        },
        getRequest: (a) => read("getRequest", [...key(a)]),
        async getBallots(a) {
            const [voters, answers] = await read("getBallots", [...key(a)]);
            return voters.map((voter, i) => ({ voter, answer: answers[i] }));
        },
    };
}
//# sourceMappingURL=uma-oracle.js.map