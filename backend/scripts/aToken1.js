const { ethers } = require("hardhat");
const { expect } = require("chai");

async function main() {
  const [deployer, user1, user2] = await ethers.getSigners();

  console.log("=== Déploiement des contrats ===");
  
  console.log("Déploiement du token USDC mintable...");
  const MintableUSDC = await ethers.getContractFactory("MintableUSDC");
  const usdc = await MintableUSDC.deploy("USD Coin", "USDC", ethers.parseUnits("10000000", 18));
  console.log(`MintableUSDC déployé à: ${await usdc.getAddress()}`);

  console.log("Déploiement des vaults aToken et cToken...");
  const Vault = await ethers.getContractFactory("aToken");
  const aToken = await Vault.deploy(await usdc.getAddress(), "Aave USDC Vault", "aUSDC");
  const cToken = await Vault.deploy(await usdc.getAddress(), "Compound USDC Vault", "cUSDC");
  console.log(`aToken déployé à: ${await aToken.getAddress()}`);
  console.log(`cToken déployé à: ${await cToken.getAddress()}`);

  // Deploy YieldOptimizer with updated contract
  const YieldOptimizer = await ethers.getContractFactory("YieldOptimizer");
  const yieldOptimizer = await YieldOptimizer.deploy(await usdc.getAddress(), [await aToken.getAddress(), await cToken.getAddress()]);
  console.log(`YieldOptimizer deployed to: ${await yieldOptimizer.getAddress()}`);
  
  console.log("Autorisation des vaults à mint des tokens USDC...");
  await usdc.addMinter(await aToken.getAddress());
  await usdc.addMinter(await cToken.getAddress());
  
  // Distribution des tokens aux utilisateurs
  console.log("Distribution de tokens aux utilisateurs de test...");
  await usdc.transfer(user1.address, ethers.parseUnits("10000", 6));
  await usdc.transfer(user2.address, ethers.parseUnits("10000", 6));
  
  // Approbation pour les opérations
  await usdc.connect(user1).approve(await yieldOptimizer.getAddress(), ethers.parseUnits("10000", 6));
  await usdc.connect(user2).approve(await yieldOptimizer.getAddress(), ethers.parseUnits("10000", 6));
  
  // Configuration initiale des taux d'intérêt
  console.log("\n=== Scénario 1: cToken a un meilleur rendement ===");
  await aToken.setInterestRate(1000); // 10%
  await cToken.setInterestRate(2000); // 20%
  
  let test1 = await cToken.getInterestRate();
  let test2 = await aToken.getInterestRate();

  console.log({test1, test2})


  // Préparation des vaults
  console.log("Préparation des vaults avec des fonds initiaux...");
  await usdc.approve(await cToken.getAddress(), ethers.parseUnits("1000", 6));
  await cToken.deposit(ethers.parseUnits("1000", 6), deployer.address);
  
  console.log("Simulation d'une journée pour accumuler des intérêts...");
  await ethers.provider.send("evm_increaseTime", [1 * 24 * 60 * 60]);
  await ethers.provider.send("evm_mine");
  await cToken.accrueInterest();
  
  // Dépôt utilisateur dans l'optimizer
  console.log("Dépôt de user1 dans YieldOptimizer (devrait aller dans cToken)...");
  await yieldOptimizer.connect(user1).deposit(ethers.parseUnits("1000", 6));
  
  // Affichage des soldes
  console.log("\nSoldes après le dépôt initial:");
  console.log(`Solde dans aToken: ${ethers.formatUnits(await aToken.totalAssets(), 6)} USDC`);
  console.log(`Solde dans cToken: ${ethers.formatUnits(await cToken.totalAssets(), 6)} USDC`);
  console.log(`Vault actuel de l'optimizer: ${await yieldOptimizer.currentVault()}`);
  console.log(`Shares de YieldOptimizer détenues par user1: ${ethers.formatUnits(await yieldOptimizer.balanceOf(user1.address), 18)}`);
  
  // Changement des taux d'intérêt pour le scénario 2
  console.log("\n=== Scénario 2: aToken devient plus rentable ===");
  await aToken.setInterestRate(3000); // 30%
  await cToken.setInterestRate(1500); // 15%
  
  // Seed aToken pour les intérêts
  console.log("Ajout de fonds dans aToken pour simuler des intérêts...");
  await usdc.approve(await aToken.getAddress(), ethers.parseUnits("500", 6));
  await aToken.deposit(ethers.parseUnits("500", 6), deployer.address);
  
  // Simulation de l'accumulation d'intérêts
  console.log("Simulation d'une accumulation d'intérêts...");
  await ethers.provider.send("evm_increaseTime", [10 * 24 * 60 * 60]); // 10 jours
  await ethers.provider.send("evm_mine");
  await aToken.accrueInterest();
  await cToken.accrueInterest();
  
  // Premier rebalancement
  console.log("Rebalancement vers aToken qui est maintenant plus rentable...");
  await yieldOptimizer.rebalance();
  
  // Affichage des soldes après rebalancement
  console.log("\nSoldes après le premier rebalancement:");
  console.log(`Solde dans aToken: ${ethers.formatUnits(await aToken.totalAssets(), 6)} USDC`);
  console.log(`Solde dans cToken: ${ethers.formatUnits(await cToken.totalAssets(), 6)} USDC`);
  console.log(`Vault actuel de l'optimizer: ${await yieldOptimizer.currentVault()}`);
  console.log(`Parts de l'optimizer dans aToken: ${ethers.formatUnits(await aToken.balanceOf(await yieldOptimizer.getAddress()), 18)}`);
  console.log(`Parts de l'optimizer dans cToken: ${ethers.formatUnits(await cToken.balanceOf(await yieldOptimizer.getAddress()), 18)}`);
  
}

// Exécution du script principal avec gestion des erreurs
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur lors du déploiement et des tests:");
    console.error(error);
    process.exit(1);
  });