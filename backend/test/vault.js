const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("vToken Tests", function () {
  let owner, user1, user2;
  let usdc, aToken;
  const initialSupply = ethers.parseUnits("1000000", 18); // 1 million USDC
  const oneDay = 24 * 60 * 60; // 1 jour en secondes

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    const MintableUSDC = await ethers.getContractFactory("MintableUSDC");
    usdc = await MintableUSDC.deploy("USD Coin", "USDC", initialSupply);
    const AToken = await ethers.getContractFactory("aToken");
    aToken = await AToken.deploy(await usdc.getAddress(), "Aave USDC", "aUSDC");
    await usdc.addMinter(await aToken.getAddress());
    await usdc.transfer(user1.address, ethers.parseUnits("10000", 18));
    await usdc.connect(user1).approve(await aToken.getAddress(), ethers.parseUnits("10000", 18));
  });
  
  describe("Initialisation", function () {
    it("Devrait initialiser correctement le contrat", async function () {
      expect(await aToken.asset()).to.equal(await usdc.getAddress());
      expect(await aToken.name()).to.equal("Aave USDC");
      expect(await aToken.symbol()).to.equal("aUSDC");
      expect(await aToken.interestRate()).to.equal(1500); // 15.00%
      expect(await aToken.owner()).to.equal(owner.address);
    });
  });
  
  describe("Gestion du taux d'intérêt", function () {
    it("Permet au propriétaire de modifier le taux d'intérêt", async function () {
      await aToken.setInterestRate(2000); // 20.00%
      expect(await aToken.interestRate()).to.equal(2000);
    });

    it("Renvoie correctement le taux d'intérêt", async function () {
      await aToken.setInterestRate(1800);
      expect(await aToken.getInterestRate()).to.equal(1800);
    });
  });
  
  describe("Dépôts et Retraits", function () {
    it("Permet de déposer des actifs", async function () {
      const depositAmount = ethers.parseUnits("1000", 18);
      const balanceBefore = await usdc.balanceOf(user1.address);
      await aToken.connect(user1).deposit(depositAmount, user1.address);
      const balanceAfter = await usdc.balanceOf(user1.address);
      expect(balanceBefore - balanceAfter).to.equal(depositAmount);
      expect(await aToken.balanceOf(user1.address)).to.be.gt(0);
    });
    
    it("Permet de retirer des actifs", async function () {
      const depositAmount = ethers.parseUnits("1000", 18);
      await aToken.connect(user1).deposit(depositAmount, user1.address);
      const usdcBefore = await usdc.balanceOf(user1.address);
      await aToken.connect(user1).withdraw(depositAmount, user1.address, user1.address);
      const usdcAfter = await usdc.balanceOf(user1.address);
      expect(usdcAfter - usdcBefore).to.be.closeTo(depositAmount, 10);
    });
  });
  
  describe("Accumulation d'intérêts", function () {
    it("Accumule des intérêts correctement avec le temps", async function () {
      const depositAmount = ethers.parseUnits("10000", 18);
      await aToken.connect(user1).deposit(depositAmount, user1.address);
      const initialContractBalance = await usdc.balanceOf(await aToken.getAddress());
      const initialTimestamp = await aToken.lastInterestUpdate();
      await time.increase(30 * oneDay);
      await aToken.accrueInterest();
      const newContractBalance = await usdc.balanceOf(await aToken.getAddress());
      const newTimestamp = await aToken.lastInterestUpdate();
      expect(newContractBalance).to.be.gt(initialContractBalance);
      expect(newTimestamp).to.be.gt(initialTimestamp);
      const expectedInterest = depositAmount * BigInt(1500) * BigInt(30) / (BigInt(10000) * BigInt(365));
      const actualInterest = newContractBalance - initialContractBalance;
      expect(actualInterest).to.be.closeTo(expectedInterest, ethers.parseUnits("1", 18));
    });
    
    it("Ne génère pas d'intérêts si aucun actif n'est détenu", async function () {
      expect(await usdc.balanceOf(await aToken.getAddress())).to.equal(0);
      await time.increase(30 * oneDay);
      await aToken.accrueInterest();
      expect(await usdc.balanceOf(await aToken.getAddress())).to.equal(0);
    });
    
    it("Met à jour lastInterestUpdate même sans intérêts", async function () {
      const initialTimestamp = await aToken.lastInterestUpdate();
      await time.increase(oneDay);
      await aToken.accrueInterest();
      const newTimestamp = await aToken.lastInterestUpdate();
      expect(newTimestamp).to.be.gt(initialTimestamp);
    });
    
    it("Gère correctement un taux d'intérêt à zéro", async function () {
      const depositAmount = ethers.parseUnits("1000", 18);
      await aToken.connect(user1).deposit(depositAmount, user1.address);
      await aToken.setInterestRate(0);
      const initialContractBalance = await usdc.balanceOf(await aToken.getAddress());
      await time.increase(30 * oneDay);
      await aToken.accrueInterest();
      const newContractBalance = await usdc.balanceOf(await aToken.getAddress());
      expect(newContractBalance).to.equal(initialContractBalance);
    });
  });
  
  describe("Fonctionnalités ERC4626", function () {
    it("Convertit correctement les actifs en parts", async function () {
      const depositAmount = ethers.parseUnits("1000", 18);
      await aToken.connect(user1).deposit(depositAmount, user1.address);
      const shares = await aToken.balanceOf(user1.address);
      const assetsFromShares = await aToken.convertToAssets(shares);
      expect(assetsFromShares).to.be.closeTo(depositAmount, 10);
    });
    
    it("Prévisualise correctement les dépôts et retraits", async function () {
      const depositAmount = ethers.parseUnits("1000", 18);
      const previewShares = await aToken.previewDeposit(depositAmount);
      await aToken.connect(user1).deposit(depositAmount, user1.address);
      const actualShares = await aToken.balanceOf(user1.address);
      expect(actualShares).to.be.closeTo(previewShares, 10);
    });
  });
});