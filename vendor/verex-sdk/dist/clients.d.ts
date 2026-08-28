import type { PublicClient, WalletClient } from "viem";
import type { Address, Hex, Order } from "./types";
export interface CTClient {
    address: Address;
    prepareCondition: (oracle: Address, questionId: Hex, slots: bigint) => Promise<Hex>;
    reportPayouts: (questionId: Hex, payouts: bigint[]) => Promise<Hex>;
    splitBinary: (collateral: Address, conditionId: Hex, amount: bigint) => Promise<Hex>;
    mergeBinary: (collateral: Address, conditionId: Hex, amount: bigint) => Promise<Hex>;
    redeem: (collateral: Address, conditionId: Hex, indexSets: bigint[]) => Promise<Hex>;
    setApprovalForAll: (operator: Address, approved: boolean) => Promise<Hex>;
    getBinaryPositionIds: (collateral: Address, conditionId: Hex) => Promise<{
        yes: bigint;
        no: bigint;
    }>;
    balanceOf: (account: Address, positionId: bigint) => Promise<bigint>;
    balanceOfBatch: (account: Address, positionIds: bigint[]) => Promise<bigint[]>;
    getPayoutDenominator: (conditionId: Hex) => Promise<bigint>;
    getPayoutNumerator: (conditionId: Hex, index: bigint) => Promise<bigint>;
}
export declare function createCTClient(args: {
    address: Address;
    publicClient: PublicClient;
    walletClient?: WalletClient;
}): CTClient;
export interface ExchangeClient {
    address: Address;
    registerToken: (yesTokenId: bigint, noTokenId: bigint, conditionId: Hex) => Promise<Hex>;
    addOperator: (operator: Address) => Promise<Hex>;
    fillOrder: (order: Order, fillAmount: bigint) => Promise<Hex>;
    matchOrders: (takerOrder: Order, makerOrders: Order[], takerFillAmount: bigint, makerFillAmounts: bigint[]) => Promise<Hex>;
    cancelOrder: (order: Order) => Promise<Hex>;
    hashOrderViaContract: (order: Order) => Promise<Hex>;
    getDomainSeparator: () => Promise<Hex>;
}
export declare function createExchangeClient(args: {
    address: Address;
    publicClient: PublicClient;
    walletClient?: WalletClient;
}): ExchangeClient;
export interface UsdcClient {
    address: Address;
    balanceOf: (account: Address) => Promise<bigint>;
    allowance: (owner: Address, spender: Address) => Promise<bigint>;
    mint: (to: Address, amount: bigint) => Promise<Hex>;
    approve: (spender: Address, amount: bigint) => Promise<Hex>;
}
export declare function createUsdcClient(args: {
    address: Address;
    publicClient: PublicClient;
    walletClient?: WalletClient;
}): UsdcClient;
//# sourceMappingURL=clients.d.ts.map