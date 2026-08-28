"use strict";
// AUTO-GENERATED — do not edit. Regenerate via `pnpm sync-abis`.
// Source: packages/contracts/out/UmaCtfAdapter.sol/UmaCtfAdapter.json
Object.defineProperty(exports, "__esModule", { value: true });
exports.UmaCtfAdapterAbi = void 0;
exports.UmaCtfAdapterAbi = [
    {
        "type": "constructor",
        "inputs": [
            {
                "name": "_ctf",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "_oo",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "_admin",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "YES_OR_NO_QUERY",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "admin",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "ctf",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "contract IConditionalTokens"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getQuestion",
        "inputs": [
            {
                "name": "questionId",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "tuple",
                "internalType": "struct UmaCtfAdapter.Question",
                "components": [
                    {
                        "name": "requestTimestamp",
                        "type": "uint256",
                        "internalType": "uint256"
                    },
                    {
                        "name": "creator",
                        "type": "address",
                        "internalType": "address"
                    },
                    {
                        "name": "rewardToken",
                        "type": "address",
                        "internalType": "address"
                    },
                    {
                        "name": "reward",
                        "type": "uint256",
                        "internalType": "uint256"
                    },
                    {
                        "name": "bond",
                        "type": "uint256",
                        "internalType": "uint256"
                    },
                    {
                        "name": "ancillaryData",
                        "type": "bytes",
                        "internalType": "bytes"
                    },
                    {
                        "name": "resolved",
                        "type": "bool",
                        "internalType": "bool"
                    }
                ]
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "initialize",
        "inputs": [
            {
                "name": "ancillaryData",
                "type": "bytes",
                "internalType": "bytes"
            },
            {
                "name": "rewardToken",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "reward",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "bond",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "liveness",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "questionId",
                "type": "bytes32",
                "internalType": "bytes32"
            },
            {
                "name": "conditionId",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "isSettleable",
        "inputs": [
            {
                "name": "questionId",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "bool",
                "internalType": "bool"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "oo",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "contract IOptimisticOracleV2"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "resolve",
        "inputs": [
            {
                "name": "questionId",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "event",
        "name": "QuestionInitialized",
        "inputs": [
            {
                "name": "questionId",
                "type": "bytes32",
                "indexed": true,
                "internalType": "bytes32"
            },
            {
                "name": "conditionId",
                "type": "bytes32",
                "indexed": true,
                "internalType": "bytes32"
            },
            {
                "name": "requestTimestamp",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            },
            {
                "name": "ancillaryData",
                "type": "bytes",
                "indexed": false,
                "internalType": "bytes"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "QuestionResolved",
        "inputs": [
            {
                "name": "questionId",
                "type": "bytes32",
                "indexed": true,
                "internalType": "bytes32"
            },
            {
                "name": "settledPrice",
                "type": "int256",
                "indexed": false,
                "internalType": "int256"
            },
            {
                "name": "payouts",
                "type": "uint256[]",
                "indexed": false,
                "internalType": "uint256[]"
            }
        ],
        "anonymous": false
    },
    {
        "type": "error",
        "name": "AlreadyInitialized",
        "inputs": []
    },
    {
        "type": "error",
        "name": "AlreadyResolved",
        "inputs": []
    },
    {
        "type": "error",
        "name": "InvalidAncillaryData",
        "inputs": []
    },
    {
        "type": "error",
        "name": "NotAdmin",
        "inputs": []
    },
    {
        "type": "error",
        "name": "NotInitialized",
        "inputs": []
    },
    {
        "type": "error",
        "name": "UnsupportedPrice",
        "inputs": [
            {
                "name": "price",
                "type": "int256",
                "internalType": "int256"
            }
        ]
    }
];
//# sourceMappingURL=UmaCtfAdapter.js.map