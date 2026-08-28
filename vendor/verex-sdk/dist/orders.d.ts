import type { Account, WalletClient } from "viem";
import type { Address, Hex, Order, OrderDomain } from "./types";
export declare function hashOrder(order: Order, domain: OrderDomain): Hex;
export declare function signOrder(order: Order, domain: OrderDomain, signer: Account | {
    privateKey: Hex;
} | WalletClient): Promise<Order>;
export declare function recoverOrderSigner(order: Order, domain: OrderDomain): Promise<Address>;
//# sourceMappingURL=orders.d.ts.map