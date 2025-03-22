const { ethers } = require("hardhat");
const { expect } = require("chai");

async function main() {
  const [deployer, user1, user2] = await ethers.getSigners();

  console.log("=== Déploiement des contrats ===");
  
  console.log("Déploiement du token USDC mintable...");
  const MintableUSDC = await ethers.getContractFactory("MintableUSDC");
  const usdc = await MintableUSDC.deploy("USD Coin", "USDC", ethers.parseUnits("10000000", 6));
  console.log(`MintableUSDC déployé à: ${await usdc.getAddress()}`);

  console.log("Déploiement des vaults aToken et cToken...");
  const Vault = await ethers.getContractFactory("aToken");
  const aToken = await Vault.deploy(await usdc.getAddress(), "Aave USDC Vault", "aUSDC");
  const cToken = await Vault.deploy(await usdc.getAddress(), "Compound USDC Vault", "cUSDC");
  console.log(`aToken déployé à: ${await aToken.getAddress()}`);
  console.log(`cToken déployé à: ${await cToken.getAddress()}`);

  // Deploy YieldOptimizer
  const YieldOptimizer = await ethers.getContractFactory("YieldOptimizer");
  const yieldOptimizer = await YieldOptimizer.deploy(await usdc.getAddress(), [await aToken.getAddress(), await cToken.getAddress()]);
  console.log(`YieldOptimizer deployed to: ${await yieldOptimizer.getAddress()}`);
  
  console.log("Autorisation des contrats à mint/transferer des tokens USDC...");
  await usdc.addMinter(await aToken.getAddress());
  await usdc.addMinter(await cToken.getAddress());
  
  // Autoriser YieldOptimizer à interagir avec les vaults
  await aToken.approve(await yieldOptimizer.getAddress(), ethers.MaxUint256);
  await cToken.approve(await yieldOptimizer.getAddress(), ethers.MaxUint256);
  
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
  
  // Préparation des vaults avec des liquidités initiales (juste pour calculer les intérêts)
  console.log("Préparation des vaults avec des fonds initiaux pour simuler les intérêts...");
  await usdc.approve(await aToken.getAddress(), ethers.parseUnits("500", 6));
  await usdc.approve(await cToken.getAddress(), ethers.parseUnits("500", 6));
  await aToken.deposit(ethers.parseUnits("500", 6), deployer.address);
  await cToken.deposit(ethers.parseUnits("500", 6), deployer.address);
  
  console.log("Simulation d'une journée pour accumuler des intérêts...");
  await ethers.provider.send("evm_increaseTime", [1 * 24 * 60 * 60]);
  await ethers.provider.send("evm_mine");
  await aToken.accrueInterest();
  await cToken.accrueInterest();
  
  // Dépôt utilisateur dans l'optimizer
  console.log("Dépôt de user1 dans YieldOptimizer (devrait aller dans cToken)...");
  await yieldOptimizer.connect(user1).deposit(ethers.parseUnits("1000", 6));
  
  // Affichage des soldes
  console.log("\nSoldes après le dépôt initial:");
  console.log(`Solde total géré par l'optimizer: ${ethers.formatUnits(await yieldOptimizer.totalAssets(), 6)} USDC`);
  console.log(`Solde dans aToken: ${ethers.formatUnits(await aToken.totalAssets(), 6)} USDC`);
  console.log(`Solde dans cToken: ${ethers.formatUnits(await cToken.totalAssets(), 6)} USDC`);
  console.log(`Vault actuel de l'optimizer: ${await yieldOptimizer.currentVault()}`);
  console.log(`Shares de YieldOptimizer détenues par user1: ${ethers.formatUnits(await yieldOptimizer.balanceOf(user1.address), 18)}`);
  
  // Changement des taux d'intérêt pour le scénario 2
  console.log("\n=== Scénario 2: aToken devient plus rentable ===");
  await aToken.setInterestRate(3000); // 30%
  await cToken.setInterestRate(1500); // 15%
  
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
  console.log(`Solde total géré par l'optimizer: ${ethers.formatUnits(await yieldOptimizer.totalAssets(), 6)} USDC`);
  console.log(`Solde dans aToken: ${ethers.formatUnits(await aToken.totalAssets(), 6)} USDC`);
  console.log(`Solde dans cToken: ${ethers.formatUnits(await cToken.totalAssets(), 6)} USDC`);
  console.log(`Vault actuel de l'optimizer: ${await yieldOptimizer.currentVault()}`);
  console.log(`Parts de l'optimizer dans aToken: ${ethers.formatUnits(await aToken.balanceOf(await yieldOptimizer.getAddress()), 18)}`);
  console.log(`Parts de l'optimizer dans cToken: ${ethers.formatUnits(await cToken.balanceOf(await yieldOptimizer.getAddress()), 18)}`);
  
  // Changement des taux pour le scénario 3
  console.log("\n=== Scénario 3: cToken redevient plus rentable ===");
  await aToken.setInterestRate(1000); // 10%
  await cToken.setInterestRate(3500); // 35%
  
  // Nouvelle accumulation d'intérêts
  console.log("Simulation d'une accumulation d'intérêts pour cToken...");
  await ethers.provider.send("evm_increaseTime", [15 * 24 * 60 * 60]); // 15 jours
  await ethers.provider.send("evm_mine");
  await aToken.accrueInterest();
  await cToken.accrueInterest();
  
  // Deuxième rebalancement
  console.log("Rebalancement à nouveau vers cToken...");
  await yieldOptimizer.rebalance();
  
  // Affichage des soldes finaux
  console.log("\nSoldes finaux après le deuxième rebalancement:");
  console.log(`Solde total géré par l'optimizer: ${ethers.formatUnits(await yieldOptimizer.totalAssets(), 6)} USDC`);
  console.log(`Solde dans aToken: ${ethers.formatUnits(await aToken.totalAssets(), 6)} USDC`);
  console.log(`Solde dans cToken: ${ethers.formatUnits(await cToken.totalAssets(), 6)} USDC`);
  console.log(`Vault actuel de l'optimizer: ${await yieldOptimizer.currentVault()}`);
  console.log(`Parts de l'optimizer dans aToken: ${ethers.formatUnits(await aToken.balanceOf(await yieldOptimizer.getAddress()), 18)}`);
  console.log(`Parts de l'optimizer dans cToken: ${ethers.formatUnits(await cToken.balanceOf(await yieldOptimizer.getAddress()), 18)}`);
  
  // Test de retrait utilisateur
  console.log("\n=== Test de retrait utilisateur ===");
  const sharesBeforeWithdraw = await yieldOptimizer.balanceOf(user1.address);
  console.log(`Shares avant retrait: ${ethers.formatUnits(sharesBeforeWithdraw, 18)}`);

  // Récupération du solde USDC avant le retrait
  const usdcBalanceBeforeWithdraw = await usdc.balanceOf(user1.address);

  // Retrait partiel
  const withdrawAmount = sharesBeforeWithdraw / 2n;
  const txWithdraw = await yieldOptimizer.connect(user1).withdraw(withdrawAmount);
  await txWithdraw.wait();

  // Calculer le montant retiré en comparant les soldes USDC
  const usdcBalanceAfterWithdraw = await usdc.balanceOf(user1.address);
  const amountWithdrawn = usdcBalanceAfterWithdraw - usdcBalanceBeforeWithdraw;

  console.log(`Montant retiré: ${ethers.formatUnits(amountWithdrawn, 6)} USDC`);
  console.log(`Shares après retrait partiel: ${ethers.formatUnits(await yieldOptimizer.balanceOf(user1.address), 18)}`);
  
  // Second utilisateur dépose
  console.log("\n=== Dépôt d'un second utilisateur ===");
  await yieldOptimizer.connect(user2).deposit(ethers.parseUnits("2000", 6));
  console.log(`Solde total géré par l'optimizer: ${ethers.formatUnits(await yieldOptimizer.totalAssets(), 6)} USDC`);
  console.log(`Shares détenues par user2: ${ethers.formatUnits(await yieldOptimizer.balanceOf(user2.address), 18)}`);
  
  // Simulation de plus d'intérêts
  console.log("\n=== Simulation finale d'intérêts ===");
  await ethers.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]); // 30 jours
  await ethers.provider.send("evm_mine");
  await aToken.accrueInterest();
  await cToken.accrueInterest();
  
  // Valeurs finales
  console.log("\n=== États finaux ===");
  console.log(`Solde total géré par l'optimizer: ${ethers.formatUnits(await yieldOptimizer.totalAssets(), 6)} USDC`);
  console.log(`Valeur d'une share user1: ${ethers.formatUnits(await yieldOptimizer.totalAssets() * ethers.parseUnits("1", 18) / await yieldOptimizer.totalSupply(), 6)} USDC`);
  
  console.log("\n=== Test terminé avec succès ===");

  // Tests pour la fonction findBestVault
