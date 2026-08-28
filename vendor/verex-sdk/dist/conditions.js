"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConditionId = getConditionId;
const viem_1 = require("viem");
/// Off-chain replication of `IConditionalTokens.getConditionId`.
///
/// Solidity:
///   keccak256(abi.encodePacked(oracle, questionId, outcomeSlotCount))
///
/// `abi.encodePacked` lays out address (20 bytes) || bytes32 (32 bytes) ||
/// uint256 (32 bytes) without padding for the dynamic-sized args, then
/// big-endian for the uint256. viem's `encodePacked` does the same.
function getConditionId(oracle, questionId, outcomeSlotCount) {
    return (0, viem_1.keccak256)((0, viem_1.encodePacked)(["address", "bytes32", "uint256"], [oracle, questionId, outcomeSlotCount]));
}
//# sourceMappingURL=conditions.js.map