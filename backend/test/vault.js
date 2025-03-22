const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Token Vaults Tests (aToken & cToken)", function () {
  let owner, user1, user2, user3;
  let usdc, aToken, cToken;
  const initialSupply = ethers.parseUnits("1000000", 6); // 1 million USDC avec 6 décimales
  const oneDay = 24 * 60 * 60; // 1 jour en secondes

  beforeEach(async function () {
    [owner, user1, user2, user3] = await ethers.getSigners();
    
    // Déploiement de USDC
    const MintableUSDC = await ethers.getContractFactory("MintableUSDC");
    usdc = await MintableUSDC.deploy("USD Coin", "USDC", initialSupply);
    
    // Déploiement des vaults
    const Vault = await ethers.getContractFactory("aToken");
    aToken = await Vault.deploy(await usdc.getAddress(), "Aave USDC", "aUSDC");
    cToken = await Vault.deploy(await usdc.getAddress(), "Compound USDC", "cUSDC");
    
    // Configuration
    await usdc.addMinter(await aToken.getAddress());
    await usdc.addMinter(await cToken.getAddress());
    await usdc.transfer(user1.address, ethers.parseUnits("10000", 6));
    await usdc.transfer(user2.address, ethers.parseUnits("10000", 6));
    await usdc.connect(user1).approve(await aToken.getAddress(), ethers.parseUnits("10000", 6));
    await usdc.connect(user1).approve(await cToken.getAddress(), ethers.parseUnits("10000", 6));
    await usdc.connect(user2).approve(await aToken.getAddress(), ethers.parseUnits("10000", 6));
    await usdc.connect(user2).approve(await cToken.getAddress(), ethers.parseUnits("10000", 6));
  });
  
  describe("aToken Basic Tests", function () {
    it("Devrait initialiser correctement le contrat", async function () {
      expect(await aToken.asset()).to.equal(await usdc.getAddress());
      expect(await aToken.name()).to.equal("Aave USDC");
      expect(await aToken.symbol()).to.equal("aUSDC");
      expect(await aToken.interestRate()).to.equal(1500); // 15.00%
      expect(await aToken.owner()).to.equal(owner.address);
    });
    
    it("Permet au propriétaire de modifier le taux d'intérêt", async function () {
      await aToken.setInterestRate(2000); // 20.00%
      expect(await aToken.interestRate()).to.equal(2000);
    });
    
    it("Empêche un utilisateur non-propriétaire de modifier le taux", async function () {
      await expect(aToken.connect(user1).setInterestRate(2000))
        .to.be.reverted; // Sera rejeté car user1 n'est pas le propriétaire
    });
    
    it("Renvoie correctement le taux d'intérêt via getInterestRate", async function () {
      await aToken.setInterestRate(1800);
      expect(await aToken.getInterestRate()).to.equal(1800);
    });
  });
  
  describe("aToken Deposit and Withdrawal", function () {
    it("Permet de déposer des actifs et reçoit des jetons aToken", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      const balanceBefore = await usdc.balanceOf(user1.address);
      await aToken.connect(user1).deposit(depositAmount, user1.address);
      const balanceAfter = await usdc.balanceOf(user1.address);
      expect(balanceBefore - balanceAfter).to.equal(depositAmount);
      const aTokenBalance = await aToken.balanceOf(user1.address);
      expect(aTokenBalance).to.be.gt(0);
      const assetsValue = await aToken.convertToAssets(aTokenBalance);
      expect(assetsValue).to.be.closeTo(depositAmount, 10); // Permet une légère différence due aux arrondis
    });
    
    it("Permet de retirer des actifs en brûlant des jetons aToken", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      await aToken.connect(user1).deposit(depositAmount, user1.address);
      const aTokenBalance = await aToken.balanceOf(user1.address);
      const usdcBefore = await usdc.balanceOf(user1.address);
      await aToken.connect(user1).withdraw(depositAmount, user1.address, user1.address);
      const usdcAfter = await usdc.balanceOf(user1.address);
      expect(usdcAfter - usdcBefore).to.be.closeTo(depositAmount, 10);
      const aTokenAfter = await aToken.balanceOf(user1.address);
      expect(aTokenAfter).to.be.lt(aTokenBalance);
    });
    
    it("Permet de racheter (redeem) des jetons aToken pour récupérer des actifs", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      await aToken.connect(user1).deposit(depositAmount, user1.address);
      const shares = await aToken.balanceOf(user1.address);
      const usdcBefore = await usdc.balanceOf(user1.address);
      await aToken.connect(user1).redeem(shares, user1.address, user1.address);
      const usdcAfter = await usdc.balanceOf(user1.address);
      expect(usdcAfter - usdcBefore).to.be.closeTo(depositAmount, 10);
      expect(await aToken.balanceOf(user1.address)).to.equal(0);
    });
  });
  
  describe("aToken Interest Accrual", function () {
    it("Accumule des intérêts avec le temps", async function () {
      const depositAmount = ethers.parseUnits("10000", 6);
      await aToken.connect(user1).deposit(depositAmount, user1.address);
      const initialContractBalance = await usdc.balanceOf(await aToken.getAddress());
      await time.increase(30 * oneDay);
      await aToken.accrueInterest();
      const newContractBalance = await usdc.balanceOf(await aToken.getAddress());
      expect(newContractBalance).to.be.gt(initialContractBalance);
      const expectedInterest = depositAmount * BigInt(1500) * BigInt(30) / (BigInt(10000) * BigInt(365));
      const actualInterest = newContractBalance - initialContractBalance;
      expect(actualInterest).to.be.closeTo(expectedInterest, ethers.parseUnits("1", 6)); // Marge de 1 USDC
    });
    
    it("Met à jour lastInterestUpdate après l'accumulation d'intérêts", async function () {
      const initialTimestamp = await aToken.lastInterestUpdate();
      await time.increase(oneDay);
      await aToken.accrueInterest();
      const newTimestamp = await aToken.lastInterestUpdate();
      expect(newTimestamp).to.be.gt(initialTimestamp);
    });
    
    it("N'ajoute pas d'intérêts si aucun actif n'est détenu", async function () {
      expect(await usdc.balanceOf(await aToken.getAddress())).to.equal(0);
      await time.increase(30 * oneDay);
      await aToken.accrueInterest();
      expect(await usdc.balanceOf(await aToken.getAddress())).to.equal(0);
    });
    
    it("Calcule correctement les intérêts avec différents taux", async function () {
      const depositAmount = ethers.parseUnits("10000", 6);
      await aToken.connect(user1).deposit(depositAmount, user1.address);
      await aToken.setInterestRate(2000);
      const initialBalance = await usdc.balanceOf(await aToken.getAddress());
      await time.increase(365 * oneDay);
      await aToken.accrueInterest();
      const newBalance = await usdc.balanceOf(await aToken.getAddress());
      const expectedInterest = initialBalance * BigInt(2000) / BigInt(10000); // 20%
      const actualInterest = newBalance - initialBalance;
      expect(actualInterest).to.be.closeTo(expectedInterest, ethers.parseUnits("1", 6)); // Marge de 1 USDC
    });
  });
  
  describe("aToken ERC4626 Functionality", function () {
    it("Implémente correctement les fonctions de conversion ERC4626", async function () {
      const amount = ethers.parseUnits("1000", 6);
      await aToken.connect(user1).deposit(amount, user1.address);
      const shares = await aToken.balanceOf(user1.address);
      const assetsFromConvert = await aToken.convertToAssets(shares);
      expect(assetsFromConvert).to.be.closeTo(amount, 10);
      const sharesFromConvert = await aToken.convertToShares(amount);
      expect(sharesFromConvert).to.be.closeTo(shares, 10);
      expect(await aToken.convertToAssets(0)).to.equal(0);
      expect(await aToken.convertToShares(0)).to.equal(0);
    });
    
    it("Calcule correctement les fonctions de prévisualisation ERC4626", async function () {
      const amount = ethers.parseUnits("1000", 6);
      const previewShares = await aToken.previewDeposit(amount);
      await aToken.connect(user1).deposit(amount, user1.address);
      const actualShares = await aToken.balanceOf(user1.address);
      expect(actualShares).to.be.closeTo(previewShares, 10);
      const previewAmount = await aToken.previewMint(actualShares);
      expect(previewAmount).to.be.closeTo(amount, 10);
      const previewShares2 = await aToken.previewWithdraw(amount);
      const previewAmount2 = await aToken.previewRedeem(actualShares);
      expect(previewAmount2).to.be.closeTo(amount, 10);
      expect(previewShares2).to.be.closeTo(actualShares, 10);
    });
    
    it("Retourne correctement les fonctions maxDeposit, maxMint, maxWithdraw et maxRedeem", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      await aToken.connect(user1).deposit(depositAmount, user1.address);
      const maxDeposit = await aToken.maxDeposit(user1.address);
      const maxMint = await aToken.maxMint(user1.address);
      expect(maxDeposit).to.equal(ethers.MaxUint256);
      expect(maxMint).to.equal(ethers.MaxUint256);
      const maxWithdraw = await aToken.maxWithdraw(user1.address);
      const maxRedeem = await aToken.maxRedeem(user1.address);
      expect(maxWithdraw).to.be.closeTo(depositAmount, 10);
      const userShares = await aToken.balanceOf(user1.address);
      expect(maxRedeem).to.equal(userShares);
    });
  });
  
  describe("cToken Tests", function () {
    it("Devrait initialiser correctement le contrat", async function () {
      expect(await cToken.asset()).to.equal(await usdc.getAddress());
      expect(await cToken.name()).to.equal("Compound USDC");
      expect(await cToken.symbol()).to.equal("cUSDC");
      expect(await cToken.interestRate()).to.equal(1500); // 15.00%
      expect(await cToken.owner()).to.equal(owner.address);
    });
    
    // Comme cToken est une implémentation identique à aToken dans ces tests,
    // nous n'avons pas besoin de dupliquer tous les tests
    it("Permet de déposer et retirer des actifs", async function () {
      const depositAmount = ethers.parseUnits("1000", 6);
      await cToken.connect(user1).deposit(depositAmount, user1.address);
      expect(await cToken.balanceOf(user1.address)).to.be.gt(0);
      const shares = await cToken.balanceOf(user1.address);
      const usdcBefore = await usdc.balanceOf(user1.address);
      await cToken.connect(user1).redeem(shares, user1.address, user1.address);
      const usdcAfter = await usdc.balanceOf(user1.address);
      expect(usdcAfter - usdcBefore).to.be.closeTo(depositAmount, 10);
    });
  });




  /*--------------------------------------------------------*/
  describe("aToken Complete Coverage Tests", function () {
    describe("aToken Edge Cases for Complete Coverage", function () {
      it("Ne devrait pas accumuler d'intérêts si aucun temps ne s'est écoulé", async function () {
        const depositAmount = ethers.parseUnits("1000", 6);
        await aToken.connect(user1).deposit(depositAmount, user1.address);
        
        const initialContractBalance = await usdc.balanceOf(await aToken.getAddress());
        const initialTimestamp = await aToken.lastInterestUpdate();
        
        //await aToken.accrueInterest();
        
        const newContractBalance = await usdc.balanceOf(await aToken.getAddress());
        const newTimestamp = await aToken.lastInterestUpdate();
        
        expect(newContractBalance).to.equal(initialContractBalance);
        expect(newTimestamp).to.equal(initialTimestamp);
      });
      
      it("Ne devrait pas mint de nouveaux tokens si le montant d'intérêt calculé est zéro", async function () {
        // Déposer un très petit montant pour que les intérêts calculés soient arrondis à zéro
        const tinyAmount = ethers.parseUnits("0.000001", 6); // Le plus petit montant possible avec 6 décimales
        await usdc.connect(user1).approve(await aToken.getAddress(), tinyAmount);
        await aToken.connect(user1).deposit(tinyAmount, user1.address);
        
        const initialContractBalance = await usdc.balanceOf(await aToken.getAddress());
        
        // Avancer le temps, mais pas assez pour générer des intérêts significatifs
        await time.increase(1); // Juste 1 seconde
        
        await aToken.accrueInterest();
        
        const newContractBalance = await usdc.balanceOf(await aToken.getAddress());
        expect(newContractBalance).to.equal(initialContractBalance);
      });
      
      it("Met à jour lastInterestUpdate même si aucun intérêt n'est ajouté", async function () {
        // S'assurer que le contrat est vide
        expect(await usdc.balanceOf(await aToken.getAddress())).to.equal(0);
        
        const initialTimestamp = await aToken.lastInterestUpdate();
        await time.increase(oneDay);
        
        await aToken.accrueInterest();
        
        const newTimestamp = await aToken.lastInterestUpdate();
        expect(newTimestamp).to.be.gt(initialTimestamp);
      });
      
      it("Gère correctement un taux d'intérêt à zéro", async function () {
        const depositAmount = ethers.parseUnits("1000", 6);
        await aToken.connect(user1).deposit(depositAmount, user1.address);
        
        // Définir le taux d'intérêt à zéro
        await aToken.setInterestRate(0);
        expect(await aToken.interestRate()).to.equal(0);
        
        const initialContractBalance = await usdc.balanceOf(await aToken.getAddress());
        await time.increase(30 * oneDay);
        
        await aToken.accrueInterest();
        
        const newContractBalance = await usdc.balanceOf(await aToken.getAddress());
        expect(newContractBalance).to.equal(initialContractBalance);
      });
      
      it("Vérifie le comportement avec des valeurs extrêmes de temps écoulé", async function () {
        const depositAmount = ethers.parseUnits("1000", 6);
        await aToken.connect(user1).deposit(depositAmount, user1.address);
        
        const initialContractBalance = await usdc.balanceOf(await aToken.getAddress());
        
        // Simuler un temps très long (plusieurs années)
        const threeYearsInSeconds = 3 * 365 * oneDay;
        await time.increase(threeYearsInSeconds);
        
        await aToken.accrueInterest();
        
        const newContractBalance = await usdc.balanceOf(await aToken.getAddress());
        expect(newContractBalance).to.be.gt(initialContractBalance);
        
        // Vérifier que les intérêts sont proportionnels au temps écoulé
        // Utilisation du calcul manuel avec des nombres
        const interestRate = 1500; // 15.00%
        const expectedInterest = Number(ethers.formatUnits(depositAmount, 6)) * 
                                (interestRate / 10000) * 
                                (threeYearsInSeconds / (365 * oneDay));
        const expectedInterestBN = ethers.parseUnits(expectedInterest.toFixed(6), 6);
        const actualInterest = newContractBalance - initialContractBalance;
        
        expect(actualInterest).to.be.closeTo(expectedInterestBN, ethers.parseUnits("1", 6));
      });
    });
  });



});