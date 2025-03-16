// test/compound.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AdvancedCompoundERC4626", function () {
  let MintableUSDC, mintableUSDC;
  let AdvancedCompound, advancedCompound;
  let owner, user1, user2;
  let initialSupply, depositAmount;

  before(async function () {
    [owner, user1, user2] = await ethers.getSigners();
    initialSupply = ethers.parseUnits("1000000", 18); // 1 million USDC
    depositAmount = ethers.parseUnits("1000", 18); // 1000 USDC pour les tests
  });

  beforeEach(async function () {
    // Déploiement des contrats pour chaque test
    MintableUSDC = await ethers.getContractFactory("MintableUSDC");
    mintableUSDC = await MintableUSDC.deploy("USD Coin", "USDC", initialSupply);

    AdvancedCompound = await ethers.getContractFactory("AdvancedCompoundERC4626");
    advancedCompound = await AdvancedCompound.deploy(
      await mintableUSDC.getAddress(),
      "Compound USDC Vault",
      "cUSDC"
    );

    // Transférer des USDC à l'utilisateur pour les tests
    // On multiplie par 2 en utilisant la notation JavaScript standard
    await mintableUSDC.transfer(user1.address, depositAmount * 2n);
  });

  describe("Déploiement", function () {
    it("Devrait correctement déployer les contrats", async function () {
      expect(await mintableUSDC.name()).to.equal("USD Coin");
      expect(await mintableUSDC.symbol()).to.equal("USDC");
      expect(await advancedCompound.name()).to.equal("Compound USDC Vault");
      expect(await advancedCompound.symbol()).to.equal("cUSDC");
    });

    it("Devrait avoir le bon taux d'échange initial", async function () {
      expect(await advancedCompound.exchangeRateStored()).to.equal(ethers.parseUnits("1", 18)); // 1:1
    });
  });

  describe("Dépôt et retrait", function () {
    beforeEach(async function () {
      // Approbation pour le dépôt
      await mintableUSDC.connect(user1).approve(
        await advancedCompound.getAddress(), 
        depositAmount
      );
    });

    it("Devrait permettre de déposer des USDC et recevoir des cUSDC", async function () {
      await advancedCompound.connect(user1).deposit(depositAmount, user1.address);
      
      const shares = await advancedCompound.balanceOf(user1.address);
      expect(shares).to.equal(depositAmount); // Au début, 1:1
      
      const assetsValue = await advancedCompound.convertToAssets(shares);
      expect(assetsValue).to.equal(depositAmount);
    });


  it("Devrait permettre de retirer des USDC en brûlant des cUSDC", async function () {
    // Vérifier le solde initial avant le dépôt
    const initialBalance = await mintableUSDC.balanceOf(user1.address);
    
    // Faire le dépôt
    await advancedCompound.connect(user1).deposit(depositAmount, user1.address);
    
    // Vérifier le solde après dépôt
    const balanceAfterDeposit = await mintableUSDC.balanceOf(user1.address);
    expect(balanceAfterDeposit).to.equal(initialBalance - depositAmount);
    
    // Obtenir le nombre de parts
    const sharesBefore = await advancedCompound.balanceOf(user1.address);
    
    // Faire le retrait
    await advancedCompound.connect(user1).redeem(sharesBefore, user1.address, user1.address);
    
    // Vérifier que les parts ont été brûlées
    const sharesAfter = await advancedCompound.balanceOf(user1.address);
    expect(sharesAfter).to.equal(0);
    
    // Vérifier que le solde USDC est revenu à la valeur initiale
    const finalBalance = await mintableUSDC.balanceOf(user1.address);
    expect(finalBalance).to.equal(initialBalance);
  });


});









  describe("Accumulation d'intérêts", function () {
    beforeEach(async function () {
      // Approbation et dépôt
      await mintableUSDC.connect(user1).approve(
        await advancedCompound.getAddress(), 
        depositAmount
      );
      await advancedCompound.connect(user1).deposit(depositAmount, user1.address);
      
      // Transférer la propriété de l'USDC au contrat Compound pour permettre le minting
      await mintableUSDC.transferOwnership(await advancedCompound.getAddress());
    });

    it("Devrait permettre de changer le taux d'échange", async function () {
      const newRate = ethers.parseUnits("1.1", 18); // 1.1 * 10^18 (10% d'intérêt)
      await advancedCompound.setExchangeRate(newRate);
      
      expect(await advancedCompound.exchangeRateStored()).to.equal(newRate);
    });

    it("Devrait accumuler des intérêts correctement", async function () {
      const interestAmount = ethers.parseUnits("100", 18); // 100 USDC

      // On ajoute les intérêts
      await advancedCompound.accrueInterest(interestAmount);
      
      // On vérifie que le contrat a bien reçu les nouveaux tokens
      const vaultBalance = await mintableUSDC.balanceOf(await advancedCompound.getAddress());
      expect(vaultBalance).to.equal(depositAmount + interestAmount);
      
      // La même quantité de shares devrait maintenant valoir plus d'USDC
      const shares = await advancedCompound.balanceOf(user1.address);
      const newExchangeRate = ethers.parseUnits("1.1", 18); // 1.1 * 10^18
      await advancedCompound.setExchangeRate(newExchangeRate);
      
      const assetsValueAfter = await advancedCompound.convertToAssets(shares);
      expect(assetsValueAfter).to.be.gt(depositAmount);
    });

    it("Devrait permettre de retirer plus d'USDC après accumulation d'intérêts", async function () {
      // Accumulation d'intérêts
      const interestAmount = ethers.parseUnits("100", 18); // 100 USDC
      await advancedCompound.accrueInterest(interestAmount);
      
      // Changement du taux d'échange
      const newExchangeRate = ethers.parseUnits("1.1", 18); // +10%
      await advancedCompound.setExchangeRate(newExchangeRate);
      
      // Solde USDC avant retrait
      const usdcBefore = await mintableUSDC.balanceOf(user1.address);
      
      // Récupération des shares
      const shares = await advancedCompound.balanceOf(user1.address);
      
      // Retrait de tous les actifs
      await advancedCompound.connect(user1).redeem(shares, user1.address, user1.address);
      
      // Vérification du solde USDC après retrait
      const usdcAfter = await mintableUSDC.balanceOf(user1.address);
      
      // L'utilisateur devrait recevoir 10% de plus que son dépôt initial
      const expectedGain = depositAmount * 10n / 100n;
      expect(usdcAfter - usdcBefore).to.be.closeTo(
        depositAmount + expectedGain,
        ethers.parseUnits("1", 15) // Tolérance de 0.001 USDC pour les erreurs d'arrondi
      );
    });
  });

  describe("Sécurité et permissions", function () {
    it("Seul le propriétaire peut définir le taux d'échange", async function () {
      const newRate = ethers.parseUnits("1.2", 18);
      
      await expect(
        advancedCompound.connect(user1).setExchangeRate(newRate)
      ).to.be.revertedWithCustomError(
        advancedCompound,
        "OwnableUnauthorizedAccount"
      );
      
      // Le propriétaire devrait pouvoir changer le taux
      await advancedCompound.setExchangeRate(newRate);
      expect(await advancedCompound.exchangeRateStored()).to.equal(newRate);
    });

    it("Seul le propriétaire peut accumuler des intérêts", async function () {
      // Donner les droits de mint au contrat Compound
      await mintableUSDC.transferOwnership(await advancedCompound.getAddress());
      
      const interestAmount = ethers.parseUnits("100", 18);
      
      await expect(
        advancedCompound.connect(user1).accrueInterest(interestAmount)
      ).to.be.revertedWithCustomError(
        advancedCompound,
        "OwnableUnauthorizedAccount"
      );
      
      // Le propriétaire devrait pouvoir accumuler des intérêts
      await advancedCompound.accrueInterest(interestAmount);
    });
  });

  describe("Conversion précise", function () {
    it("Devrait convertir correctement les actifs en parts avec différents taux", async function () {
      const assets = ethers.parseUnits("100", 18);
      
      // Taux initial (1:1)
      let shares = await advancedCompound.convertToShares(assets);
      expect(shares).to.equal(assets);
      
      // Changer le taux à 1.1 (après accumulation d'intérêts)
      const newRate = ethers.parseUnits("1.1", 18);
      await advancedCompound.setExchangeRate(newRate);
      
      // Avec un taux de 1.1, 100 USDC = ~90.91 shares
      shares = await advancedCompound.convertToShares(assets);
      const expectedShares = assets * ethers.parseUnits("1", 18) / newRate;
      expect(shares).to.equal(expectedShares);
    });

    it("Devrait convertir correctement les parts en actifs avec différents taux", async function () {
      const shares = ethers.parseUnits("100", 18);
      
      // Taux initial (1:1)
      let assets = await advancedCompound.convertToAssets(shares);
      expect(assets).to.equal(shares);
      
      // Changer le taux à 1.2 (après plus d'accumulation d'intérêts)
      const newRate = ethers.parseUnits("1.2", 18);
      await advancedCompound.setExchangeRate(newRate);
      
      // Avec un taux de 1.2, 100 shares = 120 USDC
      assets = await advancedCompound.convertToAssets(shares);
      const expectedAssets = shares * newRate / ethers.parseUnits("1", 18);
      expect(assets).to.equal(expectedAssets);
    });
  });
});