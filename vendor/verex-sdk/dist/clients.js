"use strict";
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
exports.createCTClient = createCTClient;
exports.createExchangeClient = createExchangeClient;
exports.createUsdcClient = createUsdcClient;
const ct = __importStar(require("./ct"));
const exchange = __importStar(require("./exchange"));
const usdc = __importStar(require("./usdc"));
function createCTClient(args) {
    const { address, publicClient, walletClient } = args;
    const requireWallet = () => {
        if (!walletClient)
            throw new Error("walletClient required for write op");
        return walletClient;
    };
    return {
        address,
        prepareCondition: (oracle, questionId, slots) => ct.prepareCondition(publicClient, requireWallet(), address, oracle, questionId, slots),
        reportPayouts: (questionId, payouts) => ct.reportPayouts(publicClient, requireWallet(), address, questionId, payouts),
        splitBinary: (collateral, conditionId, amount) => ct.splitBinaryPosition(publicClient, requireWallet(), address, collateral, conditionId, amount),
        mergeBinary: (collateral, conditionId, amount) => ct.mergeBinaryPosition(publicClient, requireWallet(), address, collateral, conditionId, amount),
        redeem: (collateral, conditionId, indexSets) => ct.redeemPositions(publicClient, requireWallet(), address, collateral, conditionId, indexSets),
        setApprovalForAll: (operator, approved) => ct.setApprovalForAll(publicClient, requireWallet(), address, operator, approved),
        getBinaryPositionIds: (collateral, conditionId) => ct.getBinaryPositionIds(publicClient, address, collateral, conditionId),
        balanceOf: (account, positionId) => ct.balanceOf1155(publicClient, address, account, positionId),
        balanceOfBatch: (account, positionIds) => ct.balanceOfBatch1155(publicClient, address, account, positionIds),
        getPayoutDenominator: (conditionId) => ct.getPayoutDenominator(publicClient, address, conditionId),
        getPayoutNumerator: (conditionId, index) => ct.getPayoutNumerator(publicClient, address, conditionId, index),
    };
}
function createExchangeClient(args) {
    const { address, publicClient, walletClient } = args;
    const requireWallet = () => {
        if (!walletClient)
            throw new Error("walletClient required for write op");
        return walletClient;
    };
    return {
        address,
        registerToken: (yesTokenId, noTokenId, conditionId) => exchange.registerToken(publicClient, requireWallet(), address, yesTokenId, noTokenId, conditionId),
        addOperator: (operator) => exchange.addOperator(publicClient, requireWallet(), address, operator),
        fillOrder: (order, fillAmount) => exchange.fillOrder(publicClient, requireWallet(), address, order, fillAmount),
        matchOrders: (takerOrder, makerOrders, takerFillAmount, makerFillAmounts) => exchange.matchOrders(publicClient, requireWallet(), address, takerOrder, makerOrders, takerFillAmount, makerFillAmounts),
        cancelOrder: (order) => exchange.cancelOrder(publicClient, requireWallet(), address, order),
        hashOrderViaContract: (order) => exchange.hashOrderViaContract(publicClient, address, order),
        getDomainSeparator: () => exchange.getDomainSeparator(publicClient, address),
    };
}
function createUsdcClient(args) {
    const { address, publicClient, walletClient } = args;
    const requireWallet = () => {
        if (!walletClient)
            throw new Error("walletClient required for write op");
        return walletClient;
    };
    return {
        address,
        balanceOf: (account) => usdc.getBalance(publicClient, address, account),
        allowance: (owner, spender) => usdc.getAllowance(publicClient, address, owner, spender),
        mint: (to, amount) => usdc.mint(publicClient, requireWallet(), address, to, amount),
        approve: (spender, amount) => usdc.approve(publicClient, requireWallet(), address, spender, amount),
    };
}
//# sourceMappingURL=clients.js.map