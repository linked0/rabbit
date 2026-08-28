export declare const UmaCtfAdapterAbi: readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_ctf";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "_oo";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "_admin";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "YES_OR_NO_QUERY";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "admin";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "ctf";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "contract IConditionalTokens";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getQuestion";
    readonly inputs: readonly [{
        readonly name: "questionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "tuple";
        readonly internalType: "struct UmaCtfAdapter.Question";
        readonly components: readonly [{
            readonly name: "requestTimestamp";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "creator";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "rewardToken";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "reward";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "bond";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "ancillaryData";
            readonly type: "bytes";
            readonly internalType: "bytes";
        }, {
            readonly name: "resolved";
            readonly type: "bool";
            readonly internalType: "bool";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "initialize";
    readonly inputs: readonly [{
        readonly name: "ancillaryData";
        readonly type: "bytes";
        readonly internalType: "bytes";
    }, {
        readonly name: "rewardToken";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "reward";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "bond";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "liveness";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "questionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "conditionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "isSettleable";
    readonly inputs: readonly [{
        readonly name: "questionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
        readonly internalType: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "oo";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "contract IOptimisticOracleV2";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "resolve";
    readonly inputs: readonly [{
        readonly name: "questionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "event";
    readonly name: "QuestionInitialized";
    readonly inputs: readonly [{
        readonly name: "questionId";
        readonly type: "bytes32";
        readonly indexed: true;
        readonly internalType: "bytes32";
    }, {
        readonly name: "conditionId";
        readonly type: "bytes32";
        readonly indexed: true;
        readonly internalType: "bytes32";
    }, {
        readonly name: "requestTimestamp";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }, {
        readonly name: "ancillaryData";
        readonly type: "bytes";
        readonly indexed: false;
        readonly internalType: "bytes";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "QuestionResolved";
    readonly inputs: readonly [{
        readonly name: "questionId";
        readonly type: "bytes32";
        readonly indexed: true;
        readonly internalType: "bytes32";
    }, {
        readonly name: "settledPrice";
        readonly type: "int256";
        readonly indexed: false;
        readonly internalType: "int256";
    }, {
        readonly name: "payouts";
        readonly type: "uint256[]";
        readonly indexed: false;
        readonly internalType: "uint256[]";
    }];
    readonly anonymous: false;
}, {
    readonly type: "error";
    readonly name: "AlreadyInitialized";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "AlreadyResolved";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "InvalidAncillaryData";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "NotAdmin";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "NotInitialized";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "UnsupportedPrice";
    readonly inputs: readonly [{
        readonly name: "price";
        readonly type: "int256";
        readonly internalType: "int256";
    }];
}];
//# sourceMappingURL=UmaCtfAdapter.d.ts.map