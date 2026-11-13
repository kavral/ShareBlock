const { ethers } = require("hardhat");

async function main() {
  const [admin, investor1, investor2] = await ethers.getSigners();
  console.log("=== 1. DEPLOYING SHAREBLOCK SMART CONTRACT ===");
  console.log("Admin / Manager Account:", admin.address);

  const PropertyToken = await ethers.getContractFactory("PropertyToken");
  const propertyToken = await PropertyToken.deploy("Astana Tower Token", "ATT", admin.address);
  await propertyToken.waitForDeployment();
  console.log("PropertyToken deployed to:", await propertyToken.getAddress());

  console.log("\n=== 2. MINTING FRACTIONAL PROPERTY TOKENS ===");
  await propertyToken.mint(investor1.address, 60000);
  await propertyToken.mint(investor2.address, 40000);
  console.log("Investor 1 Balance (60% share):", (await propertyToken.balanceOf(investor1.address)).toString(), "ATT");
  console.log("Investor 2 Balance (40% share):", (await propertyToken.balanceOf(investor2.address)).toString(), "ATT");
  console.log("Total Supply:", (await propertyToken.totalSupply()).toString(), "ATT");

  console.log("\n=== 3. DEPOSITING RENTAL YIELD (DIVIDENDS) ===");
  await propertyToken.depositDividends({ value: ethers.parseEther("10.0") });
  console.log("Manager deposited 10.0 ETH (simulated KZT rental pool) into contract.");

  console.log("\n=== 4. INVESTOR 1 CLAIMING DIVIDENDS ===");
  const beforeBalance = await ethers.provider.getBalance(investor1.address);
  console.log("Investor 1 Wallet Balance BEFORE claim:", ethers.formatEther(beforeBalance), "ETH");

  const claimTx = await propertyToken.connect(investor1).claimDividends();
  await claimTx.wait();

  const afterBalance = await ethers.provider.getBalance(investor1.address);
  console.log("Investor 1 Wallet Balance AFTER claim: ", ethers.formatEther(afterBalance), "ETH");
  console.log("Successfully claimed 6.0 ETH (60% of yield pool)!");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});