const { expect } = require("chai");
const { ethers } = require("hardhat");
const { mine, time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Tests de couverture de branches pour YieldOptimizer", function () {
  let proprietaire, utilisateur1, utilisateur2, utilisateur3;
  let usdc, aToken, cToken, ezToken;
  const approvisionnementInitial = ethers.parseUnits("1000000", 6); // 1 million USDC avec 6 décimales
  const unJour = 24 * 60 * 60; // 1 jour en secondes

  beforeEach(async function () {
    [proprietaire, utilisateur1, utilisateur2, utilisateur3] = await ethers.getSigners();
    
    // Déploiement des contrats
    const MintableUSDC = await ethers.getContractFactory("MintableUSDC");
    usdc = await MintableUSDC.deploy("USD Coin", "USDC", approvisionnementInitial);
    
    const Vault = await ethers.getContractFactory("aToken");
    aToken = await Vault.deploy(await usdc.getAddress(), "Aave USDC", "aUSDC");
    cToken = await Vault.deploy(await usdc.getAddress(), "Compound USDC", "cUSDC");
    
    const YieldOptimizer = await ethers.getContractFactory("YieldOptimizer");
    ezToken = await YieldOptimizer.deploy(await usdc.getAddress(), [await aToken.getAddress(), await cToken.getAddress()]);
    
    // Configuration
    await usdc.addMinter(await ezToken.getAddress());
    await usdc.addMinter(await aToken.getAddress());
    await usdc.addMinter(await cToken.getAddress());
    
    // Distribution d'USDC aux utilisateurs de test
    await usdc.transfer(utilisateur1.address, ethers.parseUnits("10000", 6));
    await usdc.transfer(utilisateur2.address, ethers.parseUnits("10000", 6));
    
    // Approbations
    await usdc.connect(utilisateur1).approve(await ezToken.getAddress(), ethers.parseUnits("10000", 6));
    await usdc.connect(utilisateur2).approve(await ezToken.getAddress(), ethers.parseUnits("10000", 6));
  });

  // Tester les cas limites pour la fonction de dépôt
  describe("Couverture de branches pour la fonction de dépôt", function () {
    it("devrait échouer lors d'une tentative de dépôt de montant 0", async function () {
      await expect(ezToken.connect(utilisateur1).deposit(0)).to.be.revertedWith("Amount must be greater than 0");
    });

    it("devrait gérer correctement le premier dépôt (branche totalSupply == 0)", async function () {
      expect(await ezToken.totalSupply()).to.equal(0);
      const montantDepot = ethers.parseUnits("1000", 6);
      await ezToken.connect(utilisateur1).deposit(montantDepot);
      // Vérifier la formule de calcul des parts pour le premier dépôt
      // parts = montant * 1e18 / 1e6
      const partsAttendues = montantDepot * BigInt(1e18) / BigInt(1e6);
      expect(await ezToken.balanceOf(utilisateur1.address)).to.be.closeTo(partsAttendues, 100n);
    });

    it("devrait gérer correctement les dépôts ultérieurs (branche totalSupply > 0)", async function () {
      // Premier dépôt
      await ezToken.connect(utilisateur1).deposit(ethers.parseUnits("1000", 6));
      // Deuxième dépôt
      const montantDepot = ethers.parseUnits("1000", 6);
      await ezToken.connect(utilisateur2).deposit(montantDepot);
      expect(await ezToken.balanceOf(utilisateur2.address)).to.be.gt(0);
    });
  });

  // Tester les cas limites pour la fonction de retrait
  describe("Couverture de branches pour la fonction de retrait", function () {
    it("devrait échouer lors d'une tentative de retrait de 0 parts", async function () {
      await expect(ezToken.connect(utilisateur1).withdraw(0)).to.be.revertedWith("Shares must be greater than 0");
    });

    it("devrait échouer lors d'une tentative de retrait de plus de parts que possédées", async function () {
      await ezToken.connect(utilisateur1).deposit(ethers.parseUnits("1000", 6));
      const parts = await ezToken.balanceOf(utilisateur1.address);
      await expect(ezToken.connect(utilisateur1).withdraw(parts + 1n)).to.be.revertedWith("Insufficient shares");
    });

    it("devrait gérer le retrait lorsque le contrat a suffisamment de solde USDC", async function () {
      // Premier dépôt pour mise en place
      const montantDepot = ethers.parseUnits("1000", 6);
      await ezToken.connect(utilisateur1).deposit(montantDepot);
      
      // Transférer manuellement des USDC directement au contrat pour créer le scénario
      await usdc.transfer(await ezToken.getAddress(), ethers.parseUnits("500", 6));
      
      // Maintenant effectuer un retrait - devrait utiliser d'abord le solde direct
      const parts = await ezToken.balanceOf(utilisateur1.address);
      const moitieParts = parts / 2n;
      await ezToken.connect(utilisateur1).withdraw(moitieParts);
    });

    it("devrait gérer le retrait lorsque le contrat doit retirer du coffre-fort", async function () {
      // Premier dépôt pour mise en place
      const montantDepot = ethers.parseUnits("1000", 6);
      await ezToken.connect(utilisateur1).deposit(montantDepot);
      
      // Retirer toutes les parts - devrait nécessiter un retrait du coffre-fort
      const parts = await ezToken.balanceOf(utilisateur1.address);
      await ezToken.connect(utilisateur1).withdraw(parts);
      
      // Vérifier que l'utilisateur a récupéré ses USDC
      const solde = await usdc.balanceOf(utilisateur1.address);
      expect(solde).to.be.gte(ethers.parseUnits("9900", 6)); // Au moins 9900 USDC rendus (permettant une petite perte de précision)
    });
  });

  // Tester les branches de la fonction totalAssets
  describe("Couverture de branches pour la fonction totalAssets", function () {
    it("devrait gérer le cas où currentVault n'est pas défini", async function () {
      const ezToken2 = await (await ethers.getContractFactory("YieldOptimizer")).deploy(
        await usdc.getAddress(), 
        [await aToken.getAddress(), await cToken.getAddress()]
      );
      
      // À ce stade, aucun dépôt n'a été effectué, donc currentVault devrait être address(0)
      expect(await ezToken2.currentVault()).to.equal(ethers.ZeroAddress);
      
      // TotalAssets devrait simplement renvoyer le solde USDC du contrat
      const montant = ethers.parseUnits("100", 6);
      await usdc.transfer(await ezToken2.getAddress(), montant);
      expect(await ezToken2.totalAssets()).to.equal(montant);
    });

    it("devrait gérer le cas où le coffre-fort n'a pas de parts", async function () {
      // Configurer le coffre-fort mais ne pas déposer
      await aToken.setInterestRate(1000);
      await cToken.setInterestRate(2000);
      
      // Forcer le coffre-fort actuel via le constructeur mais ne pas déposer
      const ezToken2 = await (await ethers.getContractFactory("YieldOptimizer")).deploy(
        await usdc.getAddress(), 
        [await aToken.getAddress(), await cToken.getAddress()]
      );
      
      // Faire un premier dépôt pour définir currentVault
      await usdc.approve(await ezToken2.getAddress(), ethers.parseUnits("100", 6));
      await ezToken2.deposit(ethers.parseUnits("100", 6));
      
      // Retirer tous les fonds y compris du coffre-fort
      await ezToken2.rebalance(); // S'assurer que nous avons déposé au coffre-fort
      
      // Obtenir les parts et tout retirer
      const parts = await ezToken2.balanceOf(proprietaire.address);
      await ezToken2.withdraw(parts);
      
      // Maintenant le coffre-fort ne devrait pas avoir de parts mais être toujours défini comme currentVault
      expect(await ezToken2.currentVault()).to.not.equal(ethers.ZeroAddress);
      
      // Transférer des USDC directement au contrat
      await usdc.transfer(await ezToken2.getAddress(), ethers.parseUnits("50", 6));
      
      // Total assets devrait simplement rapporter le solde direct
      expect(await ezToken2.totalAssets()).to.equal(ethers.parseUnits("50", 6));
    });
  });

  // Tester les branches de la fonction rebalance
  describe("Couverture de branches pour la fonction rebalance", function () {
    it("devrait échouer lorsque rebalance est appelée avant la période de refroidissement", async function () {
      await ezToken.rebalance(); // Premier rééquilibrage
      await expect(ezToken.rebalance()).to.be.revertedWith("Rebalance cooldown");
    });

    it("ne devrait pas changer de coffre-fort lorsque le coffre-fort actuel est déjà le meilleur", async function () {
      // Configuration
      await aToken.setInterestRate(1000);
      await cToken.setInterestRate(2000);
      const montantDepot = ethers.parseUnits("1000", 6);
      await ezToken.connect(utilisateur1).deposit(montantDepot);
      
      // Avancer le temps pour le refroidissement
      await time.increase(12 * 60 * 60 + 1);
      
      // Le coffre-fort actuel devrait déjà être le meilleur (cToken)
      const coffreActuel = await ezToken.currentVault();
      expect(coffreActuel).to.equal(await cToken.getAddress());
      
      // Appeler rebalance - ne devrait pas émettre d'événement Rebalanced puisqu'il n'y a pas de changement
      await expect(ezToken.rebalance()).to.not.emit(ezToken, "Rebalanced");
      
      // Le coffre-fort devrait toujours être le même
      expect(await ezToken.currentVault()).to.equal(coffreActuel);
    });
  });

  // Tester la fonction removeVault
  describe("Couverture des fonctions de gestion des coffres-forts", function () {
    it("devrait gérer correctement _removeFromArray lorsque l'élément existe", async function () {
      // L'état initial devrait avoir les deux coffres-forts
      expect(await ezToken.allowedVaults(0)).to.equal(await aToken.getAddress());
      expect(await ezToken.allowedVaults(1)).to.equal(await cToken.getAddress());
      
      // Supprimer aToken
      await ezToken.removeVault(await aToken.getAddress());
      
      // Ne devrait maintenant avoir que cToken
      expect(await ezToken.allowedVaults(0)).to.equal(await cToken.getAddress());
      
      // La longueur devrait être 1
      await expect(ezToken.allowedVaults(1)).to.be.reverted;
    });
/*
    it("devrait gérer correctement le cas où aucun coffre-fort n'a un meilleur taux", async function () {
      // Déployer un YieldOptimizer avec un seul coffre-fort
      const optimiseurUniqueCoffre = await (await ethers.getContractFactory("YieldOptimizer")).deploy(
        await usdc.getAddress(), 
        [await aToken.getAddress()]
      );
      
      // Définir le taux à 0
      await aToken.setInterestRate(0);
      
      // Devrait toujours trouver le coffre-fort même avec un taux de 0
      const meilleur = await optimiseurUniqueCoffre.findBestVault();
      expect(meilleur).to.equal(await aToken.getAddress());
      
      // Maintenant supprimer le seul coffre-fort
      await optimiseurUniqueCoffre.removeVault(await aToken.getAddress());
      
      // findBestVault devrait échouer avec "No vaults available"
      await expect(optimiseurUniqueCoffre.findBestVault()).to.be.revertedWith("No vaults available");
    });
*/

});
});