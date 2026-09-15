"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JAYVERSE_DEVNET_ID = exports.jayverseDevnet = exports.CHAINS = exports.ANVIL_MNEMONIC = void 0;
exports.account = account;
exports.accountAddress = accountAddress;
exports.makePublicClient = makePublicClient;
exports.makeWalletClient = makeWalletClient;
const viem_1 = require("viem");
const accounts_1 = require("viem/accounts");
const chains_1 = require("viem/chains");
const jayverse_devnet_1 = require("./jayverse-devnet");
Object.defineProperty(exports, "jayverseDevnet", { enumerable: true, get: function () { return jayverse_devnet_1.jayverseDevnet; } });
Object.defineProperty(exports, "JAYVERSE_DEVNET_ID", { enumerable: true, get: function () { return jayverse_devnet_1.JAYVERSE_DEVNET_ID; } });
/// Anvil's well-known default mnemonic — the accounts it derives are public
/// knowledge (anyone running anvil gets the same 10 addresses/keys). Fine for
/// an ephemeral local chain; never reuse it as a real chain's demo mnemonic.
exports.ANVIL_MNEMONIC = "test test test test test test test test test test test junk";
/// Supported chains, switched purely via VEREX_CHAIN_ID — add an entry here
/// (plus an import from viem/chains) to support another one.
exports.CHAINS = {
    [jayverse_devnet_1.JAYVERSE_DEVNET_ID]: jayverse_devnet_1.jayverseDevnet, // Jayverse devnet — the primary target
    31337: chains_1.foundry, // local anvil
    11155111: chains_1.sepolia, // Ethereum Sepolia — oracle tests and MetaMask 7715 only
    84532: chains_1.baseSepolia, // Base Sepolia
};
function account(cfg, index) {
    if (index === 0 && cfg.operatorKey) {
        return (0, accounts_1.privateKeyToAccount)(cfg.operatorKey);
    }
    return (0, accounts_1.mnemonicToAccount)(cfg.mnemonic(), { addressIndex: index });
}
function accountAddress(cfg, index) {
    return account(cfg, index).address;
}
function makePublicClient(cfg) {
    return (0, viem_1.createPublicClient)({ chain: cfg.chain, transport: (0, viem_1.http)(cfg.rpcUrl) });
}
function makeWalletClient(cfg, index) {
    return (0, viem_1.createWalletClient)({
        account: account(cfg, index),
        chain: cfg.chain,
        transport: (0, viem_1.http)(cfg.rpcUrl),
    });
}
//# sourceMappingURL=chain.js.map