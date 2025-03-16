//npx hardhat run scripts/test_yield_optimizer.js

const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

async function main() {
  // Déployer les contrats
  const TestToken = await ethers.getContractFactory("TestToken");
  const testToken = await TestToken.deploy();
  
  const AaveMock = await ethers.getContractFactory("AaveMock");
  const aaveMock = await AaveMock.deploy(testToken.getAddress());
  
  const CompoundMock = await ethers.getContractFactory("CompoundMock");
  const compoundMock = await CompoundMock.deploy(testToken.getAddress());
  
  const YieldOptimizer = await ethers.getContractFactory("YieldOptimizer");
  const yieldOptimizer = await YieldOptimizer.deploy(
    testToken.getAddress(),
    aaveMock.getAddress(),
    compoundMock.getAddress()
  );
  
  console.log("TestToken déployé à:", await testToken.getAddress());
  console.log("AaveMock déployé à:", await aaveMock.getAddress());
  console.log("CompoundMock déployé à:", await compoundMock.getAddress());
  console.log("YieldOptimizer déployé à:", await yieldOptimizer.getAddress());
  
  // Obtenir le signer
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  
  // Configuration des taux initiaux
  await aaveMock.setRate(500); // 5%
  await compoundMock.setRate(300); // 3%
  
  const aaveRate = await aaveMock.getCurrentRate();
  const compoundRate = await compoundMock.getSupplyRate();
  console.log("Taux Aave initial:", aaveRate.toString());
  console.log("Taux Compound initial:", compoundRate.toString());
  
  // Vérifier le protocole initial
  const initialProtocol = await yieldOptimizer.currentProtocol();
  console.log("Protocole initial:", initialProtocol === 0 ? "Aave" : "Compound");
  
  // Approuver les tokens
  await testToken.approve(yieldOptimizer.getAddress(), ethers.parseEther("1000"));
  
  // Dépôt dans l'optimiseur
  console.log("\nEffectuer un dépôt de 100 tokens...");
  await yieldOptimizer.deposit(ethers.parseEther("100"), signerAddress);
  
  // Vérifier les soldes
  const optimizerShares = await yieldOptimizer.balanceOf(signerAddress);
  console.log("Parts YieldOptimizer:", ethers.formatEther(optimizerShares));
  
  // Vérifier le protocole utilisé
  let currentProtocol = await yieldOptimizer.currentProtocol();
  console.log("Protocole actuel après dépôt:", currentProtocol === 0 ? "Aave" : "Compound");
  
  // Vérifier le solde dans Aave et Compound
  const aaveBalance = await aaveMock.convertToAssets(await aaveMock.balanceOf(yieldOptimizer.getAddress()));
  const compoundBalance = await compoundMock.convertToAssets(await compoundMock.balanceOf(yieldOptimizer.getAddress()));
  console.log("Solde dans Aave:", ethers.formatEther(aaveBalance));
  console.log("Solde dans Compound:", ethers.formatEther(compoundBalance));
  
  // Simuler un changement de taux
  console.log("\nMise à jour des taux (Compound devient meilleur)...");
  await aaveMock.setRate(200); // 2%
  await compoundMock.setRate(600); // 6%
  
  const newAaveRate = await aaveMock.getCurrentRate();
  const newCompoundRate = await compoundMock.getSupplyRate();
  console.log("Nouveau taux Aave:", newAaveRate.toString());
  console.log("Nouveau taux Compound:", newCompoundRate.toString());
  
  // Vérifier si le rebalancement est nécessaire
  const rebalanceNeeded = await yieldOptimizer.isRebalanceNeeded();
  console.log("Rebalancement nécessaire:", rebalanceNeeded);
  
  // Avancer dans le temps de 12 heures
  console.log("\nAvancement dans le temps de 12 heures...");
  await time.increase(12 * 60 * 60); // 12 heures en secondes
  
  // Vérifier à nouveau si le rebalancement est nécessaire
  const rebalanceNeededAfterTime = await yieldOptimizer.isRebalanceNeeded();
  console.log("Rebalancement nécessaire après 12h:", rebalanceNeededAfterTime);
  
  // Effectuer le rebalancement
  console.log("\nEffectuer le rebalancement...");
  await yieldOptimizer.rebalance();
  
  // Vérifier le nouveau protocole
  const newProtocol = await yieldOptimizer.currentProtocol();
  console.log("Nouveau protocole après rebalancement:", newProtocol === 0 ? "Aave" : "Compound");
  
  // Vérifier les nouveaux soldes
  const newAaveBalance = await aaveMock.convertToAssets(await aaveMock.balanceOf(yieldOptimizer.getAddress()));
  const newCompoundBalance = await compoundMock.convertToAssets(await compoundMock.balanceOf(yieldOptimizer.getAddress()));
  console.log("Nouveau solde dans Aave:", ethers.formatEther(newAaveBalance));
  console.log("Nouveau solde dans Compound:", ethers.formatEther(newCompoundBalance));
  
  // Effectuer un retrait
  console.log("\nRetrait de 50 tokens...");
  await yieldOptimizer.withdraw(ethers.parseEther("50"), signerAddress, signerAddress);
  
  // Vérifier le solde final
  const finalShares = await yieldOptimizer.balanceOf(signerAddress);
  console.log("Parts finales YieldOptimizer:", ethers.formatEther(finalShares));
  
  const finalTokenBalance = await testToken.balanceOf(signerAddress);
  console.log("Solde final en TestToken:", ethers.formatEther(finalTokenBalance));
  
  // Vérifier le total des actifs
  const totalAssets = await yieldOptimizer.totalAssets();
  console.log("Total des actifs dans YieldOptimizer:", ethers.formatEther(totalAssets));
}

// Exécuter le script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });