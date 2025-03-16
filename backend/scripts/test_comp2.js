// scripts/test_advanced_comp.js
const { ethers } = require("hardhat");

async function main() {
  // Déploiement du token USDC mintable
  console.log("Déploiement du token USDC mintable...");
  // Note: ethers v6 utilise parseUnits au lieu de parseEther
  const initialSupply = ethers.parseUnits("1000000", 18); // 1 million de tokens
  const MintableUSDC = await ethers.getContractFactory("MintableUSDC");
  const mintableUSDC = await MintableUSDC.deploy("USD Coin", "USDC", initialSupply);
  // await mintableUSDC.deployed(); // Cette syntaxe est pour ethers v5
  //await MintableUSDC.waitForDeployment();
  console.log(`MintableUSDC déployé à l'adresse: ${await mintableUSDC.getAddress()}`);
  
  // Déploiement du AdvancedCompoundERC4626
  console.log("Déploiement du contrat AdvancedCompoundERC4626...");
  const AdvancedCompound = await ethers.getContractFactory("AdvancedCompoundERC4626");
  const advancedCompound = await AdvancedCompound.deploy(
    await mintableUSDC.getAddress(),
    "Compound USDC Vault",
    "cUSDC"
  );
  //await AdvancedCompound.waitForDeployment();
  // await advancedCompound.deployed(); // Cette syntaxe est pour ethers v5
  console.log(`AdvancedCompound déployé à l'adresse: ${await advancedCompound.getAddress()}`);
  
  // Paramètres de test
  const [deployer, utilisateur] = await ethers.getSigners();
  const montantDepot = ethers.parseUnits("1000", 18); // 1000 USDC
  
  // ⚠️ Ne pas transférer la propriété de l'USDC au contrat Compound
  // car seul le Compound doit pouvoir mint, pas devenir owner du token
  // Nous allons donner le droit de mint au contrat Compound tout en gardant la propriété
  console.log("Attribution des droits de minting au contrat Compound...");
  // Au lieu de transférer la propriété, nous conservons le propriétaire actuel
  // mais utilisons le contrat pour mint les intérêts
  
  // 1. Transfert d'USDC à l'utilisateur
  console.log(`Transfert de ${ethers.formatUnits(montantDepot, 18)} USDC à l'utilisateur...`);
  await mintableUSDC.transfer(utilisateur.address, montantDepot);
  const soldeInitial = await mintableUSDC.balanceOf(utilisateur.address);
  console.log(`Solde initial USDC de l'utilisateur: ${ethers.formatUnits(soldeInitial, 18)}`);
  
  // 2. Approbation pour le dépôt dans Compound
  console.log("Approbation du contrat Compound pour dépenser les USDC...");
  await mintableUSDC.connect(utilisateur).approve(await advancedCompound.getAddress(), montantDepot);
  
  // 3. Dépôt dans le vault Compound
  console.log(`Dépôt de ${ethers.formatUnits(montantDepot, 18)} USDC dans Compound...`);
  await advancedCompound.connect(utilisateur).deposit(montantDepot, utilisateur.address);
  
  // Vérification du dépôt
  const sharesUtilisateur = await advancedCompound.balanceOf(utilisateur.address);
  console.log(`Parts reçues par l'utilisateur: ${ethers.formatUnits(sharesUtilisateur, 18)}`);
  const actifsSousJacents = await advancedCompound.convertToAssets(sharesUtilisateur);
  console.log(`Valeur en USDC des parts: ${ethers.formatUnits(actifsSousJacents, 18)}`);
  
  // 4. Simulation des intérêts accumulés (augmentation de 10%)
  const nouveauTaux = ethers.parseUnits("1.1", 18); // 1.1 * 10^18
  console.log("Simulation d'intérêts accumulés (taux d'échange +10%)...");
  await advancedCompound.setExchangeRate(nouveauTaux);
  
  // 5. Accumuler les intérêts - mais d'abord, nous devons réactiver le mint pour le contrat
  const montantInterets = ethers.parseUnits("100", 18); // 100 USDC d'intérêts
  console.log(`Accumulation de ${ethers.formatUnits(montantInterets, 18)} USDC d'intérêts...`);
  
  // Ajouter cette ligne pour que mintableUSDC permette à advancedCompound de mint
  await mintableUSDC.transferOwnership(await advancedCompound.getAddress());
  
  // Maintenant nous pouvons accumuler les intérêts
  await advancedCompound.accrueInterest(montantInterets);
  
  // Vérification des nouveaux actifs sous-jacents après accumulation d'intérêts
  const nouveauxActifsSousJacents = await advancedCompound.convertToAssets(sharesUtilisateur);
  console.log(`Nouvelle valeur en USDC des parts: ${ethers.formatUnits(nouveauxActifsSousJacents, 18)}`);
  console.log(`Augmentation de la valeur: ${ethers.formatUnits(nouveauxActifsSousJacents - actifsSousJacents, 18)} USDC`);
  
  // 6. Retrait du vault par l'utilisateur
  console.log(`Retrait de toutes les parts (${ethers.formatUnits(sharesUtilisateur, 18)}) du vault...`);
  await advancedCompound.connect(utilisateur).redeem(sharesUtilisateur, utilisateur.address, utilisateur.address);
  
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