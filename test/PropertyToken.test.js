const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ShareBlock PropertyToken & Dividends", function () {
  let PropertyToken, propertyToken, owner, investor1, investor2, nonAdmin;

  beforeEach(async function () {
    [owner, investor1, investor2, nonAdmin] = await ethers.getSigners();
    PropertyToken = await ethers.getContractFactory("PropertyToken");
    propertyToken = await PropertyToken.deploy("Astana Tower Token", "ATT", owner.address);
    await propertyToken.waitForDeployment();
  });

  it("1. Should deploy with correct name, symbol and assign admin role", async function () {
    expect(await propertyToken.name()).to.equal("Astana Tower Token");
    expect(await propertyToken.symbol()).to.equal("ATT");
    const adminRole = await propertyToken.DEFAULT_ADMIN_ROLE();
    expect(await propertyToken.hasRole(adminRole, owner.address)).to.be.true;
  });

  it("2. Should allow manager to mint fractional tokens to investors", async function () {
    await propertyToken.mint(investor1.address, 1000);
    expect(await propertyToken.balanceOf(investor1.address)).to.equal(1000);
    expect(await propertyToken.totalSupply()).to.equal(1000);
  });

  it("3. Should prevent non-managers from minting tokens", async function () {
    await expect(
      propertyToken.connect(nonAdmin).mint(investor1.address, 500)
    ).to.be.reverted;
  });

  it("4. Should accept dividend deposits from manager", async function () {
    await propertyToken.mint(investor1.address, 1000);
    
    await expect(
      propertyToken.depositDividends({ value: ethers.parseEther("1.0") })
    ).to.emit(propertyToken, "DividendsDeposited");
  });

  it("5. Should allow token holders to claim proportional rental yields", async function () {
    await propertyToken.mint(investor1.address, 1000);
    await propertyToken.mint(investor2.address, 1000);

    await propertyToken.depositDividends({ value: ethers.parseEther("2.0") });

    const initialBalance = await ethers.provider.getBalance(investor1.address);
    
    const tx = await propertyToken.connect(investor1).claimDividends();
    await tx.wait();
    
    const finalBalance = await ethers.provider.getBalance(investor1.address);
    expect(finalBalance).to.be.greaterThan(initialBalance);
  });
});