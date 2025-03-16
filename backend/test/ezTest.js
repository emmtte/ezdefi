const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("EZdefi Contract Tests", function () {
  let USDC, usdc;
  let AToken, aToken;
  let CToken, cToken;
  let EZdefi, ezdefi;
  let owner, user1, user2;
  const initialSupply = ethers.parseUnits("1000000", 6); // 1 million USDC with 6 decimals
  const TWELVE_HOURS = 12 * 60 * 60; // 12 hours in seconds

  beforeEach(async function () {
    // Get signers
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy USDC token
    USDC = await ethers.getContractFactory("MintableUSDC");
    usdc = await USDC.deploy("USD Coin", "USDC", initialSupply);

    // Deploy aToken (AAVE-like token)
    AToken = await ethers.getContractFactory("aToken");
    aToken = await AToken.deploy(await usdc.getAddress(), "Aave USDC", "aUSDC");

    // Deploy cToken (Compound-like token)
    CToken = await ethers.getContractFactory("aToken"); // Using the same implementation for simplicity
    cToken = await CToken.deploy(await usdc.getAddress(), "Compound USDC", "cUSDC");

    // Deploy EZdefi contract
    EZdefi = await ethers.getContractFactory("EZdefi");
    ezdefi = await EZdefi.deploy(
      await usdc.getAddress(),
      await aToken.getAddress(),
      await cToken.getAddress()
    );

    // Set different interest rates for testing
    await aToken.setInterestRate(1000); // 10.00%
    await cToken.setInterestRate(800);  // 8.00%

    // Approve and transfer some USDC to users
    await usdc.transfer(user1.address, ethers.parseUnits("10000", 6));
    await usdc.transfer(user2.address, ethers.parseUnits("10000", 6));
    
    // Approve EZdefi contract to spend USDC from users
    await usdc.connect(user1).approve(ezdefi.getAddress(), ethers.parseUnits("10000", 6));
    await usdc.connect(user2).approve(ezdefi.getAddress(), ethers.parseUnits("10000", 6));
    
    // Approve aToken and cToken to mint USDC
    await usdc.approve(aToken.getAddress(), ethers.parseUnits("100000", 6));
    await usdc.approve(cToken.getAddress(), ethers.parseUnits("100000", 6));
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await ezdefi.owner()).to.equal(owner.address);
    });

    it("Should set the correct asset references", async function () {
      expect(await ezdefi.usdc()).to.equal(await usdc.getAddress());
      expect(await ezdefi.aToken()).to.equal(await aToken.getAddress());
      expect(await ezdefi.cToken()).to.equal(await cToken.getAddress());
    });
  });

  describe("Protocol Selection", function () {
    it("Should correctly identify the best protocol", async function () {
      // aToken has higher rate (10% vs 8%)
      expect(await ezdefi.getBestProtocol()).to.equal(await aToken.getAddress());
      
      // Switch rates and check again
      await aToken.setInterestRate(500); // 5.00%
      await cToken.setInterestRate(700); // 7.00%
      
      expect(await ezdefi.getBestProtocol()).to.equal(await cToken.getAddress());
    });
  });

  describe("Fund Allocation", function () {
    it("Should allocate funds to a protocol", async function () {
      const amount = ethers.parseUnits("1000", 6);
      
      // Transfer USDC to the EZdefi contract
      await usdc.transfer(ezdefi.getAddress(), amount);
      
      // Allocate funds to aToken
      await ezdefi.allocateFunds(await aToken.getAddress(), amount);
      
      // Check that funds were transferred
      expect(await aToken.balanceOf(ezdefi.getAddress())).to.be.gt(0);
      expect(await ezdefi.currentProtocol()).to.equal(await aToken.getAddress());
    });

    it("Should fail if invalid protocol is provided", async function () {
      const amount = ethers.parseUnits("1000", 6);
      
      // Transfer USDC to the EZdefi contract
      await usdc.transfer(ezdefi.getAddress(), amount);
      
      // Try to allocate funds to an invalid address
      await expect(
        ezdefi.allocateFunds(user1.address, amount)
      ).to.be.revertedWith("Invalid protocol");
    });
  });

  describe("Rebalancing", function () {
    it("Should rebalance to the better protocol", async function () {
      const amount = ethers.parseUnits("1000", 6);
      
      // Transfer USDC to the EZdefi contract
      await usdc.transfer(ezdefi.getAddress(), amount);
      
      // Initially allocate to aToken (10% rate)
      await ezdefi.allocateFunds(await aToken.getAddress(), amount);
      
      // Change rates to make cToken better
      await aToken.setInterestRate(500); // 5.00%
      await cToken.setInterestRate(700); // 7.00%
      
      // Move time forward 12 hours
      await time.increase(TWELVE_HOURS);
      
      // Trigger rebalance
      await expect(ezdefi.rebalance())
        .to.emit(ezdefi, "Rebalanced")
        .withArgs(await cToken.getAddress());
      
      // Check that protocol was changed
      expect(await ezdefi.currentProtocol()).to.equal(await cToken.getAddress());
    });

    it("Should not rebalance if rates haven't changed enough", async function () {
      const amount = ethers.parseUnits("1000", 6);
      
      // Transfer USDC to the EZdefi contract
      await usdc.transfer(ezdefi.getAddress(), amount);
      
      // Initially allocate to aToken (10% rate)
      await ezdefi.allocateFunds(await aToken.getAddress(), amount);
      
      // Move time forward 12 hours
      await time.increase(TWELVE_HOURS);
      
      // Trigger rebalance (should not change protocol as aToken is still better)
      await ezdefi.rebalance();
      
      // Check that protocol did not change
      expect(await ezdefi.currentProtocol()).to.equal(await aToken.getAddress());
    });

    it("Should not allow rebalancing before timelock expires", async function () {
      // Move time forward 11 hours
      await time.increase(TWELVE_HOURS - 3600);
      
      // Should revert with too soon message
      await expect(ezdefi.rebalance()).to.be.revertedWith("Rebalance too soon");
    });
  });

  describe("ERC4626 Vault Functionality", function () {
    it("Should correctly deposit and mint shares", async function () {
      const depositAmount = ethers.parseUnits("100", 6);
      
      // User1 deposits USDC
      await ezdefi.connect(user1).deposit(depositAmount, user1.address);
      
      // Check user1 received shares
      expect(await ezdefi.balanceOf(user1.address)).to.be.gt(0);
      
      // Check funds are allocated to the best protocol (aToken in this case)
      expect(await ezdefi.currentProtocol()).to.equal(await aToken.getAddress());
    });

    it("Should correctly withdraw assets", async function () {
      const depositAmount = ethers.parseUnits("100", 6);
      
      // User1 deposits USDC
      await ezdefi.connect(user1).deposit(depositAmount, user1.address);
      
      // Get user1's share balance
      const shareBalance = await ezdefi.balanceOf(user1.address);
      
      // Initial USDC balance
      const initialUsdcBalance = await usdc.balanceOf(user1.address);
      
      // User1 redeems all shares
      await ezdefi.connect(user1).redeem(shareBalance, user1.address, user1.address);
      
      // Check user1 received USDC back
      const newUsdcBalance = await usdc.balanceOf(user1.address);
      expect(newUsdcBalance).to.be.gt(initialUsdcBalance);
    });

    it("Should accrue interest through protocol deposit", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      
      // User1 deposits USDC
      await ezdefi.connect(user1).deposit(depositAmount, user1.address);
      
      // Move time forward 30 days to accrue interest
      await time.increase(30 * 24 * 60 * 60);
      
      // Force interest accrual
      await aToken.accrueInterest();
      
      // Get user1's share balance
      const shareBalance = await ezdefi.balanceOf(user1.address);
      
      // Check total assets increased due to interest
      const totalAssets = await ezdefi.totalAssets();
      expect(totalAssets).to.be.gt(depositAmount);
      
      // User1 redeems all shares
      await ezdefi.connect(user1).redeem(shareBalance, user1.address, user1.address);
      
      // Check user1 received more USDC than deposited due to interest
      const finalUsdcBalance = await usdc.balanceOf(user1.address);
      expect(finalUsdcBalance).to.be.gt(ethers.parseUnits("10000", 6));
    });
  });

  describe("Multiple User Scenario", function () {
    it("Should handle deposits and withdrawals from multiple users", async function () {
      // User1 and User2 deposit different amounts
      await ezdefi.connect(user1).deposit(ethers.parseUnits("500", 6), user1.address);
      await ezdefi.connect(user2).deposit(ethers.parseUnits("1000", 6), user2.address);
      
      // Move time forward to accrue interest
      await time.increase(30 * 24 * 60 * 60);
      
      // Force interest accrual
      await aToken.accrueInterest();
      
      // Get share balances
      const user1Shares = await ezdefi.balanceOf(user1.address);
      const user2Shares = await ezdefi.balanceOf(user2.address);
      
      // User1 withdraws half, User2 withdraws all
      await ezdefi.connect(user1).redeem(user1Shares.div(2), user1.address, user1.address);
      await ezdefi.connect(user2).redeem(user2Shares, user2.address, user2.address);
      
      // Check both users received more than they put in due to interest
      expect(await usdc.balanceOf(user1.address)).to.be.gt(ethers.parseUnits("9750", 6)); // > 10000 - 500/2
      expect(await usdc.balanceOf(user2.address)).to.be.gt(ethers.parseUnits("10000", 6)); // > 10000
    });
  });

  describe("Edge Cases", function () {
    it("Should handle a protocol with zero balance", async function () {
      // Set initial protocol
      const amount = ethers.parseUnits("100", 6);
      await usdc.transfer(ezdefi.getAddress(), amount);
      await ezdefi.allocateFunds(await aToken.getAddress(), amount);
      
      // Retrieve all funds
      await ezdefi.connect(owner)._withdraw(owner.address, owner.address, owner.address, amount, amount);
      
      // Move time forward for rebalance
      await time.increase(TWELVE_HOURS);
      
      // Rebalance should not fail even with zero balance
      await ezdefi.rebalance();
    });

    it("Should handle interest rate changes", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      
      // User1 deposits USDC
      await ezdefi.connect(user1).deposit(depositAmount, user1.address);
      
      // Initial allocation to aToken (10%)
      expect(await ezdefi.currentProtocol()).to.equal(await aToken.getAddress());
      
      // Change rates dramatically
      await aToken.setInterestRate(200); // 2%
      await cToken.setInterestRate(1500); // 15%
      
      // Move time forward 12 hours
      await time.increase(TWELVE_HOURS);
      
      // Rebalance
      await ezdefi.rebalance();
      
      // Protocol should have changed to cToken
      expect(await ezdefi.currentProtocol()).to.equal(await cToken.getAddress());
    });
  });
});