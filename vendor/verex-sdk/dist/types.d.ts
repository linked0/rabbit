import type { Account, PublicClient, WalletClient } from "viem";
export type Address = `0x${string}`;
export type Hex = `0x${string}`;
export declare enum Side {
    BUY = 0,
    SELL = 1
}
export declare enum SignatureType {
    EOA = 0,
    POLY_PROXY = 1,
    POLY_GNOSIS_SAFE = 2
}
export interface Order {
    salt: bigint;
    maker: Address;
    signer: Address;
    taker: Address;
    tokenId: bigint;
    makerAmount: bigint;
    takerAmount: bigint;
    expiration: bigint;
    nonce: bigint;
    feeRateBps: bigint;
    side: Side;
    signatureType: SignatureType;
    signature: Hex;
}
export interface OrderDomain {
    chainId: number;
    verifyingContract: Address;
}
export interface ClientConfig {
    address: Address;
    publicClient: PublicClient;
    walletClient?: WalletClient;
}
export type OrderSigner = Account | {
    privateKey: Hex;
};
//# sourceMappingURL=types.d.ts.map