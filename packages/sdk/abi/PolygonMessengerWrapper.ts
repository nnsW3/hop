export default [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_l1BridgeAddress",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_checkpointManager",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_fxRoot",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_fxChildTunnel",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_l2ChainId",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "inputs": [],
    "name": "SEND_MESSAGE_EVENT_SIG",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "contract IL1Bridge",
        "name": "l1Bridge",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "rootHash",
        "type": "bytes32"
      },
      {
        "internalType": "uint256",
        "name": "totalAmount",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "challengePeriod",
        "type": "uint256"
      }
    ],
    "name": "canConfirmRoot",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "checkpointManager",
    "outputs": [
      {
        "internalType": "contract ICheckpointManager",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32[]",
        "name": "rootHashes",
        "type": "bytes32[]"
      },
      {
        "internalType": "uint256[]",
        "name": "destinationChainIds",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "totalAmounts",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "rootCommittedAts",
        "type": "uint256[]"
      }
    ],
    "name": "confirmRoots",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fxChildTunnel",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "fxRoot",
    "outputs": [
      {
        "internalType": "contract IFxStateSender",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "isRootConfirmation",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "l1BridgeAddress",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "l2ChainId",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "name": "processedExits",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "inputData",
        "type": "bytes"
      }
    ],
    "name": "receiveMessage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes",
        "name": "_calldata",
        "type": "bytes"
      }
    ],
    "name": "sendCrossDomainMessage",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_fxChildTunnel",
        "type": "address"
      }
    ],
    "name": "setFxChildTunnel",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "l1BridgeCaller",
        "type": "address"
      },
      {
        "internalType": "bytes",
        "name": "",
        "type": "bytes"
      }
    ],
    "name": "verifySender",
    "outputs": [],
    "stateMutability": "view",
    "type": "function"
  }
]
