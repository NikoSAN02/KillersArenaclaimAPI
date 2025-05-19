const express = require('express');
const ethers = require('ethers');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Smart contract address and ABI
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS;
const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_receiver",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_quantity",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "_currency",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "_pricePerToken",
        "type": "uint256"
      },
      {
        "components": [
          {
            "internalType": "bytes32[]",
            "name": "proof",
            "type": "bytes32[]"
          },
          {
            "internalType": "uint256",
            "name": "quantityLimitPerWallet",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "pricePerToken",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "currency",
            "type": "address"
          }
        ],
        "internalType": "struct IDrop.AllowlistProof",
        "name": "_allowlistProof",
        "type": "tuple"
      },
      {
        "internalType": "bytes",
        "name": "_data",
        "type": "bytes"
      }
    ],
    "name": "claim",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  }
];

// Simulate allowlist data
const allowlist = {
  "0xf041755c27200f347589a9c0cb0fa6e2d873049a": {
    proof: [],
    quantityLimitPerWallet: "0",
    pricePerToken: "0",
    currency: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
  },
};

function getAllowlistProof(walletAddress) {
  if (allowlist[walletAddress]) {
    return allowlist[walletAddress];
  } else {
    return {
      proof: [],
      quantityLimitPerWallet: "0",
      pricePerToken: "0",
      currency: "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee",
    };
  }
}
// Provider
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

// Initialize signer if PRIVATE_KEY is available
let signer;
try {
  if (!process.env.PRIVATE_KEY) {
    throw new Error('PRIVATE_KEY not found in environment variables');
  }
  signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
} catch (error) {
  console.error('Signer initialization error:', error.message);
  signer = provider; // Fallback to provider if signer fails
}

// Contract instance
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

app.post('/claim', async (req, res) => {
  try {
    const { signedTx } = req.body;
    
    if (!signedTx) {
      return res.status(400).json({ error: 'Signed transaction required' });
    }

    // Send the signed transaction
    const txResponse = await provider.sendTransaction(signedTx);
    const receipt = await txResponse.wait();

    res.json({
      transactionHash: txResponse.hash,
      status: receipt.status === 1 ? 'success' : 'failed',
      blockNumber: receipt.blockNumber
    });
  } catch (error) {
    console.error('Transaction error:', error);
    res.status(500).json({
      error: error.message,
      code: error.code
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});