export declare const IConditionalTokensAbi: readonly [{
    readonly type: "function";
    readonly name: "getCollectionId";
    readonly inputs: readonly [{
        readonly name: "parentCollectionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "conditionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "indexSet";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getConditionId";
    readonly inputs: readonly [{
        readonly name: "oracle";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "questionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "outcomeSlotCount";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly stateMutability: "pure";
}, {
    readonly type: "function";
    readonly name: "getOutcomeSlotCount";
    readonly inputs: readonly [{
        readonly name: "conditionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getPositionId";
    readonly inputs: readonly [{
        readonly name: "collateralToken";
        readonly type: "address";
        readonly internalType: "contract IERC20";
    }, {
        readonly name: "collectionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "pure";
}, {
    readonly type: "function";
    readonly name: "mergePositions";
    readonly inputs: readonly [{
        readonly name: "collateralToken";
        readonly type: "address";
        readonly internalType: "contract IERC20";
    }, {
        readonly name: "parentCollectionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "conditionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "partition";
        readonly type: "uint256[]";
        readonly internalType: "uint256[]";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "payoutDenominator";
    readonly inputs: readonly [{
        readonly name: "conditionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "payoutNumerators";
    readonly inputs: readonly [{
        readonly name: "conditionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "index";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "prepareCondition";
    readonly inputs: readonly [{
        readonly name: "oracle";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "questionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "outcomeSlotCount";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "redeemPositions";
    readonly inputs: readonly [{
        readonly name: "collateralToken";
        readonly type: "address";
        readonly internalType: "contract IERC20";
    }, {
        readonly name: "parentCollectionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "conditionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "indexSets";
        readonly type: "uint256[]";
        readonly internalType: "uint256[]";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "reportPayouts";
    readonly inputs: readonly [{
        readonly name: "questionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "payouts";
        readonly type: "uint256[]";
        readonly internalType: "uint256[]";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "splitPosition";
    readonly inputs: readonly [{
        readonly name: "collateralToken";
        readonly type: "address";
        readonly internalType: "contract IERC20";
    }, {
        readonly name: "parentCollectionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "conditionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "partition";
        readonly type: "uint256[]";
        readonly internalType: "uint256[]";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}];
//# sourceMappingURL=IConditionalTokens.d.ts.map