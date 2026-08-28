import { type PublicClient, type WalletClient } from "viem";
import type { Address, Hex } from "./types";
export declare const UMA_YES: bigint;
export declare const UMA_NO = 0n;
export declare const UMA_UNRESOLVABLE: bigint;
export declare const UMA_SEPOLIA: {
    readonly optimisticOracleV2: Address;
    readonly weth: Address;
};
export declare function buildAncillaryData(args: {
    title: string;
    resolutionCriteria: string;
    slug: string;
    closesAt: Date;
}): string;
export declare function umaQuestionId(ancillaryData: string): Hex;
export declare function umaConditionId(adapter: Address, questionId: Hex): Hex;
export interface UmaQuestion {
    requestTimestamp: bigint;
    creator: Address;
    rewardToken: Address;
    reward: bigint;
    bond: bigint;
    ancillaryData: Hex;
    resolved: boolean;
}
export interface UmaAdapterClient {
    address: Address;
    initialize: (args: {
        ancillaryData: string;
        rewardToken: Address;
        reward: bigint;
        bond: bigint;
        liveness: bigint;
    }) => Promise<{
        txHash: Hex;
        questionId: Hex;
        conditionId: Hex;
    }>;
    resolve: (questionId: Hex) => Promise<Hex>;
    isSettleable: (questionId: Hex) => Promise<boolean>;
    getQuestion: (questionId: Hex) => Promise<UmaQuestion>;
    ctf: () => Promise<Address>;
    oo: () => Promise<Address>;
    admin: () => Promise<Address>;
}
export declare function createUmaAdapterClient(args: {
    address: Address;
    publicClient: PublicClient;
    walletClient?: WalletClient;
}): UmaAdapterClient;
//# sourceMappingURL=uma.d.ts.map