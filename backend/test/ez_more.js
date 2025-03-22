const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("YieldOptimizer Branch Coverage Tests", function () {
  let owner, user1, user2, user3;
  let usdc, aToken, cToken, ezToken;
  const initialSupply = ethers.parseUnits("1000000", 6); // 1 million USDC with 6 decimals
  const oneDay = 24 * 60 * 60; // 1 day in seconds

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    // Deploy contracts
    const MintableUSDC = await ethers.getContractFactory("MintableUSDC");
    usdc = await MintableUSDC.deploy("USD Coin", "USDC", initialSupply);
    
    const Vault = await ethers.getContractFactory("aToken");
    aToken = await Vault.deploy(await usdc.getAddress(), "Aave USDC", "aUSDC");
    cToken = await Vault.deploy(await usdc.getAddress(), "Compound USDC", "cUSDC");
    
    const YieldOptimizer = await ethers.getContractFactory("YieldOptimizer");
    ezToken = await YieldOptimizer.deploy(await usdc.getAddress(), [await aToken.getAddress(), await cToken.getAddress()]);
    
    // Configuration
    await usdc.addMinter(await ezToken.getAddress());
    await usdc.addMinter(await aToken.getAddress());
    await usdc.addMinter(await cToken.getAddress());
    
    // Distribute USDC to test users
    await usdc.transfer(user1.address, ethers.parseUnits("10000", 6));
    await usdc.transfer(user2.address, ethers.parseUnits("10000", 6));
    
    // Approvals
    await usdc.connect(user1).approve(await ezToken.getAddress(), ethers.parseUnits("10000", 6));
    await usdc.connect(user2).approve(await ezToken.getAddress(), ethers.parseUnits("10000", 6));
  });

  // Test edge cases for deposit function
  describe("Deposit Function Branch Coverage", function () {
    it("should revert when trying to deposit 0 amount", async function () {
      await expect(ezToken.connect(user1).deposit(0)).to.be.revertedWith("Amount must be greater than 0");
    });

    it("should handle first deposit correctly (totalSupply == 0 branch)", async function () {
      expect(await ezToken.totalSupply()).to.equal(0);
      const depositAmount = ethers.parseUnits("1000", 6);
      await ezToken.connect(user1).deposit(depositAmount);
      // Verify shares calculation formula for first deposit
      // shares = amount * 1e18 / 1e6
      const expectedShares = depositAmount * BigInt(1e18) / BigInt(1e6);
      expect(await ezToken.balanceOf(user1.address)).to.be.closeTo(expectedShares, 100n);
    });

    it("should handle subsequent deposits correctly (totalSupply > 0 branch)", async function () {
      // First deposit
      await ezToken.connect(user1).deposit(ethers.parseUnits("1000", 6));
      // Second deposit
      const depositAmount = ethers.parseUnits("1000", 6);
      await ezToken.connect(user2).deposit(depositAmount);
      expect(await ezToken.balanceOf(user2.address)).to.be.gt(0);
    });
  });

  // Test edge cases for withdraw function
  describe("Withdraw Function Branch Coverage", function () {
    it("should revert when trying to withdraw 0 shares", async function () {
      await expect(ezToken.connect(user1).withdraw(0)).to.be.revertedWith("Shares must be greater than 0");
    });

    it("should revert when trying to withdraw more shares than owned", async function () {
      await ezToken.connect(user1).deposit(ethers.parseUnits("1000", 6));
      const shares = await ezToken.balanceOf(user1.address);
      await expect(ezToken.connect(user1).withdraw(shares + 1n)).to.be.revertedWith("Insufficient shares");
    });

    it("should handle withdrawal when contract has enough USDC balance", async function () {
      // First deposit to set up
      const depositAmount = ethers.parseUnits("1000", 6);
      await ezToken.connect(user1).deposit(depositAmount);
      
      // Manually transfer some USDC directly to the contract to create the scenario
      await usdc.transfer(await ezToken.getAddress(), ethers.parseUnits("500", 6));
      
      // Now withdraw - should use the direct balance first
      const shares = await ezToken.balanceOf(user1.address);
      const halfShares = shares / 2n;
      await ezToken.connect(user1).withdraw(halfShares);
    });

    it("should handle withdrawal when contract needs to withdraw from vault", async function () {
      // First deposit to set up
      const depositAmount = ethers.parseUnits("1000", 6);
      await ezToken.connect(user1).deposit(depositAmount);
      
      // Withdraw all shares - should need to withdraw from vault
      const shares = await ezToken.balanceOf(user1.address);
      await ezToken.connect(user1).withdraw(shares);
      
      // Verify that the user received back their USDC
      const balance = await usdc.balanceOf(user1.address);
      expect(balance).to.be.gte(ethers.parseUnits("9900", 6)); // At least 9900 USDC returned (allowing for small precision loss)
    });
  });

  // Test totalAssets function branches
  describe("TotalAssets Function Branch Coverage", function () {
    it("should handle case when currentVault is not set", async function () {
      const ezToken2 = await (await ethers.getContractFactory("YieldOptimizer")).deploy(
        await usdc.getAddress(), 
        [await aToken.getAddress(), await cToken.getAddress()]
      );
      
      // At this point, no deposits have been made, so currentVault should be address(0)
      expect(await ezToken2.currentVault()).to.equal(ethers.ZeroAddress);
      
      // TotalAssets should just return contract's USDC balance
      const amount = ethers.parseUnits("100", 6);
      await usdc.transfer(await ezToken2.getAddress(), amount);
      expect(await ezToken2.totalAssets()).to.equal(amount);
    });

    it("should handle case when vault has no shares", async function () {
      // Set up the vault but don't deposit
      await aToken.setInterestRate(1000);
      await cToken.setInterestRate(2000);
      
      // Force current vault through constructor but don't deposit
      const ezToken2 = await (await ethers.getContractFactory("YieldOptimizer")).deploy(
        await usdc.getAddress(), 
        [await aToken.getAddress(), await cToken.getAddress()]
      );
      
      // Make a deposit first to set currentVault
      await usdc.approve(await ezToken2.getAddress(), ethers.parseUnits("100", 6));
      await ezToken2.deposit(ethers.parseUnits("100", 6));
      
      // Withdraw all funds including from vault
      await ezToken2.rebalance(); // Ensure we've deposited to vault
      
      // Get shares and withdraw everything
      const shares = await ezToken2.balanceOf(owner.address);
      await ezToken2.withdraw(shares);
      
      // Now the vault should have no shares but still be set as currentVault
      expect(await ezToken2.currentVault()).to.not.equal(ethers.ZeroAddress);
      
      // Transfer some USDC directly to the contract
      await usdc.transfer(await ezToken2.getAddress(), ethers.parseUnits("50", 6));
      
      // Total assets should just report the direct balance
      expect(await ezToken2.totalAssets()).to.equal(ethers.parseUnits("50", 6));
    });
  });

  // Test rebalance function branches
  describe("Rebalance Function Branch Coverage", function () {
    it("should revert when rebalance is called before cooldown period", async function () {
      await ezToken.rebalance(); // First rebalance
      await expect(ezToken.rebalance()).to.be.revertedWith("Rebalance cooldown");
    });

    it("should not change vaults when current vault is already best", async function () {
      // Set up
      await aToken.setInterestRate(1000);
      await cToken.setInterestRate(2000);
      const depositAmount = ethers.parseUnits("1000", 6);
      await ezToken.connect(user1).deposit(depositAmount);
      
      // Advance time for cooldown
      await time.increase(12 * 60 * 60 + 1);
      
      // Current vault should already be the best (cToken)
      const currentVault = await ezToken.currentVault();
      expect(currentVault).to.equal(await cToken.getAddress());
      
      // Call rebalance - should not emit Rebalanced event since no change
      await expect(ezToken.rebalance()).to.not.emit(ezToken, "Rebalanced");
      
      // Vault should still be the same
      expect(await ezToken.currentVault()).to.equal(currentVault);
    });
  });

  // Test removeVault function
  describe("Vault Management Function Coverage", function () {
    it("should correctly handle _removeFromArray when element exists", async function () {
      // Initial state should have both vaults
      expect(await ezToken.allowedVaults(0)).to.equal(await aToken.getAddress());
      expect(await ezToken.allowedVaults(1)).to.equal(await cToken.getAddress());
      
      // Remove aToken
      await ezToken.removeVault(await aToken.getAddress());
      
      // Should now only have cToken
      expect(await ezToken.allowedVaults(0)).to.equal(await cToken.getAddress());
      
      // Length should be 1
      await expect(ezToken.allowedVaults(1)).to.be.reverted;
    });

    it("should correctly handle case when no vault has better rate", async function () {
      // Deploy a YieldOptimizer with a single vault
      const singleVaultOptimizer = await (await ethers.getContractFactory("YieldOptimizer")).deploy(
        await usdc.getAddress(), 
        [await aToken.getAddress()]
      );
      
      // Set rate to 0
      await aToken.setInterestRate(0);
      
      // Should still find the one vault even with 0 rate
      const best = await singleVaultOptimizer.findBestVault();
      expect(best).to.equal(await aToken.getAddress());
      
      // Now remove the only vault
      await singleVaultOptimizer.removeVault(await aToken.getAddress());
      
      // findBestVault should revert with "No vaults available"
      await expect(singleVaultOptimizer.findBestVault()).to.be.revertedWith("No vaults available");
    });
  });
});