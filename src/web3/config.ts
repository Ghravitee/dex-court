// src/web3/config.ts

export const ESCROW_CA: Record<number, `0x${string}`> = {
    1: "0x", // Mainnet address
    11155111: "0x664e1A3a1868c77f85C9b9433379A60552E93715", // Sepolia address
};

export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

const CHAIN_EXPLORER_URLS: { [chainId: number]: string } = {
    // Ethereum Mainnet and Testnets
    1: "https://etherscan.io",
    11155111: "https://sepolia.etherscan.io",

    // BNB Smart Chain
    56: "https://bscscan.com", // BSC Mainnet:cite[4]:cite[8]
    97: "https://testnet.bscscan.com"
};

export const getExplorerUrl = (chainId: number): string => {
    return CHAIN_EXPLORER_URLS[chainId] || "https://etherscan.io"; // Default fallback
};

export const ESCROW_ABI = {
    abi: [
        {
            "type": "constructor",
            "inputs": [
                {
                    "name": "_voting",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "initialOwner",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_feeRec",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "receive",
            "stateMutability": "payable"
        },
        {
            "type": "function",
            "name": "approveCancellation",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_final",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "approveDelivery",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_final",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "cancelOrder",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "claimMilestone",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "idx",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "createAgreement",
            "inputs": [
                {
                    "name": "_agreementId",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_serviceProvider",
                    "type": "address",
                    "internalType": "address payable"
                },
                {
                    "name": "_serviceRecipient",
                    "type": "address",
                    "internalType": "address payable"
                },
                {
                    "name": "_token",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_amount",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_deadlineDuration",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "vestingMode",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "_privateMode",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "milestonePercs",
                    "type": "uint256[]",
                    "internalType": "uint256[]"
                },
                {
                    "name": "milestoneOffsets",
                    "type": "uint256[]",
                    "internalType": "uint256[]"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "payable"
        },
        {
            "type": "function",
            "name": "depositFunds",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "payable"
        },
        {
            "type": "function",
            "name": "enforceCancellationTimeout",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "finalAutoRelease",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "freezeAgreement",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "status",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "getAgreement",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "_id",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "creator",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "serviceProvider",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "serviceRecipient",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "token",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "amount",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "remainingAmount",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "createdAt",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "deadline",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "deadlineDuration",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "grace1Ends",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "grace2Ends",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "grace1EndsCalledBy",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "grace2EndsCalledBy",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "funded",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "signed",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "acceptedByServiceProvider",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "acceptedByServiceRecipient",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "completed",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "disputed",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "privateMode",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "frozen",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "pendingCancellation",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "orderCancelled",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "vesting",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "deliverySubmited",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "votingId",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "getMilestone",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "idx",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "percentBP",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "unlockAt",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "heldByRecipient",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "claimed",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "amount",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "getMilestoneCount",
            "inputs": [
                {
                    "name": "id",
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
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "getStats",
            "inputs": [],
            "outputs": [
                {
                    "name": "agreementsTotal",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "disputesTotal",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "smoothTotal",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "feesTaken",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "escrowedETH",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_platformFeeBP",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_grace1Duration",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_grace2Duration",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "_votingContract",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_feeRecipient",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "owner",
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
            "name": "partialAutoRelease",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "raiseDispute",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "plaintiffIsServiceRecipient",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "evidenceHash",
                    "type": "bytes32",
                    "internalType": "bytes32"
                },
                {
                    "name": "proBono",
                    "type": "bool",
                    "internalType": "bool"
                },
                {
                    "name": "feeToken",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "feeAmount",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "payable"
        },
        {
            "type": "function",
            "name": "recoverStuckETH",
            "inputs": [],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "recoverStuckToken",
            "inputs": [
                {
                    "name": "token",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "_amount",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "renounceOwnership",
            "inputs": [],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setFeeRecipient",
            "inputs": [
                {
                    "name": "recipient",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setGracePeriods",
            "inputs": [
                {
                    "name": "g1",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "g2",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setMilestoneHold",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "idx",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "hold",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setPlatformFee",
            "inputs": [
                {
                    "name": "bp",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "setVotingContract",
            "inputs": [
                {
                    "name": "_voting",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "signAgreement",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "submitDelivery",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "transferOwnership",
            "inputs": [
                {
                    "name": "newOwner",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "event",
            "name": "AgreementCompleted",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "disputed",
                    "type": "bool",
                    "indexed": false,
                    "internalType": "bool"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "AgreementCreated",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "creator",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                },
                {
                    "name": "serviceProvider",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "serviceRecipient",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "token",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                },
                {
                    "name": "amount",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                },
                {
                    "name": "vestingMode",
                    "type": "bool",
                    "indexed": false,
                    "internalType": "bool"
                },
                {
                    "name": "privateMode",
                    "type": "bool",
                    "indexed": false,
                    "internalType": "bool"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "AgreementFrozen",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "status",
                    "type": "bool",
                    "indexed": false,
                    "internalType": "bool"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "AgreementSigned",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "serviceProvider",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "serviceRecipient",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "CancellationApproved",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "by",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "CancellationRejected",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "by",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "DeliveryApproved",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "by",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "DeliveryRejected",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "by",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "DeliverySubmitted",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "by",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "DisputeRaised",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "plaintiff",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                },
                {
                    "name": "defendant",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                },
                {
                    "name": "votingId",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "FeeRecipientUpdated",
            "inputs": [
                {
                    "name": "recipient",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "FundsDeposited",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "token",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                },
                {
                    "name": "amount",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "FundsReleased",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "toServiceProvider",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                },
                {
                    "name": "toServiceRecipient",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                },
                {
                    "name": "fee",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "GracePeriodUpdated",
            "inputs": [
                {
                    "name": "grace1",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                },
                {
                    "name": "grace2",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "MilestoneClaimed",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "by",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                },
                {
                    "name": "idx",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "amount",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "MilestoneHoldUpdated",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "by",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                },
                {
                    "name": "idx",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "heldByRecipient",
                    "type": "bool",
                    "indexed": false,
                    "internalType": "bool"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "OrderCancelled",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                },
                {
                    "name": "by",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "OwnershipTransferred",
            "inputs": [
                {
                    "name": "previousOwner",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "newOwner",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "PlatformFeeUpdated",
            "inputs": [
                {
                    "name": "feeBP",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "StuckFundsRecovered",
            "inputs": [
                {
                    "name": "token",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                },
                {
                    "name": "amount",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "VestingConfigured",
            "inputs": [
                {
                    "name": "id",
                    "type": "uint256",
                    "indexed": true,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "VotingContractUpdated",
            "inputs": [
                {
                    "name": "_v",
                    "type": "address",
                    "indexed": false,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "error",
            "name": "AlreadyAccepted",
            "inputs": []
        },
        {
            "type": "error",
            "name": "AlreadyFunded",
            "inputs": []
        },
        {
            "type": "error",
            "name": "AlreadyInGracePeriod",
            "inputs": []
        },
        {
            "type": "error",
            "name": "AlreadyPendingCancellation",
            "inputs": []
        },
        {
            "type": "error",
            "name": "AlreadySigned",
            "inputs": []
        },
        {
            "type": "error",
            "name": "CannotBeTheSame",
            "inputs": []
        },
        {
            "type": "error",
            "name": "Grace1NotEnded",
            "inputs": []
        },
        {
            "type": "error",
            "name": "Grace1PeriodEnded",
            "inputs": []
        },
        {
            "type": "error",
            "name": "Grace2NotEnded",
            "inputs": []
        },
        {
            "type": "error",
            "name": "InVestingStage",
            "inputs": []
        },
        {
            "type": "error",
            "name": "InitiatorCannotRespond",
            "inputs": []
        },
        {
            "type": "error",
            "name": "InvalidAmount",
            "inputs": []
        },
        {
            "type": "error",
            "name": "InvalidMilestoneConfig",
            "inputs": []
        },
        {
            "type": "error",
            "name": "MilestoneAlreadyClaimed",
            "inputs": []
        },
        {
            "type": "error",
            "name": "MilestoneHeld",
            "inputs": []
        },
        {
            "type": "error",
            "name": "MilestoneNotUnlocked",
            "inputs": []
        },
        {
            "type": "error",
            "name": "NoActionMade",
            "inputs": []
        },
        {
            "type": "error",
            "name": "NoVestingStage",
            "inputs": []
        },
        {
            "type": "error",
            "name": "NotActive",
            "inputs": []
        },
        {
            "type": "error",
            "name": "NotParty",
            "inputs": []
        },
        {
            "type": "error",
            "name": "NotSigned",
            "inputs": []
        },
        {
            "type": "error",
            "name": "NotYetFunded",
            "inputs": []
        },
        {
            "type": "error",
            "name": "OffsetExceedsDeadline",
            "inputs": []
        },
        {
            "type": "error",
            "name": "OwnableInvalidOwner",
            "inputs": [
                {
                    "name": "owner",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "OwnableUnauthorizedAccount",
            "inputs": [
                {
                    "name": "account",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "ReentrancyGuardReentrantCall",
            "inputs": []
        },
        {
            "type": "error",
            "name": "SafeERC20FailedOperation",
            "inputs": [
                {
                    "name": "token",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "ZeroAddress",
            "inputs": []
        },
        {
            "type": "error",
            "name": "ZeroEvidence",
            "inputs": []
        }
    ],
} as const;

export const ERC20_ABI = {
    abi: [
        {
            "type": "constructor",
            "inputs": [
                {
                    "name": "name",
                    "type": "string",
                    "internalType": "string"
                },
                {
                    "name": "symbol",
                    "type": "string",
                    "internalType": "string"
                },
                {
                    "name": "initialSupply",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "initialOwner",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "allowance",
            "inputs": [
                {
                    "name": "owner",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "spender",
                    "type": "address",
                    "internalType": "address"
                }
            ],
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
            "name": "approve",
            "inputs": [
                {
                    "name": "spender",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "value",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "balanceOf",
            "inputs": [
                {
                    "name": "account",
                    "type": "address",
                    "internalType": "address"
                }
            ],
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
            "name": "decimals",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "uint8",
                    "internalType": "uint8"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "name",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "string",
                    "internalType": "string"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "owner",
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
            "name": "renounceOwnership",
            "inputs": [],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "symbol",
            "inputs": [],
            "outputs": [
                {
                    "name": "",
                    "type": "string",
                    "internalType": "string"
                }
            ],
            "stateMutability": "view"
        },
        {
            "type": "function",
            "name": "totalSupply",
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
            "name": "transfer",
            "inputs": [
                {
                    "name": "to",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "value",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "transferFrom",
            "inputs": [
                {
                    "name": "from",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "to",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "value",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ],
            "outputs": [
                {
                    "name": "",
                    "type": "bool",
                    "internalType": "bool"
                }
            ],
            "stateMutability": "nonpayable"
        },
        {
            "type": "function",
            "name": "transferOwnership",
            "inputs": [
                {
                    "name": "newOwner",
                    "type": "address",
                    "internalType": "address"
                }
            ],
            "outputs": [],
            "stateMutability": "nonpayable"
        },
        {
            "type": "event",
            "name": "Approval",
            "inputs": [
                {
                    "name": "owner",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "spender",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "value",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "OwnershipTransferred",
            "inputs": [
                {
                    "name": "previousOwner",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "newOwner",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                }
            ],
            "anonymous": false
        },
        {
            "type": "event",
            "name": "Transfer",
            "inputs": [
                {
                    "name": "from",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "to",
                    "type": "address",
                    "indexed": true,
                    "internalType": "address"
                },
                {
                    "name": "value",
                    "type": "uint256",
                    "indexed": false,
                    "internalType": "uint256"
                }
            ],
            "anonymous": false
        },
        {
            "type": "error",
            "name": "ERC20InsufficientAllowance",
            "inputs": [
                {
                    "name": "spender",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "allowance",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "needed",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        },
        {
            "type": "error",
            "name": "ERC20InsufficientBalance",
            "inputs": [
                {
                    "name": "sender",
                    "type": "address",
                    "internalType": "address"
                },
                {
                    "name": "balance",
                    "type": "uint256",
                    "internalType": "uint256"
                },
                {
                    "name": "needed",
                    "type": "uint256",
                    "internalType": "uint256"
                }
            ]
        },
        {
            "type": "error",
            "name": "ERC20InvalidApprover",
            "inputs": [
                {
                    "name": "approver",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "ERC20InvalidReceiver",
            "inputs": [
                {
                    "name": "receiver",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "ERC20InvalidSender",
            "inputs": [
                {
                    "name": "sender",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "ERC20InvalidSpender",
            "inputs": [
                {
                    "name": "spender",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "OwnableInvalidOwner",
            "inputs": [
                {
                    "name": "owner",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        },
        {
            "type": "error",
            "name": "OwnableUnauthorizedAccount",
            "inputs": [
                {
                    "name": "account",
                    "type": "address",
                    "internalType": "address"
                }
            ]
        }
    ],

} as const;