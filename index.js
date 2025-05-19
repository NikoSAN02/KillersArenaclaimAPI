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
// Provider and signer
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL);

// Contract instance
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

app.post('/claim', async (req, res) => {
  try {
     const { signature, walletAddress, quantity, currency, pricePerToken, data } = req.body;
 
     // Verify the signature
     // Verify the signature
     let recoveredAddress;
     try {
       const message = JSON.stringify({
         action: "claim",
         walletAddress: walletAddress,
         quantity: quantity,
         contractAddress: CONTRACT_ADDRESS
       });
       console.log("Verification Message:", message);
       console.log("Signature:", signature);
       console.log("Expected Address:", walletAddress);
       recoveredAddress = ethers.utils.verifyMessage(message, signature);
       console.log("Recovered address:", recoveredAddress);
     } catch (error) {
       console.error("Invalid signature format:", error);
       return res.status(400).json({ error: 'Invalid signature format' });
     }
 
     if (recoveredAddress.toLowerCase() !== walletAddress.toLowerCase()) {
       return res.status(400).json({ error: 'Invalid signature' });
     }
 
     // Simulate fetching allowlist proof
     const allowlistProof = getAllowlistProof(walletAddress);
 
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