console.log("\n=== Tests de la fonction findBestVault ===");

// Test 1: Verification du vault initial avec les taux actuels
console.log("Test 1: Vérification du meilleur vault avec les taux actuels");
const bestVault1 = await yieldOptimizer.findBestVault();
console.log(`Le meilleur vault détecté est: ${bestVault1}`);
console.log(`Le vault actuel est: ${await yieldOptimizer.currentVault()}`);
console.log(`Les deux doivent correspondre: ${bestVault1 === await yieldOptimizer.currentVault() ? 'OK' : 'ERREUR'}`);

// Test 2: Changement des taux d'intérêt et vérification de la mise à jour
console.log("\nTest 2: Changement des taux et vérification de la mise à jour");
await aToken.setInterestRate(4000); // 40%
await cToken.setInterestRate(2000); // 20%
const bestVault2 = await yieldOptimizer.findBestVault();
console.log(`Taux aToken: 40%, Taux cToken: 20%`);
console.log(`Le meilleur vault détecté est: ${bestVault2}`);
console.log(`Doit être aToken (${await aToken.getAddress()}): ${bestVault2 === await aToken.getAddress() ? 'OK' : 'ERREUR'}`);

// Test 3: Inversion des taux
console.log("\nTest 3: Inversion des taux");
await aToken.setInterestRate(1000); // 10%
await cToken.setInterestRate(5000); // 50%
const bestVault3 = await yieldOptimizer.findBestVault();
console.log(`Taux aToken: 10%, Taux cToken: 50%`);
console.log(`Le meilleur vault détecté est: ${bestVault3}`);
console.log(`Doit être cToken (${await cToken.getAddress()}): ${bestVault3 === await cToken.getAddress() ? 'OK' : 'ERREUR'}`);

