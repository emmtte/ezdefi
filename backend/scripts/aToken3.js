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
  console.log(`Vault actuel de l'optimizer: ${await cToken.getInterestRate()} == 2000`);
  console.log(`Vault actuel de l'optimizer: ${await aToken.getInterestRate()} == 1000`);

  let bestVault = await yieldOptimizer.findBestVault()
  console.log(`Vault actuel de l'optimizer: ${bestVault}`);
  console.log(`Devrait etre egal à : ${await cToken.getAddress()}`);


 await aToken.setInterestRate(2000); // 10%
  await cToken.setInterestRate(1000); // 20%
  console.log(`Vault actuel de l'optimizer: ${await cToken.getInterestRate()} == 1000`);
  console.log(`Vault actuel de l'optimizer: ${await aToken.getInterestRate()} == 2000`);

  bestVault = await yieldOptimizer.findBestVault()
  console.log(`Vault actuel de l'optimizer: ${bestVault}`);
  console.log(`Devrait etre egal à : ${await aToken.getAddress()}`);

  await aToken.setInterestRate(1000); // 10%
  await cToken.setInterestRate(2000); // 20%
  
  bestVault = await yieldOptimizer.findBestVault()
  console.log(`Vault actuel de l'optimizer: ${bestVault}`);
  console.log(`Devrait etre egal à : ${await cToken.getAddress()}`);

  await aToken.setInterestRate(2000); // 10%
  await cToken.setInterestRate(1000); // 20%
  
  bestVault = await yieldOptimizer.findBestVault()
  console.log(`Vault actuel de l'optimizer: ${bestVault}`);
  console.log(`Devrait etre egal à : ${await aToken.getAddress()}`);


  let test1 = await cToken.getInterestRate();
  let test2 = await aToken.getInterestRate();

  

/*
  console.log("Simulation d'une journée pour accumuler des intérêts...");
  await ethers.provider.send("evm_increaseTime", [1 * 24 * 60 * 60]);
  await ethers.provider.send("evm_mine");
  await cToken.accrueInterest();
  */
  // Dépôt utilisateur dans l'optimizer
  console.log("Dépôt de user1 dans YieldOptimizer (devrait aller dans cToken)...");
  await yieldOptimizer.connect(user1).deposit(ethers.parseUnits("1000", 6));
  
  // Affichage des soldes
  console.log("\nSoldes après le dépôt initial:");
  console.log(`Solde dans aToken: ${ethers.formatUnits(await aToken.totalAssets(), 6)} USDC`);
  console.log(`Solde dans cToken: ${ethers.formatUnits(await cToken.totalAssets(), 6)} USDC`);



  console.log(`Shares de YieldOptimizer détenues par user1: ${ethers.formatUnits(await yieldOptimizer.balanceOf(user1.address), 18)}`);
  
  // Changement des taux d'intérêt pour le scénario 2
  
  
  
  console.log("Simulation d'une journée pour accumuler des intérêts...");
  await ethers.provider.send("evm_increaseTime", [1 * 24 * 60 * 60]);
  await ethers.provider.send("evm_mine");
  await cToken.accrueInterest();
  await aToken.accrueInterest();

  console.log(`Shares de YieldOptimizer détenues par user1: ${ethers.formatUnits(await yieldOptimizer.balanceOf(user1.address), 18)}`);
  
  console.log(`Solde dans aToken: ${ethers.formatUnits(await aToken.totalAssets(), 6)} USDC`);
  console.log(`Solde dans cToken: ${ethers.formatUnits(await cToken.totalAssets(), 6)} USDC`);
  console.log(`Solde dans yieldOptimizerToken: ${ethers.formatUnits(await yieldOptimizer.totalAssets(), 6)} USDC`);


console.log('________________________________________')


// After your existing code

console.log("\n=== Scénario 2: Test de la fonction redeem ===");
  
