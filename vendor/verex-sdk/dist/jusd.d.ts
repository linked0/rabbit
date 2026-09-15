import type { PublicClient, WalletClient } from "viem";
import type { Address, Hex } from "./types";
export declare function getBalance(publicClient: PublicClient, token: Address, account: Address): Promise<bigint>;
export declare function getAllowance(publicClient: PublicClient, token: Address, owner: Address, spender: Address): Promise<bigint>;
export declare function mint(publicClient: PublicClient, walletClient: WalletClient, token: Address, to: Address, amount: bigint): Promise<Hex>;
export declare function approve(publicClient: PublicClient, walletClient: WalletClient, token: Address, spender: Address, amount: bigint): Promise<Hex>;
//# sourceMappingURL=jusd.d.ts.map