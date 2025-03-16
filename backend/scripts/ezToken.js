// scripts/ezScript.js
const { ethers, network } = require("hardhat");
const { expect } = require("chai");

async function main() {
  console.log("🚀 Déploiement et test du système EZdefi...");

  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("Deployer address:", deployer.address);
  console.log("User1 address:", user1.address);
  console.log("User2 address:", user2.address);

  // 1. Déploiement du token USDC mintable
  console.log("\n📄 Déploiement du token USDC...");
  const initialSupply = ethers.parseUnits("1000000", 6); // 1 million USDC
  const USDC = await ethers.getContractFactory("MintableUSDC");
  const usdc = await USDC.deploy("USD Coin", "USDC", initialSupply);
  await usdc.waitForDeployment();
  const usdcAddress = await usdc.getAddress();
  console.log(`✅ Token USDC déployé à l'adresse: ${usdcAddress}`);
  console.log(`   Supply initial: ${ethers.formatUnits(initialSupply, 6)} USDC`);

  // 2. Déploiement du token aToken (Aave-like)
  console.log("\n📄 Déploiement du token aToken (Aave)...");
  const AToken = await ethers.getContractFactory("aToken");
  const aToken = await AToken.deploy(usdcAddress, "Aave USDC", "aUSDC");
  await aToken.waitForDeployment();
  const aTokenAddress = await aToken.getAddress();
  console.log(`✅ Token aToken déployé à l'adresse: ${aTokenAddress}`);
  
  // 3. Déploiement du token cToken (Compound-like)
  console.log("\n📄 Déploiement du token cToken (Compound)...");
  const CToken = await ethers.getContractFactory("aToken"); // On utilise le même contrat mais avec un nom différent
  const cToken = await CToken.deploy(usdcAddress, "Compound USDC", "cUSDC");
  await cToken.waitForDeployment();
  const cTokenAddress = await cToken.getAddress();
  console.log(`✅ Token cToken déployé à l'adresse: ${cTokenAddress}`);

  // 4. Déploiement du contrat EZdefi
  console.log("\n📄 Déploiement du contrat EZdefi...");
  const EZdefi = await ethers.getContractFactory("EZdefi");
  const ezdefi = await EZdefi.deploy(
    usdcAddress,
    aTokenAddress,
    cTokenAddress
  );
  await ezdefi.waitForDeployment();
  const ezdefiAddress = await ezdefi.getAddress();
  console.log(`✅ Contrat EZdefi déployé à l'adresse: ${ezdefiAddress}`);

  // 5. Configuration des taux d'intérêt initiaux
  console.log("\n⚙️ Configuration des taux d'intérêt...");
  await aToken.setInterestRate(1000); // 10.00% pour aToken
  console.log("✅ aToken taux configuré: 10.00%");
  await cToken.setInterestRate(800);  // 8.00% pour cToken
  console.log("✅ cToken taux configuré: 8.00%");

  // 6. Distribution de tokens USDC aux utilisateurs de test
  console.log("\n💰 Distribution de tokens USDC aux utilisateurs...");
  const userAmount = ethers.parseUnits("10000", 6); // 10,000 USDC chacun
  await usdc.transfer(user1.address, userAmount);
  await usdc.transfer(user2.address, userAmount);
  console.log(`✅ ${ethers.formatUnits(userAmount, 6)} USDC transférés à user1`);
  console.log(`✅ ${ethers.formatUnits(userAmount, 6)} USDC transférés à user2`);

  // 7. Approbation des dépenses pour les utilisateurs
  console.log("\n🔐 Configuration des approbations...");
  await usdc.connect(user1).approve(ezdefiAddress, userAmount);
  await usdc.connect(user2).approve(ezdefiAddress, userAmount);
  console.log("✅ Approbations configurées pour user1 et user2");

  // 8. Autorisations pour USDC de minter (pour simuler les intérêts)
  await usdc.approve(aTokenAddress, ethers.parseUnits("1000000", 6));
  await usdc.approve(cTokenAddress, ethers.parseUnits("1000000", 6));
  console.log("✅ Autorisations de mint configurées pour aToken et cToken");

  // 9. Tests fonctionnels
  console.log("\n🧪 Exécution des tests fonctionnels...");

  // Test 1: Vérification des propriétaires et références
  console.log("\n🔍 Test 1: Vérification des références...");
  const ezdefiOwner = await ezdefi.owner();
  expect(ezdefiOwner).to.equal(deployer.address);
  console.log("✅ Le déployeur est bien le propriétaire d'EZdefi");

  // Utilisation correcte pour accéder aux variables d'état publiques
  const ezdefiUsdcRef = await ezdefi.usdc();
  const ezdefiATokenRef = await ezdefi.aToken();
  const ezdefiCTokenRef = await ezdefi.cToken();
  
  expect(ezdefiUsdcRef).to.equal(usdcAddress);
  expect(ezdefiATokenRef).to.equal(aTokenAddress);
  expect(ezdefiCTokenRef).to.equal(cTokenAddress);
  console.log("✅ Les références aux contrats sont correctes");

  // Test 2: Détermination du meilleur protocole
  console.log("\n🔍 Test 2: Détermination du meilleur protocole...");
  const bestProtocol = await ezdefi.getBestProtocol();
  expect(bestProtocol).to.equal(aTokenAddress);
  console.log(`✅ Le meilleur protocole est bien aToken (taux: 10.00%)`);

  // Test 3: Allocation des fonds
  console.log("\n🔍 Test 3: Allocation des fonds...");
  const allocAmount = ethers.parseUnits("1000", 6);
  // Transfert de USDC vers le contrat EZdefi
  await usdc.transfer(ezdefiAddress, allocAmount);
  console.log(`☑️ ${ethers.formatUnits(allocAmount, 6)} USDC transférés à EZdefi`);
  
  // Allocation vers aToken
  const allocTx = await ezdefi.allocateFunds(aTokenAddress, allocAmount);
  await allocTx.wait();
  console.log(`☑️ Allocation des fonds vers aToken effectuée`);
  
  // Vérification
  const currentProtocol = await ezdefi.currentProtocol();
  expect(currentProtocol).to.equal(aTokenAddress);
  console.log("✅ Le protocole courant est bien aToken");
  
  const aTokenBalance = await aToken.balanceOf(ezdefiAddress);
  expect(aTokenBalance).to.be.gt(0);
  console.log(`✅ EZdefi détient maintenant ${ethers.formatUnits(aTokenBalance, 6)} aTokens`);

  // Test 4: Dépôt d'un utilisateur
  console.log("\n🔍 Test 4: Dépôt utilisateur...");
  const depositAmount = ethers.parseUnits("500", 6);
  const depositTx = await ezdefi.connect(user1).deposit(depositAmount, user1.address);
  await depositTx.wait();
  console.log(`☑️ User1 a déposé ${ethers.formatUnits(depositAmount, 6)} USDC`);
  
  const user1Shares = await ezdefi.balanceOf(user1.address);
  console.log(`✅ User1 détient maintenant ${ethers.formatUnits(user1Shares, 18)} parts d'EZdefi`);

  // Test 5: Simulation d'intérêts
  console.log("\n🔍 Test 5: Simulation d'intérêts...");
  console.log("☑️ Appel de accrueInterest sur aToken pour simuler le passage du temps...");
  await aToken.accrueInterest();
  
  const totalAssets = await ezdefi.totalAssets();
  console.log(`✅ Total des actifs après intérêts: ${ethers.formatUnits(totalAssets, 6)} USDC`);

  // Test 6: Changement de taux et rééquilibrage
  console.log("\n🔍 Test 6: Rééquilibrage...");
  console.log("☑️ Modification des taux d'intérêt...");
  await aToken.setInterestRate(500); // 5.00%
  await cToken.setInterestRate(1200); // 12.00%
  console.log("✅ Nouveaux taux: aToken = 5.00%, cToken = 12.00%");
  
  // On avance le temps pour permettre le rééquilibrage (12h)
  console.log("☑️ Avancement du temps de 12 heures...");
  await network.provider.send("evm_increaseTime", [12 * 60 * 60]);
  await network.provider.send("evm_mine");
  
  // Rééquilibrage
  console.log("☑️ Appel de la fonction rebalance...");
  const rebalanceTx = await ezdefi.rebalance();
  await rebalanceTx.wait();
  
  // Vérification du nouveau protocole
  const newProtocol = await ezdefi.currentProtocol();
  expect(newProtocol).to.equal(cTokenAddress);
  console.log("✅ Le protocole a bien été changé pour cToken");

  // Test 7: Retrait d'un utilisateur
  console.log("\n🔍 Test 7: Retrait utilisateur...");
  const usdcBeforeWithdraw = await usdc.balanceOf(user1.address);
  console.log(`☑️ Solde USDC de User1 avant retrait: ${ethers.formatUnits(usdcBeforeWithdraw, 6)}`);
  
  // Retrait de toutes les parts
  console.log(`☑️ User1 retire toutes ses parts (${ethers.formatUnits(user1Shares, 18)})`);
  const withdrawTx = await ezdefi.connect(user1).redeem(user1Shares, user1.address, user1.address);
  await withdrawTx.wait();
  
  const usdcAfterWithdraw = await usdc.balanceOf(user1.address);
  console.log(`✅ Solde USDC de User1 après retrait: ${ethers.formatUnits(usdcAfterWithdraw, 6)}`);
  const difference = usdcAfterWithdraw - usdcBeforeWithdraw;
  console.log(`✅ User1 a reçu ${ethers.formatUnits(difference, 6)} USDC`);

  console.log("\n✅✅✅ Tous les tests ont été complétés avec succès! ✅✅✅");
  console.log("\n📄 Récapitulatif des contrats déployés:");
  console.log(`USDC: ${usdcAddress}`);
  console.log(`aToken: ${aTokenAddress}`);
  console.log(`cToken: ${cTokenAddress}`);
  console.log(`EZdefi: ${ezdefiAddress}`);
}

// Exécution du script principal avec gestion des erreurs
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur lors du déploiement et des tests:");
    console.error(error);
    process.exit(1);
  });