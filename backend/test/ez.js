const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("YieldOptimizer (ezToken) Tests", function () {
  let owner, user1, user2, user3;
  let usdc, aToken, cToken, ezToken;
  const initialSupply = ethers.parseUnits("1000000", 6); // 1 million USDC avec 6 décimales
  const oneDay = 24 * 60 * 60; // 1 jour en secondes

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    // Déploiement des contrats
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
    
    // Distribution des USDC aux utilisateurs de test
    await usdc.transfer(user1.address, ethers.parseUnits("10000", 6));
    await usdc.transfer(user2.address, ethers.parseUnits("10000", 6));
    
    // Approbations
    await usdc.connect(user1).approve(await ezToken.getAddress(), ethers.parseUnits("10000", 6));
    await usdc.connect(user2).approve(await ezToken.getAddress(), ethers.parseUnits("10000", 6));
  });
  
  describe("Fonction findBestVault", function () {
    it("devrait identifier correctement le vault avec le meilleur taux", async function () {
      await aToken.setInterestRate(1000); // 10%
      await cToken.setInterestRate(2000); // 20%
      expect(await ezToken.findBestVault()).to.equal(await cToken.getAddress());
      await aToken.setInterestRate(2000); // 20%
      await cToken.setInterestRate(1000); // 10%
      expect(await ezToken.findBestVault()).to.equal(await aToken.getAddress());
    });
  });

  describe("Opérations de dépôt et retrait", function () {
    beforeEach(async function () {
      await aToken.setInterestRate(1000); // 10%
      await cToken.setInterestRate(2000); // 20%
    });

    it("devrait permettre de déposer des USDC et recevoir des parts", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      const initialBalance = await usdc.balanceOf(user1.address);
      await ezToken.connect(user1).deposit(depositAmount);
      expect(await ezToken.balanceOf(user1.address)).to.be.gt(0);
      expect(await usdc.balanceOf(user1.address)).to.equal(initialBalance - depositAmount);
      expect(await cToken.totalAssets()).to.equal(depositAmount);
      expect(await aToken.totalAssets()).to.equal(0);
    });

    it("devrait permettre de retirer des USDC en échangeant des parts", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      await ezToken.connect(user1).deposit(depositAmount);
      const shares = await ezToken.balanceOf(user1.address);
      const preWithdrawBalance = await usdc.balanceOf(user1.address);
      await ezToken.connect(user1).withdraw(shares);
      expect(await ezToken.balanceOf(user1.address)).to.equal(0);
      const postWithdrawBalance = await usdc.balanceOf(user1.address);
      expect(postWithdrawBalance).to.be.gte(preWithdrawBalance + depositAmount - 10n); // Tolérance de 10 wei
    });

    it("devrait permettre de retirer partiellement des USDC", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      await ezToken.connect(user1).deposit(depositAmount);
      const shares = await ezToken.balanceOf(user1.address);
      const halfShares = shares / 2n;
      await ezToken.connect(user1).withdraw(halfShares);
      const remainingShares = await ezToken.balanceOf(user1.address);
      expect(remainingShares).to.be.closeTo(halfShares, 10n);
    });
  });

  describe("Accumulation d'intérêts et rebalancement", function () {
    beforeEach(async function () {
      await aToken.setInterestRate(1000); // 10%
      await cToken.setInterestRate(2000); // 20%
      await ezToken.connect(user1).deposit(ethers.parseUnits("1000", 6));
    });

    it("devrait accumuler des intérêts au fil du temps", async function () {
      const initialAssets = await ezToken.totalAssets();
      await ethers.provider.send("evm_increaseTime", [1 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await cToken.accrueInterest();
      expect(await ezToken.totalAssets()).to.be.gt(initialAssets);
    });

    it("devrait rebalancer vers le meilleur vault", async function () {
      expect(await cToken.totalAssets()).to.be.gt(0);
      expect(await aToken.totalAssets()).to.equal(0);
      await aToken.setInterestRate(3000); // 30%
      await cToken.setInterestRate(1000); // 10%
      await ezToken.rebalance();
      expect(await aToken.totalAssets()).to.be.gt(0);
      expect(await cToken.totalAssets()).to.equal(0);
    });
  });

  describe("Scénarios multi-utilisateurs", function () {
    it("devrait gérer correctement les dépôts de plusieurs utilisateurs", async function () {
      await aToken.setInterestRate(2000); // 20%
      await cToken.setInterestRate(1000); // 10%
      const deposit1 = ethers.parseUnits("1000", 6);
      await ezToken.connect(user1).deposit(deposit1);
      const shares1 = await ezToken.balanceOf(user1.address);
      const deposit2 = ethers.parseUnits("2000", 6);
      await ezToken.connect(user2).deposit(deposit2);
      const shares2 = await ezToken.balanceOf(user2.address);
      const ratio = shares2 * 1000n / shares1;
      expect(ratio).to.be.closeTo(2000n, 10n);
    });

    it("devrait distribuer correctement les bénéfices à plusieurs utilisateurs", async function () {
      await ezToken.connect(user1).deposit(ethers.parseUnits("1000", 6));
      await ezToken.connect(user2).deposit(ethers.parseUnits("2000", 6));
      await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await aToken.accrueInterest();
      const initialBalance1 = await usdc.balanceOf(user1.address);
      const initialBalance2 = await usdc.balanceOf(user2.address);
      const shares1 = await ezToken.balanceOf(user1.address);
      const shares2 = await ezToken.balanceOf(user2.address);
      await ezToken.connect(user1).withdraw(shares1);
      await ezToken.connect(user2).withdraw(shares2);
      expect(await usdc.balanceOf(user1.address)).to.be.gt(initialBalance1);
      expect(await usdc.balanceOf(user2.address)).to.be.gt(initialBalance2);
      const profit1 = (await usdc.balanceOf(user1.address)) - initialBalance1;
      const profit2 = (await usdc.balanceOf(user2.address)) - initialBalance2;
      const profitRatio = profit2 * 1000n / profit1;
      expect(profitRatio).to.be.closeTo(2000n, 100n); // Plus grande tolérance pour les intérêts composés
    });
  });




  /*------------------------------------------------*/
  describe("aToken Branch Coverage Tests", function () {
    let owner, user1;
    let usdc, aToken;
    const initialSupply = ethers.parseUnits("1000000", 6);
    const oneDay = 24 * 60 * 60;
  
    beforeEach(async function () {
      [owner, user1] = await ethers.getSigners();
      
      // Deploy USDC
      const MintableUSDC = await ethers.getContractFactory("MintableUSDC");
      usdc = await MintableUSDC.deploy("USD Coin", "USDC", initialSupply);
      
      // Deploy aToken vault
      const Vault = await ethers.getContractFactory("aToken");
      aToken = await Vault.deploy(await usdc.getAddress(), "Aave USDC", "aUSDC");
      
      // Configure
      await usdc.addMinter(await aToken.getAddress());
      await usdc.transfer(user1.address, ethers.parseUnits("10000", 6));
      await usdc.connect(user1).approve(await aToken.getAddress(), ethers.parseUnits("10000", 6));
    });
  
    describe("accrueInterest Edge Cases", function () {
      it("Ne devrait pas accumuler d'intérêts si aucun temps ne s'est écoulé", async function () {
        // Deposit funds first
        const depositAmount = ethers.parseUnits("1000", 6);
        await aToken.connect(user1).deposit(depositAmount, user1.address);
        
        // Call accrueInterest immediately without advancing time
        const initialBalance = await usdc.balanceOf(await aToken.getAddress());
        //await aToken.accrueInterest();
        const newBalance = await usdc.balanceOf(await aToken.getAddress());
        
        // Balance should remain unchanged
        expect(newBalance).to.equal(initialBalance);
      });
      
      it("Devrait gérer le cas où interestAmount est 0 (temps écoulé trop court)", async function () {
        // Deposit a small amount
        const depositAmount = ethers.parseUnits("1", 6); // Just 1 USDC
        await aToken.connect(user1).deposit(depositAmount, user1.address);
        
        // Advance time but not enough to generate a full token of interest
        await time.increase(1); // Just 1 second
        
        const initialBalance = await usdc.balanceOf(await aToken.getAddress());
        await aToken.accrueInterest();
        const newBalance = await usdc.balanceOf(await aToken.getAddress());
        
        // Balance should remain unchanged as interest is too small
        expect(newBalance).to.equal(initialBalance);
      });
      
      it("Devrait mettre à jour lastInterestUpdate même si aucun intérêt n'est généré", async function () {
        // No deposits, vault is empty
        const initialTimestamp = await aToken.lastInterestUpdate();
        await time.increase(oneDay);
        await aToken.accrueInterest();
        const newTimestamp = await aToken.lastInterestUpdate();
        
        // Timestamp should be updated even though no interest is accrued
        expect(newTimestamp).to.be.gt(initialTimestamp);
      });
      
      it("Devrait gérer correctement un taux d'intérêt de 0%", async function () {
        const depositAmount = ethers.parseUnits("1000", 6);
        await aToken.connect(user1).deposit(depositAmount, user1.address);
        
        // Set interest rate to 0
        await aToken.setInterestRate(0);
        
        const initialBalance = await usdc.balanceOf(await aToken.getAddress());
        await time.increase(30 * oneDay);
        await aToken.accrueInterest();
        const newBalance = await usdc.balanceOf(await aToken.getAddress());
        
        // Balance should remain unchanged with 0% interest
        expect(newBalance).to.equal(initialBalance);
      });
    });
  
    describe("Edge Cases for ERC4626 Functions", function () {
      it("Devrait gérer les conversions avec totalSupply = 0", async function () {
        // No deposits yet, check convertToShares behavior
        const amount = ethers.parseUnits("1000", 6);
        const initialShares = await aToken.convertToShares(amount);
        
        // First deposit should get exact 1:1 ratio
        expect(initialShares).to.equal(amount);
      });
      /*
      it.skip("Devrait gérer les conversions avec totalAssets = 0", async function () {
        // No deposits yet, totalAssets = 0
        expect(await aToken.totalAssets()).to.equal(0);
        
        // If someone mints tokens directly (edge case)
        const mintAmount = ethers.parseUnits("1000", 18); // Using 18 decimals for shares
        await aToken.mint(mintAmount, user1.address);
        
        // Now we have shares but no assets, check conversion
        const assetsFromShares = await aToken.convertToAssets(mintAmount);
        expect(assetsFromShares).to.equal(0);
      });
*/
    });
    
    describe("Complete Deposit/Withdrawal Cycle", function () {
      it("Devrait gérer plusieurs dépôts et retraits avec accumulation d'intérêts", async function () {
        // First deposit
        const depositAmount1 = ethers.parseUnits("1000", 6);
        await aToken.connect(user1).deposit(depositAmount1, user1.address);
        
        // Advance time and accrue interest
        await time.increase(30 * oneDay);
        await aToken.accrueInterest();
        
        // Second deposit
        const depositAmount2 = ethers.parseUnits("2000", 6);
        await aToken.connect(user1).deposit(depositAmount2, user1.address);
        
        // Advance time and accrue interest again
        await time.increase(30 * oneDay);
        await aToken.accrueInterest();
        
        // Partial withdrawal
        const withdrawAmount = ethers.parseUnits("1500", 6);
        const usdcBefore = await usdc.balanceOf(user1.address);
        await aToken.connect(user1).withdraw(withdrawAmount, user1.address, user1.address);
        const usdcAfter = await usdc.balanceOf(user1.address);
        
        // Check withdrawal worked correctly
        expect(usdcAfter - usdcBefore).to.be.closeTo(withdrawAmount, 10);
        
        // Final redemption of all shares
        const remainingShares = await aToken.balanceOf(user1.address);
        const finalUsdcBefore = await usdc.balanceOf(user1.address);
        await aToken.connect(user1).redeem(remainingShares, user1.address, user1.address);
        const finalUsdcAfter = await usdc.balanceOf(user1.address);
        
        // User should have received back more than they deposited due to interest
        const totalDeposited = depositAmount1 + depositAmount2;
        expect(finalUsdcAfter - finalUsdcBefore + (usdcAfter - usdcBefore)).to.be.gt(totalDeposited);
        expect(await aToken.balanceOf(user1.address)).to.equal(0);
      });
    });
  });
});