import type { PublicClient, WalletClient } from "viem";
import type { Address, Hex, Order } from "./types";
export declare function hashOrderViaContract(publicClient: PublicClient, exchange: Address, order: Order): Promise<Hex>;
export declare function getDomainSeparator(publicClient: PublicClient, exchange: Address): Promise<Hex>;
export declare function registerToken(publicClient: PublicClient, walletClient: WalletClient, exchange: Address, yesTokenId: bigint, noTokenId: bigint, conditionId: Hex): Promise<Hex>;
export declare function addOperator(publicClient: PublicClient, walletClient: WalletClient, exchange: Address, operator: Address): Promise<Hex>;
export declare function fillOrder(publicClient: PublicClient, walletClient: WalletClient, exchange: Address, order: Order, fillAmount: bigint): Promise<Hex>;
export declare function matchOrders(publicClient: PublicClient, walletClient: WalletClient, exchange: Address, takerOrder: Order, makerOrders: Order[], takerFillAmount: bigint, makerFillAmounts: bigint[]): Promise<Hex>;
export declare function cancelOrder(publicClient: PublicClient, walletClient: WalletClient, exchange: Address, order: Order): Promise<Hex>;
//# sourceMappingURL=exchange.d.ts.map