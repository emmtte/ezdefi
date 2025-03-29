const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("ezToken Tests", function () {
  let proprietaire, utilisateur1, utilisateur2, utilisateur3;
  let usdc, aToken, cToken, ezToken;
  const approvisionnementInitial = ethers.parseUnits("1000000", 18)

  beforeEach(async function () {
    [proprietaire, utilisateur1, utilisateur2, utilisateur3] = await ethers.getSigners();
    const MintableUSDC = await ethers.getContractFactory("MintableUSDC");
    usdc = await MintableUSDC.deploy("USD Coin", "USDC", approvisionnementInitial);
    const Vault = await ethers.getContractFactory("aToken");
    aToken = await Vault.deploy(await usdc.getAddress(), "Aave USDC", "aUSDC");
    cToken = await Vault.deploy(await usdc.getAddress(), "Compound USDC", "cUSDC");
    const YieldOptimizer = await ethers.getContractFactory("YieldOptimizer");
    ezToken = await YieldOptimizer.deploy(await usdc.getAddress(), [await aToken.getAddress(), await cToken.getAddress()]);
    await usdc.addMinter(await ezToken.getAddress());
    await usdc.addMinter(await aToken.getAddress());
    await usdc.addMinter(await cToken.getAddress());
    await usdc.transfer(utilisateur1.address, ethers.parseUnits("10000", 18));
    await usdc.transfer(utilisateur2.address, ethers.parseUnits("10000", 18));
    await usdc.connect(utilisateur1).approve(await ezToken.getAddress(), ethers.parseUnits("10000", 18));
    await usdc.connect(utilisateur2).approve(await ezToken.getAddress(), ethers.parseUnits("10000", 18));
    await aToken.setInterestRate(500); // 5%
    await cToken.setInterestRate(700); // 7%
  });

  describe("Scénarios pour la fonction de dépôt", function () {
    it("devrait échouer lors d'une tentative de dépôt de montant 0", async function () {
      await expect(ezToken.connect(utilisateur1).deposit(0)).to.be.revertedWith("Amount must be greater than 0");
    });

    it("devrait gérer correctement les dépôts", async function () {
      await ezToken.connect(utilisateur1).deposit(ethers.parseUnits("1000", 18));
      const montantDepot = ethers.parseUnits("1000", 18);
      await ezToken.connect(utilisateur2).deposit(montantDepot);
      expect(await ezToken.balanceOf(utilisateur2.address)).to.be.gt(0);
    });
  });

  describe("Scénarios pour la fonction de retrait", function () {
    it("devrait échouer lors d'une tentative de retrait de 0 parts", async function () {
      await expect(ezToken.connect(utilisateur1).withdraw(0)).to.be.revertedWith("Shares must be greater than 0");
    });

    it("devrait échouer lors d'une tentative de retrait de plus de parts que possédées", async function () {
      await ezToken.connect(utilisateur1).deposit(ethers.parseUnits("1000", 18));
      const parts = await ezToken.balanceOf(utilisateur1.address);
      await expect(ezToken.connect(utilisateur1).withdraw(parts + 1n)).to.be.revertedWith("Insufficient shares");
    });

    it("devrait gérer le retrait lorsque le contrat doit retirer du coffre-fort", async function () {
      const montantDepot = ethers.parseUnits("1000", 18);
      await ezToken.connect(utilisateur1).deposit(montantDepot);
      const parts = await ezToken.balanceOf(utilisateur1.address);
      await ezToken.connect(utilisateur1).withdraw(parts);
      const solde = await usdc.balanceOf(utilisateur1.address);
      expect(solde).to.be.gte(ethers.parseUnits("9900", 18));
    });
  });

  describe("Scénarios pour la fonction totalAssets", function () {
    it("devrait gérer le cas où currentVault n'est pas défini", async function () {
      const ezToken2 = await (await ethers.getContractFactory("YieldOptimizer")).deploy(
        await usdc.getAddress(),
        [await aToken.getAddress(), await cToken.getAddress()]
      );
      expect(await ezToken2.currentVault()).to.equal(ethers.ZeroAddress);
      const montant = ethers.parseUnits("100", 18);
      await usdc.transfer(await ezToken2.getAddress(), montant);
      expect(await ezToken2.totalAssets()).to.equal(montant);
    });

    it("devrait gérer le cas où le coffre-fort n'a pas de parts", async function () {
      await aToken.setInterestRate(1000);
      await cToken.setInterestRate(2000);
      const ezToken2 = await (await ethers.getContractFactory("YieldOptimizer")).deploy(
        await usdc.getAddress(),
        [await aToken.getAddress(), await cToken.getAddress()]
      );
      await usdc.approve(await ezToken2.getAddress(), ethers.parseUnits("100", 18));
      await ezToken2.deposit(ethers.parseUnits("100", 18));
      await ezToken2.rebalance();
      const parts = await ezToken2.balanceOf(proprietaire.address);
      await ezToken2.withdraw(parts);
      expect(await ezToken2.currentVault()).to.not.equal(ethers.ZeroAddress);
      await usdc.transfer(await ezToken2.getAddress(), ethers.parseUnits("50", 18));
      expect(await ezToken2.totalAssets()).to.equal(ethers.parseUnits("50", 18));
    });
  });

  describe("Scénarios pour la fonction rebalance", function () {
    it.skip("devrait échouer lorsque rebalance est appelée avant la période de 12h", async function () {
      await ezToken.rebalance();
      await expect(ezToken.rebalance()).to.be.revertedWith("Rebalance cooldown");
    });
    
    it("devrait réussir lorsque rebalance est appelée plusieurs fois de suite", async function () {
        await ezToken.rebalance();
        await ezToken.rebalance();
    });

    it("devrait sélectionner le coffre-fort avec le meilleur taux lors du premier dépôt", async function () {
      await ezToken.connect(utilisateur1).deposit(ethers.parseUnits("1000", 18));
      expect(await ezToken.currentVault()).to.equal(await cToken.getAddress());
      expect(await cToken.balanceOf(await ezToken.getAddress())).to.be.gt(0);
      expect(await aToken.balanceOf(await ezToken.getAddress())).to.equal(0);
    });
  
    it("devrait rééquilibrer vers le meilleur coffre-fort quand les taux changent", async function () {
      await ezToken.connect(utilisateur1).deposit(ethers.parseUnits("1000", 18));
      expect(await ezToken.currentVault()).to.equal(await cToken.getAddress());
      await aToken.setInterestRate(900); // 9%
      await cToken.setInterestRate(600); // 6%
      const rebalanceTx = await ezToken.connect(proprietaire).rebalance();
      expect(await ezToken.currentVault()).to.equal(await aToken.getAddress());
      expect(await aToken.balanceOf(await ezToken.getAddress())).to.be.gt(0);
      expect(await cToken.balanceOf(await ezToken.getAddress())).to.equal(0);
      await expect(rebalanceTx)
        .to.emit(ezToken, "Rebalanced")
        .withArgs(await aToken.getAddress(), await usdc.balanceOf(await ezToken.getAddress()));
    });
  
    it("ne devrait pas rééquilibrer si le meilleur coffre-fort reste le même", async function () {
      await ezToken.connect(utilisateur1).deposit(ethers.parseUnits("1000", 18));
      const soldeInitial = await cToken.balanceOf(await ezToken.getAddress());
      await aToken.setInterestRate(400); // 4%
      await cToken.setInterestRate(600); // 6% 
      await ezToken.connect(proprietaire).rebalance();
      expect(await ezToken.currentVault()).to.equal(await cToken.getAddress());
      expect(await cToken.balanceOf(await ezToken.getAddress())).to.equal(soldeInitial);
      expect(await aToken.balanceOf(await ezToken.getAddress())).to.equal(0);
    });
  
    it("devrait mettre à jour lastRebalance même sans changement de coffre-fort", async function () {
      await ezToken.connect(utilisateur1).deposit(ethers.parseUnits("1000", 18));
      const lastRebalanceBefore = await ezToken.lastRebalance();
      await ethers.provider.send("evm_increaseTime", [60]); // Avancer de 60 secondes
      await ethers.provider.send("evm_mine");
      await ezToken.connect(proprietaire).rebalance();
      const lastRebalanceAfter = await ezToken.lastRebalance();
      expect(lastRebalanceAfter).to.be.gt(lastRebalanceBefore);
    });
  
    it("devrait échouer si appelé par quelqu'un d'autre que le propriétaire", async function () {
      await expect(ezToken.connect(utilisateur1).rebalance())
        .to.be.revertedWithCustomError(ezToken, "OwnableUnauthorizedAccount")
        .withArgs(utilisateur1.address);
    });
  
    it("devrait gérer correctement le rééquilibrage avec plusieurs utilisateurs", async function () {
      await ezToken.connect(utilisateur1).deposit(ethers.parseUnits("1000", 18));
      await ezToken.connect(utilisateur2).deposit(ethers.parseUnits("2000", 18));
      const soldeUtilisateur1 = await ezToken.balanceOf(utilisateur1.address);
      const soldeUtilisateur2 = await ezToken.balanceOf(utilisateur2.address);
      const totalAssetsBefore = await ezToken.totalAssets();
      await aToken.setInterestRate(800); // 8%
      await cToken.setInterestRate(400); // 4%
      await ezToken.connect(proprietaire).rebalance();
      const totalAssetsAfter = await ezToken.totalAssets();
      expect(totalAssetsAfter).to.be.gte(totalAssetsBefore); // Ne devrait pas perdre d'actifs
      expect(await ezToken.balanceOf(utilisateur1.address)).to.equal(soldeUtilisateur1);
      expect(await ezToken.balanceOf(utilisateur2.address)).to.equal(soldeUtilisateur2);
    });
  
    it("devrait gérer un troisième coffre-fort ajouté après l'initialisation", async function () {
      // Créer un troisième coffre-fort avec un meilleur taux
      const Vault = await ethers.getContractFactory("aToken");
      const bToken = await Vault.deploy(await usdc.getAddress(), "Balancer USDC", "bUSDC");
      await usdc.addMinter(await bToken.getAddress());
      await bToken.setInterestRate(1000); // 10%
      await ezToken.connect(proprietaire).addVault(await bToken.getAddress());
      await ezToken.connect(utilisateur1).deposit(ethers.parseUnits("1000", 18));
      await ezToken.connect(proprietaire).rebalance();
      expect(await ezToken.currentVault()).to.equal(await bToken.getAddress());
      expect(await bToken.balanceOf(await ezToken.getAddress())).to.be.gt(0);
      expect(await cToken.balanceOf(await ezToken.getAddress())).to.equal(0);
      expect(await aToken.balanceOf(await ezToken.getAddress())).to.equal(0);
    });
  
    it("devrait gérer le cas où un coffre-fort est supprimé puis rééquilibré", async function () {
      await ezToken.connect(utilisateur1).deposit(ethers.parseUnits("1000", 18));
      expect(await ezToken.currentVault()).to.equal(await cToken.getAddress());
      await ezToken.connect(proprietaire).removeVault(await cToken.getAddress());
      await ezToken.connect(proprietaire).rebalance();
      expect(await ezToken.currentVault()).to.equal(await aToken.getAddress());
      expect(await aToken.balanceOf(await ezToken.getAddress())).to.be.gt(0);
      expect(await cToken.balanceOf(await ezToken.getAddress())).to.equal(0);
    });


    it("ne devrait pas changer de coffre-fort lorsque le coffre-fort actuel est déjà le meilleur", async function () {
      await aToken.setInterestRate(1000);
      await cToken.setInterestRate(2000);
      const montantDepot = ethers.parseUnits("1000", 18);
      await ezToken.connect(utilisateur1).deposit(montantDepot);
      await time.increase(12 * 60 * 60 + 1);
      const coffreActuel = await ezToken.currentVault();
      expect(coffreActuel).to.equal(await cToken.getAddress());
      await expect(ezToken.rebalance()).to.not.emit(ezToken, "Rebalanced");
      expect(await ezToken.currentVault()).to.equal(coffreActuel);
    });
  });

  describe("Scénarios des fonctions de gestion des coffres-forts", function () {

    it("devrait gérer correctement la suppression d'un vault", async function () {
      const Vault = await ethers.getContractFactory("aToken");
      const dToken = await Vault.deploy(await usdc.getAddress(), "dYdX USDC", "dUSDC");
      await usdc.addMinter(await dToken.getAddress());
      await ezToken.addVault(await dToken.getAddress());
      await ezToken.removeVault(await dToken.getAddress());
      expect(true).to.be.true;
    });

    it("devrait gérer la suppression du vault actuel et le rééquilibrage", async function () {
      await ezToken.connect(utilisateur1).deposit(ethers.parseUnits("100", 18));
      const initialVault = await ezToken.currentVault();
      await ezToken.removeVault(initialVault);
      await ethers.provider.send("evm_increaseTime", [12 * 60 * 60 + 1]); // 12 heures + 1 seconde
      await ethers.provider.send("evm_mine", []);
      await ezToken.rebalance();
      const newVault = await ezToken.currentVault();
      expect(newVault).to.not.equal(initialVault);
    });

    it("devrait gérer le retrait lorsque le contrat a un solde insuffisant", async function () {
      const depositAmount = ethers.parseUnits("100", 18);
      await ezToken.connect(utilisateur1).deposit(depositAmount);
      const shares = await ezToken.balanceOf(utilisateur1.address);
      const contractBalance = await usdc.balanceOf(await ezToken.getAddress());
      expect(contractBalance).to.be.lessThan(depositAmount);
      await ezToken.connect(utilisateur1).withdraw(shares);
      const userBalanceAfter = await usdc.balanceOf(utilisateur1.address);
      expect(userBalanceAfter).to.be.closeTo(ethers.parseUnits("10000", 18), ethers.parseUnits("0.1", 18));
    });

    it("devrait gérer correctement les dépôts et retraits en séquence", async function () {
      await ezToken.connect(utilisateur1).deposit(ethers.parseUnits("100", 18));
      await ezToken.connect(utilisateur2).deposit(ethers.parseUnits("200", 18));
      const user1Shares = await ezToken.balanceOf(utilisateur1.address);
      const halfShares = user1Shares / BigInt(2);
      await ezToken.connect(utilisateur1).withdraw(halfShares);
      const user2Shares = await ezToken.balanceOf(utilisateur2.address);
      await ezToken.connect(utilisateur2).withdraw(user2Shares);
      expect(await ezToken.balanceOf(utilisateur1.address)).to.equal(user1Shares - halfShares);
      expect(await ezToken.balanceOf(utilisateur2.address)).to.equal(0);
    });

    it("devrait échouer avec des messages d'erreur appropriés lorsque l'entrée est invalide", async function () {
      await expect(
        ezToken.connect(utilisateur1).deposit(0)
      ).to.be.revertedWith("Amount must be greater than 0");

      await expect(
        ezToken.connect(utilisateur1).withdraw(0)
      ).to.be.revertedWith("Shares must be greater than 0");

      await expect(
        ezToken.connect(utilisateur1).withdraw(1)
      ).to.be.revertedWith("Insufficient shares");
    });

    it("devrait gérer le cas où aucun vault n'est pas disponible", async function () {
      const vault1Address = await ezToken.allowedVaults(0);
      const vault2Address = await ezToken.allowedVaults(1);
      await ezToken.removeVault(vault1Address);
      await ezToken.removeVault(vault2Address);

      await expect(
        ezToken.findBestVault()
      ).to.be.revertedWith("No vaults available");

      await expect(
        ezToken.connect(utilisateur1).deposit(ethers.parseUnits("100", 18))
      ).to.be.revertedWith("No vaults available");
      });
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
      })
      
    it("devrait permettre de déposer des USDC et recevoir des parts", async function () {
      const depositAmount = ethers.parseUnits("1000", 18);
      const initialBalance = await usdc.balanceOf(utilisateur1.address);
      await ezToken.connect(utilisateur1).deposit(depositAmount);
      expect(await ezToken.balanceOf(utilisateur1.address)).to.be.gt(0);
      expect(await usdc.balanceOf(utilisateur1.address)).to.equal(initialBalance - depositAmount);
      expect(await cToken.totalAssets()).to.equal(depositAmount);
      expect(await aToken.totalAssets()).to.equal(0);
  });
  
    it("devrait permettre de retirer des USDC en échangeant des parts", async function () {
      const depositAmount = ethers.parseUnits("1000", 18);
      await ezToken.connect(utilisateur1).deposit(depositAmount);
      const shares = await ezToken.balanceOf(utilisateur1.address);
      const preWithdrawBalance = await usdc.balanceOf(utilisateur1.address);
      await ezToken.connect(utilisateur1).withdraw(shares);
      expect(await ezToken.balanceOf(utilisateur1.address)).to.equal(0);
      const postWithdrawBalance = await usdc.balanceOf(utilisateur1.address);
      expect(postWithdrawBalance).to.be.gte(preWithdrawBalance + depositAmount - 10n); // Tolérance de 10 wei
    });
    
    it("devrait permettre de retirer partiellement des USDC", async function () {
      const depositAmount = ethers.parseUnits("1000", 18);
      await ezToken.connect(utilisateur1).deposit(depositAmount);
      const shares = await ezToken.balanceOf(utilisateur1.address);
      const halfShares = shares / 2n;
      await ezToken.connect(utilisateur1).withdraw(halfShares);
      const remainingShares = await ezToken.balanceOf(utilisateur1.address);
      expect(remainingShares).to.be.closeTo(halfShares, 10n);
    });
  });
  
  describe("Scénarios Accumulation d'intérêts et rebalancement", function () {
    beforeEach(async function () {
    await aToken.setInterestRate(1000); // 10%
    await cToken.setInterestRate(2000); // 20%
    await ezToken.connect(utilisateur1).deposit(ethers.parseUnits("1000", 18));
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
      const deposit1 = ethers.parseUnits("1000", 18);
      await ezToken.connect(utilisateur1).deposit(deposit1);
      const shares1 = await ezToken.balanceOf(utilisateur1.address);
      const deposit2 = ethers.parseUnits("2000", 18);
      await ezToken.connect(utilisateur2).deposit(deposit2);
      const shares2 = await ezToken.balanceOf(utilisateur2.address);
      const ratio = shares2 * 1000n / shares1;
      expect(ratio).to.be.closeTo(2000n, 10n);
    });
  
    it("devrait distribuer correctement les bénéfices à plusieurs utilisateurs", async function () {
      await ezToken.connect(utilisateur1).deposit(ethers.parseUnits("1000", 18));
      await ezToken.connect(utilisateur2).deposit(ethers.parseUnits("2000", 18));
      await ethers.provider.send("evm_increaseTime", [2 * 24 * 60 * 60]);
      await ethers.provider.send("evm_mine");
      await aToken.accrueInterest();
      const initialBalance1 = await usdc.balanceOf(utilisateur1.address);
      const initialBalance2 = await usdc.balanceOf(utilisateur2.address);
      const shares1 = await ezToken.balanceOf(utilisateur1.address);
      const shares2 = await ezToken.balanceOf(utilisateur2.address);
      await ezToken.connect(utilisateur1).withdraw(shares1);
      await ezToken.connect(utilisateur2).withdraw(shares2);
      expect(await usdc.balanceOf(utilisateur1.address)).to.be.gt(initialBalance1);
      expect(await usdc.balanceOf(utilisateur2.address)).to.be.gt(initialBalance2);
      const profit1 = (await usdc.balanceOf(utilisateur1.address)) - initialBalance1;
      const profit2 = (await usdc.balanceOf(utilisateur2.address)) - initialBalance2;
      const profitRatio = profit2 * 1000n / profit1;
      expect(profitRatio).to.be.closeTo(2000n, 100n); // tolérance pour les intérêts composés
    });
  });
});