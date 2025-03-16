const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("YieldOptimizingVault", function () {
  let usdc, aave, compound, vault;
  let owner, user1, user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.deployed();

    const MockAave = await ethers.getContractFactory("MockAave");
    aave = await MockAave.deploy();
    await aave.deployed();

    const MockCompound = await ethers.getContractFactory("MockCompound");
    compound = await MockCompound.deploy(usdc.address);
    await compound.deployed();

    const YieldOptimizingVault = await ethers.getContractFactory("YieldOptimizingVault");
    vault = await YieldOptimizingVault.deploy(usdc.address, aave.address, compound.address);
    await vault.deployed();

    // Mint some USDC to users
    await usdc.transfer(user1.address, ethers.utils.parseUnits("10000", 6));
    await usdc.transfer(user2.address, ethers.utils.parseUnits("10000", 6));

    // Approve vault to spend USDC
    await usdc.connect(user1).approve(vault.address, ethers.constants.MaxUint256);
    await usdc.connect(user2).approve(vault.address, ethers.constants.MaxUint256);

    console.log("USDC:", usdc.address);
    console.log("Aave:", aave.address);
    console.log("Compound:", compound.address);
    console.log("Vault:", vault.address);
  });

  it("Should deposit USDC and mint vault tokens", async function () {
    const depositAmount = ethers.utils.parseUnits("1000", 6);
    await vault.connect(user1).deposit(depositAmount, user1.address);

    expect(await vault.balanceOf(user1.address)).to.equal(depositAmount);
    expect(await vault.totalAssets()).to.equal(depositAmount);
  });

  it("Should withdraw USDC and burn vault tokens", async function () {
    const depositAmount = ethers.utils.parseUnits("1000", 6);
    await vault.connect(user1).deposit(depositAmount, user1.address);

    await vault.connect(user1).withdraw(depositAmount, user1.address, user1.address);

    expect(await vault.balanceOf(user1.address)).to.equal(0);
    expect(await vault.totalAssets()).to.equal(0);
  });

  it("Should rebalance to Aave when Aave rate is higher", async function () {
    await aave.setLiquidityRate(ethers.utils.parseUnits("0.06", 27)); // 6% APY
    await compound.setSupplyRate(ethers.utils.parseUnits("0.04", 18)); // 4% APY

    const depositAmount = ethers.utils.parseUnits("1000", 6);
    await vault.connect(user1).deposit(depositAmount, user1.address);

    await vault.manualRebalance();

    expect(await vault.currentStrategy()).to.equal(0); // 0 for Aave
    expect(await aave.deposits(vault.address)).to.equal(depositAmount);
  });

  it("Should rebalance to Compound when Compound rate is higher", async function () {
    await aave.setLiquidityRate(ethers.utils.parseUnits("0.04", 27)); // 4% APY
    await compound.setSupplyRate(ethers.utils.parseUnits("0.06", 18)); // 6% APY

    const depositAmount = ethers.utils.parseUnits("1000", 6);
    await vault.connect(user1).deposit(depositAmount, user1.address);

    await vault.manualRebalance();

    expect(await vault.currentStrategy()).to.equal(1); // 1 for Compound
    expect(await compound.balanceOf(vault.address)).to.be.gt(0);
  });

  it("Should correctly calculate total assets", async function () {
    const depositAmount = ethers.utils.parseUnits("1000", 6);
    await vault.connect(user1).deposit(depositAmount, user1.address);

    // Simulate yield in Compound
    await compound.setExchangeRate(ethers.utils.parseUnits("0.021", 18)); // 5% increase

    const totalAssets = await vault.totalAssets();
    expect(totalAssets).to.be.gt(depositAmount);
  });
});
