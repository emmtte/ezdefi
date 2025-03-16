//npx hardhat run scripts/test_compound.js

const { ethers } = require("hardhat");

async function main() {
  // Déployer les contrats directement pour le test
  const TestToken = await ethers.getContractFactory("TestToken");
  const testToken = await TestToken.deploy();
  
  const CompoundMock = await ethers.getContractFactory("CompoundMock");
  const compoundMock = await CompoundMock.deploy(testToken.getAddress());
  
  console.log("TestToken déployé à:", await testToken.getAddress());
  console.log("CompoundMock déployé à:", await compoundMock.getAddress());
  
  // Obtenir le signer
  const [signer] = await ethers.getSigners();
  const signerAddress = await signer.getAddress();
  
  // Approbation des tokens
  await testToken.approve(await compoundMock.getAddress(), ethers.parseEther("100"));
  
  // Dépôt via mint
  await compoundMock.mint(ethers.parseEther("50"));
  
  // Vérification du taux
  const rate = await compoundMock.getSupplyRate();
  console.log("Taux d'intérêt actuel:", rate.toString());
  
  // Vérification du taux d'échange
  const exchangeRate = await compoundMock.exchangeRateCurrent();
  console.log("Taux d'échange actuel:", exchangeRate.toString());
  
  // Vérification des cTokens
  const cTokens = await compoundMock.balanceOf(signerAddress);
  console.log("cTokens détenus:", ethers.formatEther(cTokens));
  
  // Retrait via redeem (basé sur les cTokens)
  const halfCTokens = cTokens / 2n;
  await compoundMock.redeem(halfCTokens);
  
  // Vérification des cTokens après retrait
  const newCTokens = await compoundMock.balanceOf(signerAddress);
  console.log("cTokens détenus après redeem:", ethers.formatEther(newCTokens));
  
  // Retrait via redeemUnderlying (basé sur les actifs sous-jacents)
  await compoundMock.redeemUnderlying(ethers.parseEther("10"));
  
  // Vérification des cTokens après le second retrait
  const finalCTokens = await compoundMock.balanceOf(signerAddress);
  console.log("cTokens détenus après redeemUnderlying:", ethers.formatEther(finalCTokens));
}

// Exécuter le script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });