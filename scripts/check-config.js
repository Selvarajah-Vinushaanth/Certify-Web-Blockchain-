require("dotenv").config();
const { ethers } = require("ethers");

async function check() {
  console.log("=== Pre-deployment Check ===\n");

  // 1. Check env vars
  const rpcUrl = process.env.SEPOLIA_RPC_URL;
  const privKey = process.env.PRIVATE_KEY;

  if (!rpcUrl || rpcUrl.includes("YOUR_INFURA_KEY")) {
    console.error("❌ SEPOLIA_RPC_URL is not set or still has placeholder");
    process.exit(1);
  }
  console.log("✅ SEPOLIA_RPC_URL is set");

  if (!privKey || privKey === "your_wallet_private_key_here") {
    console.error("❌ PRIVATE_KEY is not set or still has placeholder");
    process.exit(1);
  }
  console.log("✅ PRIVATE_KEY is set");

  // 2. Test RPC connection
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    console.log(`✅ Connected to network: ${network.name} (chainId: ${network.chainId})`);
  } catch (e) {
    console.error("❌ Cannot connect to Sepolia RPC:", e.message);
    process.exit(1);
  }

  // 3. Check wallet balance
  try {
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const wallet = new ethers.Wallet(privKey, provider);
    const balance = await provider.getBalance(wallet.address);
    const balEth = ethers.formatEther(balance);
    console.log(`✅ Wallet address: ${wallet.address}`);
    console.log(`✅ Sepolia ETH balance: ${balEth} ETH`);

    if (balance === 0n) {
      console.warn("⚠️  Balance is 0 — you need Sepolia ETH to deploy. Use a faucet!");
    } else {
      console.log("\n🚀 Everything looks good! Ready to deploy.");
    }
  } catch (e) {
    console.error("❌ Wallet error:", e.message);
    process.exit(1);
  }
}

check();
