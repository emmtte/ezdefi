const { ethers } = require("hardhat");

async function getAaveBalance(aaveMock, address) {
  const amount = await aaveMock.balanceOf(address);
  return ethers.formatEther(amount);
}

async function main() {
  const TestToken = await ethers.getContractFactory("contracts/TestToken.sol:TestToken");
  const testToken = await TestToken.deploy();
  await testToken.waitForDeployment();
  
  const AaveMock = await ethers.getContractFactory("AaveMock");
  const aaveMock = await AaveMock.deploy(await testToken.getAddress());
  await aaveMock.waitForDeployment();
  
  console.log("TestToken déployé à:", await testToken.getAddress());
  console.log("AaveMock déployé à:", await aaveMock.getAddress());
  
  // Obtenir le signer
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  
  // Approbation des tokens
  await testToken.approve(await aaveMock.getAddress(), ethers.parseEther("100"));
  let balance = await testToken.balanceOf(signerAddress);
  console.log("Balance de départ:", ethers.formatEther(balance));
  
  // Vérifier le taux initial
  let currentRate = await aaveMock.getCurrentRate();
  console.log("Taux actuel:", Number(currentRate) / 100, "%");
  
  // Dépôt
  console.log("Parts détenues:", await getAaveBalance(aaveMock, signerAddress));
  console.log("Depose 50:");
  await aaveMock.supply(ethers.parseEther("50"), signerAddress);
  console.log("Parts détenues après dépôt:", await getAaveBalance(aaveMock, signerAddress));
  
  // Obtenir la valeur des actifs dans le contrat
  const initialAssets = await aaveMock.totalAssets();
  console.log("Actifs initiaux dans le contrat:", ethers.formatEther(initialAssets));
  
  // Augmenter le taux d'intérêt
  console.log("\nAugmentation du taux à 20%");
  await aaveMock.setRate(2000); // 20%
  currentRate = await aaveMock.getCurrentRate();
  console.log("Nouveau taux:", Number(currentRate) / 100, "%");
  
  //await aaveMock.setRate(2000); // Même taux, mais cette action déclenche _updateInterest()
  
  // Vérifier les actifs après accumulation d'intérêts
  const assetsAfterInterest = await aaveMock.totalAssets();
  console.log("Actifs après accumulation d'intérêts:", ethers.formatEther(assetsAfterInterest));
  
  // Retrait partiel
  console.log("\nRetrait de 20 tokens:");
  await aaveMock.withdraw(ethers.parseEther("20"), signerAddress);
  console.log("Parts restantes:", await getAaveBalance(aaveMock, signerAddress));
  
  // Vérifier les actifs restants
  const assetsAfterWithdraw = await aaveMock.totalAssets();
  console.log("Actifs restants dans le contrat:", ethers.formatEther(assetsAfterWithdraw));
  
  // Calculer la valeur totale des parts restantes
  const userShares = await aaveMock.balanceOf(signerAddress);
  console.log("\nShares restantes:", ethers.formatEther(userShares));
  
  // Retirer tout le reste
  console.log("\nRetrait de toutes les parts restantes:");
  await aaveMock.redeem(userShares, signerAddress);
  
  // Vérifier qu'il ne reste plus de parts
  const finalShares = await aaveMock.balanceOf(signerAddress);
  console.log("Parts restantes:", ethers.formatEther(finalShares));
  
  // Vérifier la balance finale de tokens
  balance = await testToken.balanceOf(signerAddress);
  console.log("Balance finale après retrait complet:", ethers.formatEther(balance));
}

// Exécuter le script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });