const express = require('express');
const ethers = require('ethers');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
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

// Provider and signer
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

// Contract instance
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

app.post('/claim', async (req, res) => {
  try {
    const { signature, walletAddress, quantity, currency, pricePerToken, allowlistProof, data } = req.body;

    // Verify the signature
    const messageHash = ethers.utils.keccak256(ethers.utils.toUtf8Bytes("Claim message")); // Replace with the actual message used for signing
    const recoveredAddress = ethers.utils.verifyMessage(ethers.utils.arrayify(messageHash), signature);

    if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
      return res.status(400).json({ error: 'Invalid signature' });
    }

    // Call the claim function
    const tx = await contract.claim(
      walletAddress,
      quantity,
      currency,
      pricePerToken,
      allowlistProof,
      data,
      {
        value: ethers.BigNumber.from(pricePerToken).mul(ethers.BigNumber.from(quantity)),
      }
    );
    await tx.wait();

    res.json({ transactionHash: tx.hash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});