// Test 4: Taux égaux (en cas d'égalité, le premier vault dans la liste devrait être sélectionné)
console.log("\nTest 4: Taux égaux");
await aToken.setInterestRate(3000); // 30%
await cToken.setInterestRate(3000); // 30%
const bestVault4 = await yieldOptimizer.findBestVault();
console.log(`Taux aToken: 30%, Taux cToken: 30%`);
console.log(`Le meilleur vault détecté est: ${bestVault4}`);
console.log(`En cas d'égalité, le premier vault (${await aToken.getAddress()}) devrait être choisi: ${bestVault4 === await aToken.getAddress() ? 'OK' : 'ERREUR'}`);

// Test 5: Vérification avec rebalancement
console.log("\nTest 5: Vérification avec rebalancement");
await aToken.setInterestRate(6000); // 60%
await cToken.setInterestRate(2000); // 20%
console.log(`Taux aToken: 60%, Taux cToken: 20%`);
console.log(`Avant rebalancement, le vault actuel est: ${await yieldOptimizer.currentVault()}`);
console.log(`Le meilleur vault détecté est: ${await yieldOptimizer.findBestVault()}`);
await yieldOptimizer.rebalance();
console.log(`Après rebalancement, le vault actuel est: ${await yieldOptimizer.currentVault()}`);
console.log(`Doit être aToken (${await aToken.getAddress()}): ${await yieldOptimizer.currentVault() === await aToken.getAddress() ? 'OK' : 'ERREUR'}`);

// Restaurer les taux pour éviter d'interférer avec les tests suivants
await aToken.setInterestRate(1000); // 10%
await cToken.setInterestRate(3500); // 35%



}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });