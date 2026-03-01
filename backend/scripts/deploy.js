const hre = require("hardhat");

async function main() {
  const EtherVault = await hre.ethers.getContractFactory("EtherVault");

  const contract = await EtherVault.deploy();

  await contract.waitForDeployment();

  console.log("🚀 EtherVault deployed to:", contract.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});