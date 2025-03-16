const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MintableUSDC", function () {
  let MintableUSDC, mintableUSDC;
  let deployer, utilisateur;
  let initialSupply;

  beforeEach(async function () {
    // Récupération des signers
    [deployer, utilisateur] = await ethers.getSigners();
    
    // Déploiement du token USDC
    initialSupply = ethers.parseUnits("1000000", 18); // 1 million de tokens
    MintableUSDC = await ethers.getContractFactory("MintableUSDC");
    mintableUSDC = await MintableUSDC.deploy("USD Coin", "USDC", initialSupply);
  });

  describe("Déploiement", function () {
    it("Devrait déployer le contrat correctement", async function () {
      expect(await mintableUSDC.getAddress()).to.be.properAddress;
    });

    it("Devrait attribuer l'offre initiale totale au deployer", async function () {
      const deployerBalance = await mintableUSDC.balanceOf(deployer.address);
      expect(deployerBalance).to.equal(initialSupply);
    });

    it("Devrait définir correctement le nom et le symbole", async function () {
      expect(await mintableUSDC.name()).to.equal("USD Coin");
      expect(await mintableUSDC.symbol()).to.equal("USDC");
    });
  });

  describe("Transactions", function () {
    it("Devrait permettre des transferts entre comptes", async function () {
      // Transfert de tokens
      const montant = ethers.parseUnits("100", 18);
      await mintableUSDC.transfer(utilisateur.address, montant);
      
      // Vérification des soldes
      const soldeUtilisateur = await mintableUSDC.balanceOf(utilisateur.address);
      expect(soldeUtilisateur).to.equal(montant);
      
      const soldeDeployer = await mintableUSDC.balanceOf(deployer.address);
      expect(soldeDeployer).to.equal(initialSupply - montant);
    });
  });

  describe("Fonctions de mint", function () {
    it("Devrait permettre au propriétaire de mint de nouveaux tokens", async function () {
      const montantMint = ethers.parseUnits("1000", 18);
      await mintableUSDC.mint(utilisateur.address, montantMint);
      
      // Vérifier que l'utilisateur a reçu les tokens
      const soldeUtilisateur = await mintableUSDC.balanceOf(utilisateur.address);
      expect(soldeUtilisateur).to.equal(montantMint);
      
      // Vérifier que l'offre totale a augmenté
      const offreTotale = await mintableUSDC.totalSupply();
      expect(offreTotale).to.equal(initialSupply + montantMint);
    });

    it("Ne devrait pas permettre à un non-propriétaire de mint des tokens", async function () {
      const montantMint = ethers.parseUnits("1000", 18);
      
      // Tentative de mint par un non-propriétaire
      await expect(
        mintableUSDC.connect(utilisateur).mint(utilisateur.address, montantMint)
      ).to.be.revertedWithCustomError(mintableUSDC, "OwnableUnauthorizedAccount");
    });
  });

  describe("Transfert de propriété", function () {
    it("Devrait permettre de transférer la propriété", async function () {
      // Transfert de la propriété à l'utilisateur
      await mintableUSDC.transferOwnership(utilisateur.address);
      
      // Vérifier que l'utilisateur est maintenant le propriétaire
      expect(await mintableUSDC.owner()).to.equal(utilisateur.address);
    });

    it("Devrait permettre au nouveau propriétaire de mint des tokens", async function () {
      // Transfert de la propriété à l'utilisateur
      await mintableUSDC.transferOwnership(utilisateur.address);
      
      // Mint de tokens par le nouveau propriétaire
      const montantMint = ethers.parseUnits("500", 18);
      await mintableUSDC.connect(utilisateur).mint(utilisateur.address, montantMint);
      
      // Vérifier que les tokens ont été créés
      const soldeUtilisateur = await mintableUSDC.balanceOf(utilisateur.address);
      expect(soldeUtilisateur).to.equal(montantMint);
    });
  });
});