"use strict";
// AUTO-GENERATED — do not edit. Regenerate via `pnpm sync-abis`.
// Source: packages/contracts/out/MockOptimisticOracleV2.sol/MockOptimisticOracleV2.json
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockOptimisticOracleV2Abi = void 0;
exports.MockOptimisticOracleV2Abi = [
    {
        "type": "function",
        "name": "DEFAULT_LIVENESS",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "disputePrice",
        "inputs": [
            {
                "name": "requester",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "identifier",
                "type": "bytes32",
                "internalType": "bytes32"
            },
            {
                "name": "timestamp",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "ancillaryData",
                "type": "bytes",
                "internalType": "bytes"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "finalizeVote",
        "inputs": [
            {
                "name": "requester",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "identifier",
                "type": "bytes32",
                "internalType": "bytes32"
            },
            {
                "name": "timestamp",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "ancillaryData",
                "type": "bytes",
                "internalType": "bytes"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "getBallots",
        "inputs": [
            {
                "name": "requester",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "identifier",
                "type": "bytes32",
                "internalType": "bytes32"
            },
            {
                "name": "timestamp",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "ancillaryData",
                "type": "bytes",
                "internalType": "bytes"
            }
        ],
        "outputs": [
            {
                "name": "voters",
                "type": "address[]",
                "internalType": "address[]"
            },
            {
                "name": "answers",
                "type": "int256[]",
                "internalType": "int256[]"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getRequest",
        "inputs": [
            {
                "name": "requester",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "identifier",
                "type": "bytes32",
                "internalType": "bytes32"
            },
            {
                "name": "timestamp",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "ancillaryData",
                "type": "bytes",
                "internalType": "bytes"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "tuple",
                "internalType": "struct IOptimisticOracleV2.Request",
                "components": [
                    {
                        "name": "proposer",
                        "type": "address",
                        "internalType": "address"
                    },
                    {
                        "name": "disputer",
                        "type": "address",
                        "internalType": "address"
                    },
                    {
                        "name": "currency",
                        "type": "address",
                        "internalType": "address"
                    },
                    {
                        "name": "settled",
                        "type": "bool",
                        "internalType": "bool"
                    },
                    {
                        "name": "refundOnDispute",
                        "type": "bool",
                        "internalType": "bool"
                    },
                    {
                        "name": "proposedPrice",
                        "type": "int256",
                        "internalType": "int256"
                    },
                    {
                        "name": "resolvedPrice",
                        "type": "int256",
                        "internalType": "int256"
                    },
                    {
                        "name": "expirationTime",
                        "type": "uint256",
                        "internalType": "uint256"
                    },
                    {
                        "name": "reward",
                        "type": "uint256",
                        "internalType": "uint256"
                    },
                    {
                        "name": "finalFee",
                        "type": "uint256",
                        "internalType": "uint256"
                    },
                    {
                        "name": "bond",
                        "type": "uint256",
                        "internalType": "uint256"
                    },
                    {
                        "name": "customLiveness",
                        "type": "uint256",
                        "internalType": "uint256"
                    }
                ]
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "getState",
        "inputs": [
            {
                "name": "requester",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "identifier",
                "type": "bytes32",
                "internalType": "bytes32"
            },
            {
                "name": "timestamp",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "ancillaryData",
                "type": "bytes",
                "internalType": "bytes"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint8",
                "internalType": "enum IOptimisticOracleV2.State"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "proposePrice",
        "inputs": [
            {
                "name": "requester",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "identifier",
                "type": "bytes32",
                "internalType": "bytes32"
            },
            {
                "name": "timestamp",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "ancillaryData",
                "type": "bytes",
                "internalType": "bytes"
            },
            {
                "name": "price",
                "type": "int256",
                "internalType": "int256"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "requestPrice",
        "inputs": [
            {
                "name": "identifier",
                "type": "bytes32",
                "internalType": "bytes32"
            },
            {
                "name": "timestamp",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "ancillaryData",
                "type": "bytes",
                "internalType": "bytes"
            },
            {
                "name": "currency",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "reward",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "setBond",
        "inputs": [
            {
                "name": "identifier",
                "type": "bytes32",
                "internalType": "bytes32"
            },
            {
                "name": "timestamp",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "ancillaryData",
                "type": "bytes",
                "internalType": "bytes"
            },
            {
                "name": "bond",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "setCustomLiveness",
        "inputs": [
            {
                "name": "identifier",
                "type": "bytes32",
                "internalType": "bytes32"
            },
            {
                "name": "timestamp",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "ancillaryData",
                "type": "bytes",
                "internalType": "bytes"
            },
            {
                "name": "liveness",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "settleAndGetPrice",
        "inputs": [
            {
                "name": "identifier",
                "type": "bytes32",
                "internalType": "bytes32"
            },
            {
                "name": "timestamp",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "ancillaryData",
                "type": "bytes",
                "internalType": "bytes"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "int256",
                "internalType": "int256"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "vote",
        "inputs": [
            {
                "name": "requester",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "identifier",
                "type": "bytes32",
                "internalType": "bytes32"
            },
            {
                "name": "timestamp",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "ancillaryData",
                "type": "bytes",
                "internalType": "bytes"
            },
            {
                "name": "answer",
                "type": "int256",
                "internalType": "int256"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "event",
        "name": "PriceDisputed",
        "inputs": [
            {
                "name": "disputer",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "key",
                "type": "bytes32",
                "indexed": false,
                "internalType": "bytes32"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "PriceProposed",
        "inputs": [
            {
                "name": "proposer",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "key",
                "type": "bytes32",
                "indexed": false,
                "internalType": "bytes32"
            },
            {
                "name": "price",
                "type": "int256",
                "indexed": false,
                "internalType": "int256"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "PriceRequested",
        "inputs": [
            {
                "name": "requester",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "key",
                "type": "bytes32",
                "indexed": false,
                "internalType": "bytes32"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "Settled",
        "inputs": [
            {
                "name": "key",
                "type": "bytes32",
                "indexed": false,
                "internalType": "bytes32"
            },
            {
                "name": "price",
                "type": "int256",
                "indexed": false,
                "internalType": "int256"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "VoteCast",
        "inputs": [
            {
                "name": "voter",
                "type": "address",
                "indexed": true,
                "internalType": "address"
            },
            {
                "name": "key",
                "type": "bytes32",
                "indexed": false,
                "internalType": "bytes32"
            },
            {
                "name": "answer",
                "type": "int256",
                "indexed": false,
                "internalType": "int256"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "VoteFinalized",
        "inputs": [
            {
                "name": "key",
                "type": "bytes32",
                "indexed": false,
                "internalType": "bytes32"
            },
            {
                "name": "verdict",
                "type": "int256",
                "indexed": false,
                "internalType": "int256"
            },
            {
                "name": "ballotCount",
                "type": "uint256",
                "indexed": false,
                "internalType": "uint256"
            }
        ],
        "anonymous": false
    },
    {
        "type": "error",
        "name": "AlreadyProposed",
        "inputs": []
    },
    {
        "type": "error",
        "name": "AlreadyVoted",
        "inputs": []
    },
    {
        "type": "error",
        "name": "NoBallots",
        "inputs": []
    },
    {
        "type": "error",
        "name": "OnlyRequester",
        "inputs": []
    },
    {
        "type": "error",
        "name": "UnknownRequest",
        "inputs": []
    },
    {
        "type": "error",
        "name": "WrongState",
        "inputs": [
            {
                "name": "actual",
                "type": "uint8",
                "internalType": "enum IOptimisticOracleV2.State"
            }
        ]
    }
];
//# sourceMappingURL=MockOptimisticOracleV2.js.map