const hre = require("hardhat");

async function main() {
  console.log("Deploying CertificateVerification contract...\n");

  const Factory = await hre.ethers.getContractFactory("CertificateVerification");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log("CertificateVerification deployed to:", address);

  // Optionally add the deployer as the first issuer
  const [deployer] = await hre.ethers.getSigners();
  await contract.addIssuer(deployer.address);
  console.log("Deployer added as issuer:", deployer.address);

  console.log("\n--- Save this address in your frontend .env ---");
  console.log(`NEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