// Affichage des soldes avant le redeem
console.log("Soldes avant redeem:");
console.log(`Solde USDC de user1: ${ethers.formatUnits(await usdc.balanceOf(user1.address), 6)} USDC`);
console.log(`Shares de YieldOptimizer détenues par user1: ${ethers.formatUnits(await yieldOptimizer.balanceOf(user1.address), 18)}`);
console.log(`Solde dans yieldOptimizer: ${ethers.formatUnits(await yieldOptimizer.totalAssets(), 6)} USDC`);

// Redeem partiel (50% des shares)
const userShares = await yieldOptimizer.balanceOf(user1.address);
const withdrawAmount = userShares / 2n // 50% des shares

console.log(`\nRedeem partiel de ${ethers.formatUnits(withdrawAmount, 18)} shares (50%)...`);
let txWithdraw = await yieldOptimizer.connect(user1).withdraw(withdrawAmount);
await txWithdraw.wait();

// Affichage des soldes après le redeem partiel
console.log("\nSoldes après redeem partiel:");
console.log(`Solde USDC de user1: ${ethers.formatUnits(await usdc.balanceOf(user1.address), 6)} USDC`);
console.log(`Shares de YieldOptimizer détenues par user1: ${ethers.formatUnits(await yieldOptimizer.balanceOf(user1.address), 18)}`);
console.log(`Solde dans yieldOptimizer: ${ethers.formatUnits(await yieldOptimizer.totalAssets(), 6)} USDC`);

// Simulation d'une autre journée pour accumuler plus d'intérêts
console.log("\nSimulation d'une autre journée pour accumuler des intérêts...");
await ethers.provider.send("evm_increaseTime", [1 * 24 * 60 * 60]);
await ethers.provider.send("evm_mine");
await cToken.accrueInterest();
await aToken.accrueInterest();

// Test de rebalance après accumulation d'intérêts
console.log("\nTest de rebalance après accumulation d'intérêts");
await yieldOptimizer.rebalance();

console.log(`Solde dans aToken: ${ethers.formatUnits(await aToken.totalAssets(), 6)} USDC`);
console.log(`Solde dans cToken: ${ethers.formatUnits(await cToken.totalAssets(), 6)} USDC`);
console.log(`Solde dans yieldOptimizer: ${ethers.formatUnits(await yieldOptimizer.totalAssets(), 6)} USDC`);

// Redeem complet du reste des shares
const remainingShares = await yieldOptimizer.balanceOf(user1.address);

console.log(`\nRedeem complet de ${ethers.formatUnits(remainingShares, 18)} shares restantes...`);
txWithdraw = await yieldOptimizer.connect(user1).withdraw(remainingShares);
await txWithdraw.wait();
// Affichage des soldes finaux
console.log("\nSoldes finaux après redeem complet:");
console.log(`Solde USDC de user1: ${ethers.formatUnits(await usdc.balanceOf(user1.address), 6)} USDC`);
console.log(`Shares de YieldOptimizer détenues par user1: ${ethers.formatUnits(await yieldOptimizer.balanceOf(user1.address), 18)}`);
console.log(`Solde dans yieldOptimizer: ${ethers.formatUnits(await yieldOptimizer.totalAssets(), 6)} USDC`);

// Test avec un deuxième utilisateur
console.log("\n=== Scénario 3: Test avec un deuxième utilisateur ===");

// Dépôt de user2
console.log("Dépôt de user2 dans YieldOptimizer...");
await yieldOptimizer.connect(user2).deposit(ethers.parseUnits("2000", 6));

// Affichage des soldes après le dépôt
console.log("\nSoldes après le dépôt de user2:");
console.log(`Solde USDC de user2: ${ethers.formatUnits(await usdc.balanceOf(user2.address), 6)} USDC`);
console.log(`Shares de YieldOptimizer détenues par user2: ${ethers.formatUnits(await yieldOptimizer.balanceOf(user2.address), 18)}`);
console.log(`Solde dans yieldOptimizer: ${ethers.formatUnits(await yieldOptimizer.totalAssets(), 6)} USDC`);

