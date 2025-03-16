const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  console.log("Démarrage du script de déploiement et d'interaction avec MockCompoundERC4626...");

  // Récupération des comptes
  const [deployer, user1, user2] = await ethers.getSigners();
  console.log("Déploiement avec le compte:", deployer.address);
  console.log("Compte utilisateur 1:", user1.address);
  console.log("Compte utilisateur 2:", user2.address);

  // Déploiement du token sous-jacent
  console.log("\nDéploiement du token sous-jacent (MockERC20)...");
  const MockERC20 = await ethers.getContractFactory("MockERC20");
  const underlyingToken = await MockERC20.deploy(
    "Underlying Token",
    "UTK",
    ethers.parseEther("1000000")
  );
  await underlyingToken.waitForDeployment();
  console.log("Token sous-jacent déployé à l'adresse:", await underlyingToken.getAddress());

  // Déploiement du mock Compound
  console.log("\nDéploiement du mock Compound ERC-4626...");
  const MockCompound = await ethers.getContractFactory("MockCompoundERC4626");
  const mockCompound = await MockCompound.deploy(
    await underlyingToken.getAddress(),
    "Compound Mock Token",
    "cMock"
  );
  await mockCompound.waitForDeployment();
  console.log("Mock Compound déployé à l'adresse:", await mockCompound.getAddress());

  // Transfert de tokens aux utilisateurs
  const depositAmount = ethers.parseEther("1000");
  console.log("\nTransfert de tokens aux utilisateurs...");
  await underlyingToken.transfer(user1.address, depositAmount * 5n);
  await underlyingToken.transfer(user2.address, depositAmount * 5n );
  console.log(`${ethers.formatEther(depositAmount * 5n)} tokens transférés à chaque utilisateur`);

  // Approbation du mock Compound pour les utilisateurs
  const compoundAddress = await mockCompound.getAddress();
  console.log("Mock Compound Address:", compoundAddress);

  console.log("\nApprobation du mock Compound pour les utilisateurs...");
  console.log(user1.address,compoundAddress, ethers.MaxUint256)
  await underlyingToken.connect(user1).approve(compoundAddress, ethers.parseEther("1000000"));
  await underlyingToken.connect(user2).approve(compoundAddress, ethers.parseEther("1000000"));
  console.log("Approbations effectuées");

  // Vérification des informations du mock Compound
  console.log("\nInformations du mock Compound:");
  console.log("Nom:", await mockCompound.name());
  console.log("Symbole:", await mockCompound.symbol());
  console.log("Asset sous-jacent:", await mockCompound.asset());
  console.log("Taux d'échange initial:", ethers.formatEther(await mockCompound.exchangeRateStored()));

  // Dépôt de tokens par l'utilisateur 1
  console.log("\nDépôt de tokens par l'utilisateur 1...");
  await mockCompound.connect(user1).deposit(depositAmount, user1.address);
  console.log(`${ethers.formatEther(depositAmount)} tokens déposés par l'utilisateur 1`);
  console.log(`Solde de parts de l'utilisateur 1: ${ethers.formatEther(await mockCompound.balanceOf(user1.address))}`);
  console.log(`Total des parts émises: ${ethers.formatEther(await mockCompound.totalSupply())}`);
  console.log(`Total des actifs gérés: ${ethers.formatEther(await mockCompound.totalAssets())}`);

  // Simulation d'accumulation d'intérêts
  console.log("\nSimulation d'accumulation d'intérêts (10%)...");
  const newRate = ethers.parseEther("1.1"); // 10% d'intérêts
  await mockCompound.setExchangeRate(newRate);
  console.log(`Nouveau taux d'échange: ${ethers.formatEther(await mockCompound.exchangeRateStored())}`);
  console.log(`Valeur des parts de l'utilisateur 1: ${ethers.formatEther(await mockCompound.convertToAssets(await mockCompound.balanceOf(user1.address)))}`);

  // Dépôt de tokens par l'utilisateur 2 après l'augmentation du taux
  console.log("\nDépôt de tokens par l'utilisateur 2 après l'augmentation du taux...");
  await mockCompound.connect(user2).deposit(depositAmount, user2.address);
  console.log(`${ethers.formatEther(depositAmount)} tokens déposés par l'utilisateur 2`);
  console.log(`Solde de parts de l'utilisateur 2: ${ethers.formatEther(await mockCompound.balanceOf(user2.address))}`);
  console.log(`Total des parts émises: ${ethers.formatEther(await mockCompound.totalSupply())}`);
  console.log(`Total des actifs gérés: ${ethers.formatEther(await mockCompound.totalAssets())}`);

  // Retrait par l'utilisateur 1
  console.log("\nRetrait par l'utilisateur 1...");
  const user1Shares = await mockCompound.balanceOf(user1.address);
  const user1Assets = await mockCompound.convertToAssets(user1Shares);
  await mockCompound.connect(user1).redeem(user1Shares, user1.address, user1.address);
  console.log(`${ethers.formatEther(user1Shares)} parts brûlées`);
  console.log(`${ethers.formatEther(user1Assets)} tokens reçus`);
  console.log(`Solde de parts de l'utilisateur 1: ${ethers.formatEther(await mockCompound.balanceOf(user1.address))}`);
  console.log(`Solde de tokens de l'utilisateur 1: ${ethers.formatEther(await underlyingToken.balanceOf(user1.address))}`);

  // Retrait par l'utilisateur 2
  console.log("\nRetrait par l'utilisateur 2...");
  const user2Shares = await mockCompound.balanceOf(user2.address);
  const user2Assets = await mockCompound.convertToAssets(user2Shares);
  await mockCompound.connect(user2).redeem(user2Shares, user2.address, user2.address);
  console.log(`${ethers.formatEther(user2Shares)} parts brûlées`);
  console.log(`${ethers.formatEther(user2Assets)} tokens reçus`);
  console.log(`Solde de parts de l'utilisateur 2: ${ethers.formatEther(await mockCompound.balanceOf(user2.address))}`);
  console.log(`Solde de tokens de l'utilisateur 2: ${ethers.formatEther(await underlyingToken.balanceOf(user2.address))}`);

  // État final du contrat
  console.log("\nÉtat final du contrat:");
  console.log(`Total des parts émises: ${ethers.formatEther(await mockCompound.totalSupply())}`);
  console.log(`Total des actifs gérés: ${ethers.formatEther(await mockCompound.totalAssets())}`);
  
  console.log("\nScript terminé avec succès!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });