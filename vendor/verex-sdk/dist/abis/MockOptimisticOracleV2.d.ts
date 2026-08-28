export declare const MockOptimisticOracleV2Abi: readonly [{
    readonly type: "function";
    readonly name: "DEFAULT_LIVENESS";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "disputePrice";
    readonly inputs: readonly [{
        readonly name: "requester";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "identifier";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "timestamp";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "ancillaryData";
        readonly type: "bytes";
        readonly internalType: "bytes";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "finalizeVote";
    readonly inputs: readonly [{
        readonly name: "requester";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "identifier";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "timestamp";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "ancillaryData";
        readonly type: "bytes";
        readonly internalType: "bytes";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "getBallots";
    readonly inputs: readonly [{
        readonly name: "requester";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "identifier";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "timestamp";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "ancillaryData";
        readonly type: "bytes";
        readonly internalType: "bytes";
    }];
    readonly outputs: readonly [{
        readonly name: "voters";
        readonly type: "address[]";
        readonly internalType: "address[]";
    }, {
        readonly name: "answers";
        readonly type: "int256[]";
        readonly internalType: "int256[]";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getRequest";
    readonly inputs: readonly [{
        readonly name: "requester";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "identifier";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "timestamp";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "ancillaryData";
        readonly type: "bytes";
        readonly internalType: "bytes";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "tuple";
        readonly internalType: "struct IOptimisticOracleV2.Request";
        readonly components: readonly [{
            readonly name: "proposer";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "disputer";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "currency";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "settled";
            readonly type: "bool";
            readonly internalType: "bool";
        }, {
            readonly name: "refundOnDispute";
            readonly type: "bool";
            readonly internalType: "bool";
        }, {
            readonly name: "proposedPrice";
            readonly type: "int256";
            readonly internalType: "int256";
        }, {
            readonly name: "resolvedPrice";
            readonly type: "int256";
            readonly internalType: "int256";
        }, {
            readonly name: "expirationTime";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "reward";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "finalFee";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "bond";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "customLiveness";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getState";
    readonly inputs: readonly [{
        readonly name: "requester";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "identifier";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "timestamp";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "ancillaryData";
        readonly type: "bytes";
        readonly internalType: "bytes";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint8";
        readonly internalType: "enum IOptimisticOracleV2.State";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "proposePrice";
    readonly inputs: readonly [{
        readonly name: "requester";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "identifier";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "timestamp";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "ancillaryData";
        readonly type: "bytes";
        readonly internalType: "bytes";
    }, {
        readonly name: "price";
        readonly type: "int256";
        readonly internalType: "int256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "requestPrice";
    readonly inputs: readonly [{
        readonly name: "identifier";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "timestamp";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "ancillaryData";
        readonly type: "bytes";
        readonly internalType: "bytes";
    }, {
        readonly name: "currency";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "reward";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setBond";
    readonly inputs: readonly [{
        readonly name: "identifier";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "timestamp";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "ancillaryData";
        readonly type: "bytes";
        readonly internalType: "bytes";
    }, {
        readonly name: "bond";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setCustomLiveness";
    readonly inputs: readonly [{
        readonly name: "identifier";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "timestamp";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "ancillaryData";
        readonly type: "bytes";
        readonly internalType: "bytes";
    }, {
        readonly name: "liveness";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "settleAndGetPrice";
    readonly inputs: readonly [{
        readonly name: "identifier";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "timestamp";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "ancillaryData";
        readonly type: "bytes";
        readonly internalType: "bytes";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "int256";
        readonly internalType: "int256";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "vote";
    readonly inputs: readonly [{
        readonly name: "requester";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "identifier";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "timestamp";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "ancillaryData";
        readonly type: "bytes";
        readonly internalType: "bytes";
    }, {
        readonly name: "answer";
        readonly type: "int256";
        readonly internalType: "int256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "event";
    readonly name: "PriceDisputed";
    readonly inputs: readonly [{
        readonly name: "disputer";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "key";
        readonly type: "bytes32";
        readonly indexed: false;
        readonly internalType: "bytes32";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "PriceProposed";
    readonly inputs: readonly [{
        readonly name: "proposer";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "key";
        readonly type: "bytes32";
        readonly indexed: false;
        readonly internalType: "bytes32";
    }, {
        readonly name: "price";
        readonly type: "int256";
        readonly indexed: false;
        readonly internalType: "int256";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "PriceRequested";
    readonly inputs: readonly [{
        readonly name: "requester";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "key";
        readonly type: "bytes32";
        readonly indexed: false;
        readonly internalType: "bytes32";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "Settled";
    readonly inputs: readonly [{
        readonly name: "key";
        readonly type: "bytes32";
        readonly indexed: false;
        readonly internalType: "bytes32";
    }, {
        readonly name: "price";
        readonly type: "int256";
        readonly indexed: false;
        readonly internalType: "int256";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "VoteCast";
    readonly inputs: readonly [{
        readonly name: "voter";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "key";
        readonly type: "bytes32";
        readonly indexed: false;
        readonly internalType: "bytes32";
    }, {
        readonly name: "answer";
        readonly type: "int256";
        readonly indexed: false;
        readonly internalType: "int256";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "VoteFinalized";
    readonly inputs: readonly [{
        readonly name: "key";
        readonly type: "bytes32";
        readonly indexed: false;
        readonly internalType: "bytes32";
    }, {
        readonly name: "verdict";
        readonly type: "int256";
        readonly indexed: false;
        readonly internalType: "int256";
    }, {
        readonly name: "ballotCount";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }];
    readonly anonymous: false;
}, {
    readonly type: "error";
    readonly name: "AlreadyProposed";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "AlreadyVoted";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "NoBallots";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "OnlyRequester";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "UnknownRequest";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "WrongState";
    readonly inputs: readonly [{
        readonly name: "actual";
        readonly type: "uint8";
        readonly internalType: "enum IOptimisticOracleV2.State";
    }];
}];
//# sourceMappingURL=MockOptimisticOracleV2.d.ts.map