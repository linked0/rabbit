"use strict";
// Public surface for @verex/sdk.
//
// Layered design:
//   - Types: Order, Side, SignatureType, OrderDomain, ClientConfig
//   - Chain: account derivation + viem client construction from an explicit
//     `AccountConfig` — no env-var reading here, that's each consumer's own
//     call (see packages/api/src/chain.ts and packages/cli/src/clients.ts).
//   - Flat helpers: `signOrder`, `hashOrder`, `getConditionId`, plus thin
//     wrappers around CTFExchange / IConditionalTokens / MockUSDC. Useful
//     for one-off calls and tests.
//   - Small clients: `createCTClient`, `createExchangeClient`,
//     `createUsdcClient` pre-bind an address + viem clients. Useful when
//     the same address gets passed around (CLI, MM agent).
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockOptimisticOracleV2Abi = exports.UMA_REQUEST_STATES = exports.createUmaOracleClient = exports.UMA_SEPOLIA = exports.UMA_UNRESOLVABLE = exports.UMA_NO = exports.UMA_YES = exports.umaConditionId = exports.umaQuestionId = exports.buildAncillaryData = exports.createUmaAdapterClient = exports.UmaCtfAdapterAbi = exports.MockUSDCAbi = exports.IConditionalTokensAbi = exports.CTFExchangeAbi = exports.createUsdcClient = exports.createExchangeClient = exports.createCTClient = exports.usdc = exports.exchange = exports.ct = exports.recoverOrderSigner = exports.hashOrder = exports.signOrder = exports.getConditionId = void 0;
__exportStar(require("./types"), exports);
__exportStar(require("./chain"), exports);
// Off-chain primitives
var conditions_1 = require("./conditions");
Object.defineProperty(exports, "getConditionId", { enumerable: true, get: function () { return conditions_1.getConditionId; } });
var orders_1 = require("./orders");
Object.defineProperty(exports, "signOrder", { enumerable: true, get: function () { return orders_1.signOrder; } });
Object.defineProperty(exports, "hashOrder", { enumerable: true, get: function () { return orders_1.hashOrder; } });
Object.defineProperty(exports, "recoverOrderSigner", { enumerable: true, get: function () { return orders_1.recoverOrderSigner; } });
// Contract-call helpers
exports.ct = __importStar(require("./ct"));
exports.exchange = __importStar(require("./exchange"));
exports.usdc = __importStar(require("./usdc"));
// Pre-bound clients
var clients_1 = require("./clients");
Object.defineProperty(exports, "createCTClient", { enumerable: true, get: function () { return clients_1.createCTClient; } });
Object.defineProperty(exports, "createExchangeClient", { enumerable: true, get: function () { return clients_1.createExchangeClient; } });
Object.defineProperty(exports, "createUsdcClient", { enumerable: true, get: function () { return clients_1.createUsdcClient; } });
// ABIs (escape hatch for callers that need raw contract access)
var abis_1 = require("./abis");
Object.defineProperty(exports, "CTFExchangeAbi", { enumerable: true, get: function () { return abis_1.CTFExchangeAbi; } });
Object.defineProperty(exports, "IConditionalTokensAbi", { enumerable: true, get: function () { return abis_1.IConditionalTokensAbi; } });
Object.defineProperty(exports, "MockUSDCAbi", { enumerable: true, get: function () { return abis_1.MockUSDCAbi; } });
Object.defineProperty(exports, "UmaCtfAdapterAbi", { enumerable: true, get: function () { return abis_1.UmaCtfAdapterAbi; } });
// UMA oracle adapter — optional per-market resolver (see src/uma.ts).
var uma_1 = require("./uma");
Object.defineProperty(exports, "createUmaAdapterClient", { enumerable: true, get: function () { return uma_1.createUmaAdapterClient; } });
Object.defineProperty(exports, "buildAncillaryData", { enumerable: true, get: function () { return uma_1.buildAncillaryData; } });
Object.defineProperty(exports, "umaQuestionId", { enumerable: true, get: function () { return uma_1.umaQuestionId; } });
Object.defineProperty(exports, "umaConditionId", { enumerable: true, get: function () { return uma_1.umaConditionId; } });
Object.defineProperty(exports, "UMA_YES", { enumerable: true, get: function () { return uma_1.UMA_YES; } });
Object.defineProperty(exports, "UMA_NO", { enumerable: true, get: function () { return uma_1.UMA_NO; } });
Object.defineProperty(exports, "UMA_UNRESOLVABLE", { enumerable: true, get: function () { return uma_1.UMA_UNRESOLVABLE; } });
Object.defineProperty(exports, "UMA_SEPOLIA", { enumerable: true, get: function () { return uma_1.UMA_SEPOLIA; } });
// Oracle-side lifecycle (propose/dispute, and the mock jury's vote/finalize).
var uma_oracle_1 = require("./uma-oracle");
Object.defineProperty(exports, "createUmaOracleClient", { enumerable: true, get: function () { return uma_oracle_1.createUmaOracleClient; } });
Object.defineProperty(exports, "UMA_REQUEST_STATES", { enumerable: true, get: function () { return uma_oracle_1.UMA_REQUEST_STATES; } });
var abis_2 = require("./abis");
Object.defineProperty(exports, "MockOptimisticOracleV2Abi", { enumerable: true, get: function () { return abis_2.MockOptimisticOracleV2Abi; } });
//# sourceMappingURL=index.js.map