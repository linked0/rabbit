import { type PublicClient, type WalletClient } from "viem";
import type { Address, Hex } from "./types";
export declare const UMA_REQUEST_STATES: readonly ["Invalid", "Requested", "Proposed", "Expired", "Disputed", "Resolved", "Settled"];
export type UmaRequestState = (typeof UMA_REQUEST_STATES)[number];
export interface UmaOracleRequest {
    proposer: Address;
    disputer: Address;
    currency: Address;
    settled: boolean;
    proposedPrice: bigint;
    resolvedPrice: bigint;
    expirationTime: bigint;
    reward: bigint;
    bond: bigint;
    customLiveness: bigint;
}
export interface UmaOracleClient {
    address: Address;
    proposePrice: (args: RequestKey & {
        price: bigint;
    }) => Promise<Hex>;
    disputePrice: (args: RequestKey) => Promise<Hex>;
    vote: (args: RequestKey & {
        answer: bigint;
    }) => Promise<Hex>;
    finalizeVote: (args: RequestKey) => Promise<Hex>;
    getState: (args: RequestKey) => Promise<UmaRequestState>;
    getRequest: (args: RequestKey) => Promise<UmaOracleRequest>;
    getBallots: (args: RequestKey) => Promise<{
        voter: Address;
        answer: bigint;
    }[]>;
}
export interface RequestKey {
    requester: Address;
    timestamp: bigint;
    ancillaryData: Hex | string;
}
export declare function createUmaOracleClient(args: {
    address: Address;
    publicClient: PublicClient;
    walletClient?: WalletClient;
}): UmaOracleClient;
//# sourceMappingURL=uma-oracle.d.ts.map