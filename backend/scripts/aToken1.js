const { ethers } = require("hardhat");

async function main() {
  // Déploiement du token USDC mintable
  console.log("Déploiement du token USDC mintable...");
  const initialSupply = ethers.parseUnits("1000000", 18); // 1 million de tokens
  const MintableUSDC = await ethers.getContractFactory("MintableUSDC");
  const mintableUSDC = await MintableUSDC.deploy("USD Coin", "USDC", initialSupply);
  console.log(`MintableUSDC déployé à l'adresse: ${await mintableUSDC.getAddress()}`);
  
  // Déploiement du SimpleCompoundVault
  console.log("Déploiement du contrat SimpleCompoundVault...");
  const AToken = await ethers.getContractFactory("aToken");
  const aToken = await AToken.deploy(
    await mintableUSDC.getAddress(),
    "Compound USDC Vault",
    "cUSDC"
  );
  console.log(`SimpleCompoundVault déployé à l'adresse: ${await aToken.getAddress()}`);
  
  // Paramètres de test
  const [deployer, utilisateur] = await ethers.getSigners();
  const montantDepot = ethers.parseUnits("1000", 18); // 1000 USDC
  
  // Donne les droits de mint au vault
  await mintableUSDC.transferOwnership(await aToken.getAddress());
  console.log(`Droits de mint transférés au vault: ${await aToken.getAddress()}`);
  
  // Définir un taux d'intérêt plus élevé pour le test (30% annuel)
  await aToken.setInterestRate(3000); // 30.00%
  console.log("Taux d'intérêt défini à 30.00% pour accélérer le test");
  
  // 1. Transfert d'USDC à l'utilisateur
  console.log(`Transfert de ${ethers.formatUnits(montantDepot, 18)} USDC à l'utilisateur...`);
  await mintableUSDC.transfer(utilisateur.address, montantDepot);
  const soldeInitial = await mintableUSDC.balanceOf(utilisateur.address);
  console.log(`Solde initial USDC de l'utilisateur: ${ethers.formatUnits(soldeInitial, 18)}`);
  
  // 2. Approbation pour le dépôt dans le vault
  console.log("Approbation du vault pour dépenser les USDC...");
  await mintableUSDC.connect(utilisateur).approve(
    await aToken.getAddress(), 
    montantDepot
  );
  
  // 3. Dépôt dans le vault
  console.log(`Dépôt de ${ethers.formatUnits(montantDepot, 18)} USDC dans le vault...`);
  await aToken.connect(utilisateur).deposit(montantDepot, utilisateur.address);
  
  // Vérification du dépôt
  const sharesUtilisateur = await aToken.balanceOf(utilisateur.address);
  console.log(`Parts reçues par l'utilisateur: ${ethers.formatUnits(sharesUtilisateur, 18)}`);
  
  // 4. Simulation de passage du temps (pour accumuler des intérêts)
  console.log("Simulation du passage du temps pour générer des intérêts...");
  
  // Avance le temps de 30 jours (en secondes)
  const tempsEcoule = 30 * 24 * 60 * 60; // 30 jours en secondes
  
  // Simuler le passage du temps
  await ethers.provider.send("evm_increaseTime", [tempsEcoule]);
  await ethers.provider.send("evm_mine"); // Mine un nouveau bloc pour que le changement de temps prenne effet
  
  // 5. Vérification des intérêts accumulés (sans retrait)
  await aToken.accrueInterest(); // Force l'accumulation d'intérêts
  
  const valeurAvantRetrait = await aToken.convertToAssets(sharesUtilisateur);
  console.log(`Valeur actuelle des parts après 30 jours: ${ethers.formatUnits(valeurAvantRetrait, 18)} USDC`);
  console.log(`Intérêts accumulés: ${ethers.formatUnits(valeurAvantRetrait - montantDepot, 18)} USDC`);
  
  // 6. Retrait du vault par l'utilisateur
  console.log(`Retrait de toutes les parts (${ethers.formatUnits(sharesUtilisateur, 18)}) du vault...`);
  await aToken.connect(utilisateur).redeem(
    sharesUtilisateur, 
    utilisateur.address, 
    utilisateur.address
  );
  
  // Vérification du solde final après retrait
  const soldeFinal = await mintableUSDC.balanceOf(utilisateur.address);
  console.log(`Solde final USDC de l'utilisateur: ${ethers.formatUnits(soldeFinal, 18)}`);
  console.log(`Gain total: ${ethers.formatUnits(soldeFinal - soldeInitial, 18)} USDC`);
  
  console.log("Test terminé avec succès!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });