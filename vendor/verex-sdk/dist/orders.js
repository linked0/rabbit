"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashOrder = hashOrder;
exports.signOrder = signOrder;
exports.recoverOrderSigner = recoverOrderSigner;
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
/// EIP-712 domain values fixed by Polymarket's CTFExchange constructor.
/// `Hashing("Polymarket CTF Exchange", "1")` in CTFExchange.sol.
const DOMAIN_NAME = "Polymarket CTF Exchange";
const DOMAIN_VERSION = "1";
/// The Order struct used in the EIP-712 typed-data hash. Mirrors
/// ORDER_TYPEHASH in Polymarket's OrderStructs.sol — fields 1..12 of the
/// solidity struct (the `signature` field is not part of the hash).
const ORDER_TYPES = {
    Order: [
        { name: "salt", type: "uint256" },
        { name: "maker", type: "address" },
        { name: "signer", type: "address" },
        { name: "taker", type: "address" },
        { name: "tokenId", type: "uint256" },
        { name: "makerAmount", type: "uint256" },
        { name: "takerAmount", type: "uint256" },
        { name: "expiration", type: "uint256" },
        { name: "nonce", type: "uint256" },
        { name: "feeRateBps", type: "uint256" },
        { name: "side", type: "uint8" },
        { name: "signatureType", type: "uint8" },
    ],
};
function domainOf(domain) {
    return {
        name: DOMAIN_NAME,
        version: DOMAIN_VERSION,
        chainId: domain.chainId,
        verifyingContract: domain.verifyingContract,
    };
}
function messageOf(order) {
    // signatureType + side ride as numeric enums; viem accepts number for uint8.
    return {
        salt: order.salt,
        maker: order.maker,
        signer: order.signer,
        taker: order.taker,
        tokenId: order.tokenId,
        makerAmount: order.makerAmount,
        takerAmount: order.takerAmount,
        expiration: order.expiration,
        nonce: order.nonce,
        feeRateBps: order.feeRateBps,
        side: order.side,
        signatureType: order.signatureType,
    };
}
/// Compute the EIP-712 digest for an Order off-chain. Identical to
/// `CTFExchange.hashOrder(order)` on-chain. Used as input for signing and
/// for sanity-checking that the SDK's domain reconstruction matches the
/// contract.
function hashOrder(order, domain) {
    return (0, viem_1.hashTypedData)({
        domain: domainOf(domain),
        types: ORDER_TYPES,
        primaryType: "Order",
        message: messageOf(order),
    });
}
/// Sign an order with the given account (or raw private key) and return a
/// new Order with the signature field populated. Signature is `r||s||v` —
/// same layout as `abi.encodePacked(r, s, v)` in the Foundry test's
/// `_sign` helper.
async function signOrder(order, domain, signer) {
    const account = "privateKey" in signer
        ? (0, accounts_1.privateKeyToAccount)(signer.privateKey)
        : "account" in signer && signer.account
            ? signer.account
            : signer;
    if (!account.signTypedData) {
        throw new Error("signOrder: account does not support signTypedData");
    }
    const signature = await account.signTypedData({
        domain: domainOf(domain),
        types: ORDER_TYPES,
        primaryType: "Order",
        message: messageOf(order),
    });
    return { ...order, signature };
}
/// Recover the address that signed an order. The counterpart to `signOrder`:
/// the server verifying a client-supplied order has the signature but not the
/// key, so it re-derives the signer from the same typed data and compares.
///
/// A mismatch means the order was signed over *different* terms than the ones
/// presented — the failure mode that a second, drifted copy of ORDER_TYPES
/// produces, and the reason this lives here rather than being re-implemented
/// per consumer.
async function recoverOrderSigner(order, domain) {
    if (!order.signature || order.signature === "0x") {
        throw new Error("recoverOrderSigner: order has no signature");
    }
    return (0, viem_1.recoverTypedDataAddress)({
        domain: domainOf(domain),
        types: ORDER_TYPES,
        primaryType: "Order",
        message: messageOf(order),
        signature: order.signature,
    });
}
//# sourceMappingURL=orders.js.map