// Simulation d'une journée supplémentaire
console.log("\nSimulation d'une journée supplémentaire...");
await ethers.provider.send("evm_increaseTime", [1 * 24 * 60 * 60]);
await ethers.provider.send("evm_mine");
await cToken.accrueInterest();
await aToken.accrueInterest();

// Changement du meilleur vault
console.log("\nChangement du meilleur vault (aToken devient le meilleur)...");
await aToken.setInterestRate(3000); // 30%
await cToken.setInterestRate(1500); // 15%

bestVault = await yieldOptimizer.findBestVault();
console.log(`Meilleur vault: ${bestVault}`);
console.log(`Devrait être égal à: ${await aToken.getAddress()}`);

console.log("\n-------------------------------------...");

console.log(`Solde dans aToken: ${ethers.formatUnits(await aToken.totalAssets(), 6)} USDC`);
console.log(`Solde dans cToken: ${ethers.formatUnits(await cToken.totalAssets(), 6)} USDC`);

// Rebalance pour déplacer les fonds vers le meilleur vault
console.log("\nRebalance pour déplacer les fonds vers aToken...");
await yieldOptimizer.rebalance();

console.log(`Solde dans aToken: ${ethers.formatUnits(await aToken.totalAssets(), 6)} USDC`);
console.log(`Solde dans cToken: ${ethers.formatUnits(await cToken.totalAssets(), 6)} USDC`);

// Redeem total pour user2
console.log("\nRedeem total pour user2...");
const user2Shares = await yieldOptimizer.balanceOf(user2.address);
txWithdraw = await yieldOptimizer.connect(user2).withdraw(user2Shares);
await txWithdraw.wait();
// Affichage des soldes finaux
console.log("\nSoldes finaux après tous les tests:");
console.log(`Solde USDC de user1: ${ethers.formatUnits(await usdc.balanceOf(user1.address), 6)} USDC`);
console.log(`Solde USDC de user2: ${ethers.formatUnits(await usdc.balanceOf(user2.address), 6)} USDC`);
console.log(`Solde dans aToken: ${ethers.formatUnits(await aToken.totalAssets(), 6)} USDC`);
console.log(`Solde dans cToken: ${ethers.formatUnits(await cToken.totalAssets(), 6)} USDC`);
console.log(`Solde total dans yieldOptimizer: ${ethers.formatUnits(await yieldOptimizer.totalAssets(), 6)} USDC`);

// Vérification que le gain d'intérêts a été correctement appliqué
console.log("\nVérification des gains d'intérêts:");
console.log(`Solde USDC initial de user1: 10000 USDC (moins 1000 déposés)`);
console.log(`Solde USDC initial de user2: 10000 USDC (moins 2000 déposés)`);
console.log(`Solde USDC final de user1: ${ethers.formatUnits(await usdc.balanceOf(user1.address), 6)} USDC`);
console.log(`Solde USDC final de user2: ${ethers.formatUnits(await usdc.balanceOf(user2.address), 6)} USDC`);

// Calcul des gains
const user1InitialBalance = ethers.parseUnits("10000", 6) - (ethers.parseUnits("1000", 6));
const user1FinalBalance = await usdc.balanceOf(user1.address);
const user1Profit = user1FinalBalance - user1InitialBalance

const user2InitialBalance = ethers.parseUnits("10000", 6) - (ethers.parseUnits("2000", 6));
const user2FinalBalance = await usdc.balanceOf(user2.address);
const user2Profit = user2FinalBalance - user2InitialBalance

console.log(`Gain de user1: ${ethers.formatUnits(user1Profit, 6)} USDC`);
console.log(`Gain de user2: ${ethers.formatUnits(user2Profit, 6)} USDC`);














}

// Exécution du script principal avec gestion des erreurs
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur lors du déploiement et des tests:");
    console.error(error);
    process.exit(1);
  });