import type { PublicClient, WalletClient } from "viem";
import type { Address, Hex } from "./types";
export declare function getCollectionId(publicClient: PublicClient, ct: Address, parentCollectionId: Hex, conditionId: Hex, indexSet: bigint): Promise<Hex>;
export declare function getPositionId(publicClient: PublicClient, ct: Address, collateralToken: Address, collectionId: Hex): Promise<bigint>;
export declare function getBinaryPositionIds(publicClient: PublicClient, ct: Address, collateralToken: Address, conditionId: Hex): Promise<{
    yes: bigint;
    no: bigint;
}>;
export declare function balanceOf1155(publicClient: PublicClient, ct: Address, account: Address, positionId: bigint): Promise<bigint>;
export declare function balanceOfBatch1155(publicClient: PublicClient, ct: Address, account: Address, positionIds: bigint[]): Promise<bigint[]>;
export declare function getOutcomeSlotCount(publicClient: PublicClient, ct: Address, conditionId: Hex): Promise<bigint>;
export declare function getPayoutDenominator(publicClient: PublicClient, ct: Address, conditionId: Hex): Promise<bigint>;
export declare function getPayoutNumerator(publicClient: PublicClient, ct: Address, conditionId: Hex, index: bigint): Promise<bigint>;
export declare function prepareCondition(publicClient: PublicClient, walletClient: WalletClient, ct: Address, oracle: Address, questionId: Hex, outcomeSlotCount: bigint): Promise<Hex>;
export declare function reportPayouts(publicClient: PublicClient, walletClient: WalletClient, ct: Address, questionId: Hex, payouts: bigint[]): Promise<Hex>;
export declare function splitBinaryPosition(publicClient: PublicClient, walletClient: WalletClient, ct: Address, collateral: Address, conditionId: Hex, amount: bigint): Promise<Hex>;
export declare function mergeBinaryPosition(publicClient: PublicClient, walletClient: WalletClient, ct: Address, collateral: Address, conditionId: Hex, amount: bigint): Promise<Hex>;
export declare function redeemPositions(publicClient: PublicClient, walletClient: WalletClient, ct: Address, collateral: Address, conditionId: Hex, indexSets: bigint[]): Promise<Hex>;
export declare function setApprovalForAll(publicClient: PublicClient, walletClient: WalletClient, ct: Address, operator: Address, approved: boolean): Promise<Hex>;
//# sourceMappingURL=ct.d.ts.map