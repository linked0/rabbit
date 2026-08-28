export declare const CTFExchangeAbi: readonly [{
    readonly type: "constructor";
    readonly inputs: readonly [{
        readonly name: "_collateral";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "_ctf";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "_proxyFactory";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "_safeFactory";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "addAdmin";
    readonly inputs: readonly [{
        readonly name: "admin_";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "addOperator";
    readonly inputs: readonly [{
        readonly name: "operator_";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "admins";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "cancelOrder";
    readonly inputs: readonly [{
        readonly name: "order";
        readonly type: "tuple";
        readonly internalType: "struct Order";
        readonly components: readonly [{
            readonly name: "salt";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "maker";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "signer";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "taker";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "tokenId";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "makerAmount";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "takerAmount";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "expiration";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "nonce";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "feeRateBps";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "side";
            readonly type: "uint8";
            readonly internalType: "enum Side";
        }, {
            readonly name: "signatureType";
            readonly type: "uint8";
            readonly internalType: "enum SignatureType";
        }, {
            readonly name: "signature";
            readonly type: "bytes";
            readonly internalType: "bytes";
        }];
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "cancelOrders";
    readonly inputs: readonly [{
        readonly name: "orders";
        readonly type: "tuple[]";
        readonly internalType: "struct Order[]";
        readonly components: readonly [{
            readonly name: "salt";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "maker";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "signer";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "taker";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "tokenId";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "makerAmount";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "takerAmount";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "expiration";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "nonce";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "feeRateBps";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "side";
            readonly type: "uint8";
            readonly internalType: "enum Side";
        }, {
            readonly name: "signatureType";
            readonly type: "uint8";
            readonly internalType: "enum SignatureType";
        }, {
            readonly name: "signature";
            readonly type: "bytes";
            readonly internalType: "bytes";
        }];
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "domainSeparator";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "fillOrder";
    readonly inputs: readonly [{
        readonly name: "order";
        readonly type: "tuple";
        readonly internalType: "struct Order";
        readonly components: readonly [{
            readonly name: "salt";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "maker";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "signer";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "taker";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "tokenId";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "makerAmount";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "takerAmount";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "expiration";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "nonce";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "feeRateBps";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "side";
            readonly type: "uint8";
            readonly internalType: "enum Side";
        }, {
            readonly name: "signatureType";
            readonly type: "uint8";
            readonly internalType: "enum SignatureType";
        }, {
            readonly name: "signature";
            readonly type: "bytes";
            readonly internalType: "bytes";
        }];
    }, {
        readonly name: "fillAmount";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "fillOrders";
    readonly inputs: readonly [{
        readonly name: "orders";
        readonly type: "tuple[]";
        readonly internalType: "struct Order[]";
        readonly components: readonly [{
            readonly name: "salt";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "maker";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "signer";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "taker";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "tokenId";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "makerAmount";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "takerAmount";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "expiration";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "nonce";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "feeRateBps";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "side";
            readonly type: "uint8";
            readonly internalType: "enum Side";
        }, {
            readonly name: "signatureType";
            readonly type: "uint8";
            readonly internalType: "enum SignatureType";
        }, {
            readonly name: "signature";
            readonly type: "bytes";
            readonly internalType: "bytes";
        }];
    }, {
        readonly name: "fillAmounts";
        readonly type: "uint256[]";
        readonly internalType: "uint256[]";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "getCollateral";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getComplement";
    readonly inputs: readonly [{
        readonly name: "token";
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
    readonly name: "getConditionId";
    readonly inputs: readonly [{
        readonly name: "token";
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
    readonly name: "getCtf";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getMaxFeeRate";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "pure";
}, {
    readonly type: "function";
    readonly name: "getOrderStatus";
    readonly inputs: readonly [{
        readonly name: "orderHash";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "tuple";
        readonly internalType: "struct OrderStatus";
        readonly components: readonly [{
            readonly name: "isFilledOrCancelled";
            readonly type: "bool";
            readonly internalType: "bool";
        }, {
            readonly name: "remaining";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }];
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getPolyProxyFactoryImplementation";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getPolyProxyWalletAddress";
    readonly inputs: readonly [{
        readonly name: "_addr";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getProxyFactory";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getSafeAddress";
    readonly inputs: readonly [{
        readonly name: "_addr";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getSafeFactory";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "getSafeFactoryImplementation";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "hashOrder";
    readonly inputs: readonly [{
        readonly name: "order";
        readonly type: "tuple";
        readonly internalType: "struct Order";
        readonly components: readonly [{
            readonly name: "salt";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "maker";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "signer";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "taker";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "tokenId";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "makerAmount";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "takerAmount";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "expiration";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "nonce";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "feeRateBps";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "side";
            readonly type: "uint8";
            readonly internalType: "enum Side";
        }, {
            readonly name: "signatureType";
            readonly type: "uint8";
            readonly internalType: "enum SignatureType";
        }, {
            readonly name: "signature";
            readonly type: "bytes";
            readonly internalType: "bytes";
        }];
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "incrementNonce";
    readonly inputs: readonly [];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "isAdmin";
    readonly inputs: readonly [{
        readonly name: "usr";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
        readonly internalType: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "isOperator";
    readonly inputs: readonly [{
        readonly name: "usr";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
        readonly internalType: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "isValidNonce";
    readonly inputs: readonly [{
        readonly name: "usr";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "nonce";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
        readonly internalType: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "matchOrders";
    readonly inputs: readonly [{
        readonly name: "takerOrder";
        readonly type: "tuple";
        readonly internalType: "struct Order";
        readonly components: readonly [{
            readonly name: "salt";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "maker";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "signer";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "taker";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "tokenId";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "makerAmount";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "takerAmount";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "expiration";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "nonce";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "feeRateBps";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "side";
            readonly type: "uint8";
            readonly internalType: "enum Side";
        }, {
            readonly name: "signatureType";
            readonly type: "uint8";
            readonly internalType: "enum SignatureType";
        }, {
            readonly name: "signature";
            readonly type: "bytes";
            readonly internalType: "bytes";
        }];
    }, {
        readonly name: "makerOrders";
        readonly type: "tuple[]";
        readonly internalType: "struct Order[]";
        readonly components: readonly [{
            readonly name: "salt";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "maker";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "signer";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "taker";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "tokenId";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "makerAmount";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "takerAmount";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "expiration";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "nonce";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "feeRateBps";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "side";
            readonly type: "uint8";
            readonly internalType: "enum Side";
        }, {
            readonly name: "signatureType";
            readonly type: "uint8";
            readonly internalType: "enum SignatureType";
        }, {
            readonly name: "signature";
            readonly type: "bytes";
            readonly internalType: "bytes";
        }];
    }, {
        readonly name: "takerFillAmount";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "makerFillAmounts";
        readonly type: "uint256[]";
        readonly internalType: "uint256[]";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "nonces";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "onERC1155BatchReceived";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "";
        readonly type: "uint256[]";
        readonly internalType: "uint256[]";
    }, {
        readonly name: "";
        readonly type: "uint256[]";
        readonly internalType: "uint256[]";
    }, {
        readonly name: "";
        readonly type: "bytes";
        readonly internalType: "bytes";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes4";
        readonly internalType: "bytes4";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "onERC1155Received";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }, {
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "";
        readonly type: "bytes";
        readonly internalType: "bytes";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes4";
        readonly internalType: "bytes4";
    }];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "operators";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "orderStatus";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [{
        readonly name: "isFilledOrCancelled";
        readonly type: "bool";
        readonly internalType: "bool";
    }, {
        readonly name: "remaining";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "parentCollectionId";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "pauseTrading";
    readonly inputs: readonly [];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "paused";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
        readonly internalType: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "proxyFactory";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "registerToken";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "complement";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "conditionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "registry";
    readonly inputs: readonly [{
        readonly name: "";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [{
        readonly name: "complement";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "conditionId";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "removeAdmin";
    readonly inputs: readonly [{
        readonly name: "admin";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "removeOperator";
    readonly inputs: readonly [{
        readonly name: "operator";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "renounceAdminRole";
    readonly inputs: readonly [];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "renounceOperatorRole";
    readonly inputs: readonly [];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "safeFactory";
    readonly inputs: readonly [];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "setProxyFactory";
    readonly inputs: readonly [{
        readonly name: "_newProxyFactory";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "setSafeFactory";
    readonly inputs: readonly [{
        readonly name: "_newSafeFactory";
        readonly type: "address";
        readonly internalType: "address";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "supportsInterface";
    readonly inputs: readonly [{
        readonly name: "interfaceId";
        readonly type: "bytes4";
        readonly internalType: "bytes4";
    }];
    readonly outputs: readonly [{
        readonly name: "";
        readonly type: "bool";
        readonly internalType: "bool";
    }];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "unpauseTrading";
    readonly inputs: readonly [];
    readonly outputs: readonly [];
    readonly stateMutability: "nonpayable";
}, {
    readonly type: "function";
    readonly name: "validateComplement";
    readonly inputs: readonly [{
        readonly name: "token";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }, {
        readonly name: "complement";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "validateOrder";
    readonly inputs: readonly [{
        readonly name: "order";
        readonly type: "tuple";
        readonly internalType: "struct Order";
        readonly components: readonly [{
            readonly name: "salt";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "maker";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "signer";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "taker";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "tokenId";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "makerAmount";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "takerAmount";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "expiration";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "nonce";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "feeRateBps";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "side";
            readonly type: "uint8";
            readonly internalType: "enum Side";
        }, {
            readonly name: "signatureType";
            readonly type: "uint8";
            readonly internalType: "enum SignatureType";
        }, {
            readonly name: "signature";
            readonly type: "bytes";
            readonly internalType: "bytes";
        }];
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "validateOrderSignature";
    readonly inputs: readonly [{
        readonly name: "orderHash";
        readonly type: "bytes32";
        readonly internalType: "bytes32";
    }, {
        readonly name: "order";
        readonly type: "tuple";
        readonly internalType: "struct Order";
        readonly components: readonly [{
            readonly name: "salt";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "maker";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "signer";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "taker";
            readonly type: "address";
            readonly internalType: "address";
        }, {
            readonly name: "tokenId";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "makerAmount";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "takerAmount";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "expiration";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "nonce";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "feeRateBps";
            readonly type: "uint256";
            readonly internalType: "uint256";
        }, {
            readonly name: "side";
            readonly type: "uint8";
            readonly internalType: "enum Side";
        }, {
            readonly name: "signatureType";
            readonly type: "uint8";
            readonly internalType: "enum SignatureType";
        }, {
            readonly name: "signature";
            readonly type: "bytes";
            readonly internalType: "bytes";
        }];
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "view";
}, {
    readonly type: "function";
    readonly name: "validateTokenId";
    readonly inputs: readonly [{
        readonly name: "tokenId";
        readonly type: "uint256";
        readonly internalType: "uint256";
    }];
    readonly outputs: readonly [];
    readonly stateMutability: "view";
}, {
    readonly type: "event";
    readonly name: "FeeCharged";
    readonly inputs: readonly [{
        readonly name: "receiver";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "tokenId";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }, {
        readonly name: "amount";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "NewAdmin";
    readonly inputs: readonly [{
        readonly name: "newAdminAddress";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "admin";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "NewOperator";
    readonly inputs: readonly [{
        readonly name: "newOperatorAddress";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "admin";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "OrderCancelled";
    readonly inputs: readonly [{
        readonly name: "orderHash";
        readonly type: "bytes32";
        readonly indexed: true;
        readonly internalType: "bytes32";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "OrderFilled";
    readonly inputs: readonly [{
        readonly name: "orderHash";
        readonly type: "bytes32";
        readonly indexed: true;
        readonly internalType: "bytes32";
    }, {
        readonly name: "maker";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "taker";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "makerAssetId";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }, {
        readonly name: "takerAssetId";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }, {
        readonly name: "makerAmountFilled";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }, {
        readonly name: "takerAmountFilled";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }, {
        readonly name: "fee";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "OrdersMatched";
    readonly inputs: readonly [{
        readonly name: "takerOrderHash";
        readonly type: "bytes32";
        readonly indexed: true;
        readonly internalType: "bytes32";
    }, {
        readonly name: "takerOrderMaker";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "makerAssetId";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }, {
        readonly name: "takerAssetId";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }, {
        readonly name: "makerAmountFilled";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }, {
        readonly name: "takerAmountFilled";
        readonly type: "uint256";
        readonly indexed: false;
        readonly internalType: "uint256";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "ProxyFactoryUpdated";
    readonly inputs: readonly [{
        readonly name: "oldProxyFactory";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "newProxyFactory";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "RemovedAdmin";
    readonly inputs: readonly [{
        readonly name: "removedAdmin";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "admin";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "RemovedOperator";
    readonly inputs: readonly [{
        readonly name: "removedOperator";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "admin";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "SafeFactoryUpdated";
    readonly inputs: readonly [{
        readonly name: "oldSafeFactory";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }, {
        readonly name: "newSafeFactory";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "TokenRegistered";
    readonly inputs: readonly [{
        readonly name: "token0";
        readonly type: "uint256";
        readonly indexed: true;
        readonly internalType: "uint256";
    }, {
        readonly name: "token1";
        readonly type: "uint256";
        readonly indexed: true;
        readonly internalType: "uint256";
    }, {
        readonly name: "conditionId";
        readonly type: "bytes32";
        readonly indexed: true;
        readonly internalType: "bytes32";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "TradingPaused";
    readonly inputs: readonly [{
        readonly name: "pauser";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }];
    readonly anonymous: false;
}, {
    readonly type: "event";
    readonly name: "TradingUnpaused";
    readonly inputs: readonly [{
        readonly name: "pauser";
        readonly type: "address";
        readonly indexed: true;
        readonly internalType: "address";
    }];
    readonly anonymous: false;
}, {
    readonly type: "error";
    readonly name: "AlreadyRegistered";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "FeeTooHigh";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "InvalidComplement";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "InvalidNonce";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "InvalidSignature";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "InvalidTokenId";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "MakingGtRemaining";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "MismatchedTokenIds";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "NotAdmin";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "NotCrossing";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "NotOperator";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "NotOwner";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "NotTaker";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "OrderExpired";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "OrderFilledOrCancelled";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "Paused";
    readonly inputs: readonly [];
}, {
    readonly type: "error";
    readonly name: "TooLittleTokensReceived";
    readonly inputs: readonly [];
}];
//# sourceMappingURL=CTFExchange.d.ts.map