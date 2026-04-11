import hre from "hardhat";

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("--------------------------------------------------");
  console.log("Deploying EtherVault contract...");
  console.log("Deployer address:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Deployer balance:", hre.ethers.formatEther(balance), "POL");

  const EtherVault = await hre.ethers.getContractFactory("EtherVault");
  const etherVault = await EtherVault.deploy();

  await etherVault.waitForDeployment();

  const contractAddress = await etherVault.getAddress();
  console.log("EtherVault deployed to:", contractAddress);
  console.log("--------------------------------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
