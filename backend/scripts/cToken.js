// scripts/cTokenScript.js
const { ethers, network } = require("hardhat");
const { expect } = require("chai");

async function main() {
  console.log("🚀 Déploiement et test du contrat cToken...");

  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("User1 address:", user1.address);
  console.log("User2 address:", user2.address);

  // 1. Déploiement du token USDC mintable (asset sous-jacent)
  console.log("\n📄 Déploiement du token USDC...");
  const initialSupply = ethers.parseUnits("1000000", 6); // 1 million USDC
  const USDC = await ethers.getContractFactory("MintableUSDC");
  const usdc = await USDC.deploy("USD Coin", "USDC", initialSupply);
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log(`✅ Token USDC déployé à l'adresse: ${usdcAddress}`);
  console.log(`   Supply initial: ${ethers.formatUnits(initialSupply, 6)} USDC`);

  // 2. Déploiement du token cToken (Aave-like)
  console.log("\n📄 Déploiement du token cToken...");
  const CToken = await ethers.getContractFactory("cToken");
  const cToken = await CToken.deploy(usdcAddress, "Comp USDC", "cUSDC");
  await cToken.waitForDeployment();
  const cTokenAddress = await cToken.getAddress();
  console.log(`✅ Token cToken déployé à l'adresse: ${cTokenAddress}`);

  // Donner les droits de mint au contrat cToken
  await usdc.transferOwnership(cTokenAddress);
  console.log("✅ Droits de mint transférés au contrat cToken");
 
  // 3. Configuration initiale
  console.log("\n⚙️ Configuration initiale...");
  
  // Définir le taux d'intérêt
  await cToken.setInterestRate(1000); // 10.00%
  console.log("✅ Taux d'intérêt configuré: 10.00%");
  
  // Distribuer des USDC aux utilisateurs
  const userAmount = ethers.parseUnits("10000", 6); // 10,000 USDC chacun
  await usdc.transfer(user1.address, userAmount);
  await usdc.transfer(user2.address, userAmount);
  console.log(`✅ ${ethers.formatUnits(userAmount, 6)} USDC transférés à user1 et user2`);
  
  // Approbations USDC pour les utilisateurs
  await usdc.connect(user1).approve(cTokenAddress, userAmount);
  await usdc.connect(user2).approve(cTokenAddress, userAmount);
  console.log("✅ Approbations USDC configurées pour user1 et user2");

  // 4. Tests fonctionnels
  console.log("\n🧪 Exécution des tests fonctionnels pour cToken...");

  // Test 1: Vérification des paramètres initiaux
  console.log("\n🔍 Test 1: Vérification des paramètres initiaux...");
  const interestRate = await cToken.interestRate();
  expect(interestRate).to.equal(1000);
  console.log("✅ Taux d'intérêt correctement configuré:", interestRate.toString());
  
  const assetAddress = await cToken.asset();
  expect(assetAddress).to.equal(usdcAddress);
  console.log("✅ Asset correctement référencé:", assetAddress);
  
  const cTokenOwner = await cToken.owner();
  expect(cTokenOwner).to.equal(deployer.address);
  console.log("✅ Propriétaire correctement configuré:", cTokenOwner);

  // Test 2: Dépôt d'USDC dans cToken
  console.log("\n🔍 Test 2: Dépôt d'USDC...");
  const depositAmount = ethers.parseUnits("1000", 6); // 1,000 USDC
  
  // Vérifier le solde avant dépôt
  const user1UsdcBefore = await usdc.balanceOf(user1.address);
  console.log(`☑️ Solde USDC de User1 avant dépôt: ${ethers.formatUnits(user1UsdcBefore, 6)}`);
  
  // Effectuer le dépôt
  const depositTx = await cToken.connect(user1).deposit(depositAmount, user1.address);
  await depositTx.wait();
  console.log(`☑️ User1 a déposé ${ethers.formatUnits(depositAmount, 6)} USDC`);
  
  // Vérifier les soldes après dépôt
  const user1UsdcAfter = await usdc.balanceOf(user1.address);
  console.log(`☑️ Solde USDC de User1 après dépôt: ${ethers.formatUnits(user1UsdcAfter, 6)}`);
  expect(user1UsdcAfter).to.equal(user1UsdcBefore - depositAmount);
  
  const cTokenBalance = await cToken.balanceOf(user1.address);
  console.log(`✅ User1 a reçu ${ethers.formatUnits(cTokenBalance, 18)} cTokens`);
  expect(cTokenBalance).to.be.gt(0);

  // Test 3: Accumulation d'intérêts
  console.log("\n🔍 Test 3: Accumulation d'intérêts...");
  
  // Vérifier les actifs totaux initiaux
  const initialTotalAssets = await cToken.totalAssets();
  console.log(`☑️ Total des actifs initiaux: ${ethers.formatUnits(initialTotalAssets, 6)} USDC`);
  
  // Simuler le passage du temps (30 jours)
  console.log("☑️ Simulation du passage du temps (30 jours)...");
  await network.provider.send("evm_increaseTime", [30 * 24 * 60 * 60]);
  await network.provider.send("evm_mine");
  
  // Accumuler les intérêts
  await cToken.accrueInterest();
  console.log("☑️ Intérêts accumulés via accrueInterest()");
  
  // Vérifier les actifs totaux après accumulation
  const finalTotalAssets = await cToken.totalAssets();
  console.log(`☑️ Total des actifs après intérêts: ${ethers.formatUnits(finalTotalAssets, 6)} USDC`);
  expect(finalTotalAssets).to.be.gt(initialTotalAssets);
  
  // Calcul approximatif des intérêts attendus
  const expectedInterest = initialTotalAssets * BigInt(10) * BigInt(30) / BigInt(36500); // ~10% sur 30 jours
  console.log(`✅ Intérêts générés: ${ethers.formatUnits(finalTotalAssets - initialTotalAssets, 6)} USDC`);
  console.log(`   (Estimation des intérêts attendus: ~${ethers.formatUnits(expectedInterest, 6)} USDC)`);


  // Test 4: Modification du taux d'intérêt...
  console.log("\n🔍 Test 4: Modification du taux d'intérêt...");
  const newRate = BigInt(1500); // 15.00% - convertir en BigInt

  // Changer le taux d'intérêt
  await cToken.connect(deployer).setInterestRate(newRate);
  
  // Vérifier le nouveau taux
  const updatedRate = await cToken.interestRate();
  expect(updatedRate).to.equal(newRate);
  console.log(`✅ Taux d'intérêt mis à jour à ${Number(updatedRate)/100}%`);
  
  // Test 5: Retrait d'USDC
  console.log("\n🔍 Test 5: Retrait d'USDC...");
  
  // Déterminer le montant de tokens cToken à racheter
  const redeemAmount = cTokenBalance / BigInt(2); // Racheter la moitié des tokens
  console.log(`☑️ User1 va racheter ${ethers.formatUnits(redeemAmount, 18)} cTokens`);
  
  // Solde USDC avant rachat
  const usdcBeforeRedeem = await usdc.balanceOf(user1.address);
  
  // Effectuer le rachat
  const redeemTx = await cToken.connect(user1).redeem(redeemAmount, user1.address, user1.address);
  await redeemTx.wait();
  
  // Vérifier les soldes après rachat
  const usdcAfterRedeem = await usdc.balanceOf(user1.address);
  const usdcReceived = usdcAfterRedeem - usdcBeforeRedeem;
  console.log(`✅ User1 a reçu ${ethers.formatUnits(usdcReceived, 6)} USDC en rachetant ses cTokens`);
  expect(usdcReceived).to.be.gt(0);
  
  const cTokenAfterRedeem = await cToken.balanceOf(user1.address);
  console.log(`✅ Solde cToken de User1 après rachat: ${ethers.formatUnits(cTokenAfterRedeem, 18)}`);
  expect(cTokenAfterRedeem).to.equal(cTokenBalance - redeemAmount);

  // Test 6: Test d'autorisation - seul le propriétaire peut modifier le taux
  console.log("\n🔍 Test 6: Test d'autorisation...");
  try {
    await cToken.connect(user1).setInterestRate(2000);
    console.log("❌ Test échoué: User1 a pu modifier le taux d'intérêt");
  } catch (error) {
    console.log("✅ Test réussi: User1 ne peut pas modifier le taux d'intérêt");
  }

  console.log("\n✅✅✅ Tous les tests ont été complétés avec succès! ✅✅✅");
  console.log("\n📄 Récapitulatif des contrats déployés:");
  console.log(`USDC: ${usdcAddress}`);
  console.log(`cToken: ${cTokenAddress}`);
}

// Exécution du script principal avec gestion des erreurs
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur lors du déploiement et des tests:");
    console.error(error);
    process.exit(1);
  });