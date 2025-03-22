const { ethers } = require("hardhat");


async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Déploiement avec l'adresse:", deployer.address);
    
    // Déployer le token USDC mock
    const USDC = await ethers.getContractFactory("MockUSDC");
    const usdc = await USDC.deploy("USD Coin", "USDC");
    console.log("USDC déployé à:", await usdc.getAddress());
    
    // Mint des USDC pour les tests
    await usdc.mint(deployer.address, ethers.parseUnits("100000", 6));
    
    // Déployer trois vaults avec différents taux
    const MockVault = await ethers.getContractFactory("SimpleMockERC4626");
    
    const usdcAddress = await usdc.getAddress();
    const vault1 = await MockVault.deploy(usdcAddress, "Vault One", "VAULT1", 300); // 3%
    const vault2 = await MockVault.deploy(usdcAddress, "Vault Two", "VAULT2", 450); // 4.5%
    const vault3 = await MockVault.deploy(usdcAddress, "Vault Three", "VAULT3", 380); // 3.8%
    
    console.log("Vaults déployées avec taux: 3%, 4.5%, 3.8%");
    
    // Déployer l'optimiseur de rendement
    const Optimizer = await ethers.getContractFactory("SimpleYieldOptimizer");
    const optimizer = await Optimizer.deploy(usdcAddress);
    console.log("Optimiseur déployé à:", await optimizer.getAddress());
    
    // Ajouter les vaults à l'optimiseur
    await optimizer.addVault(await vault1.getAddress());
    await optimizer.addVault(await vault2.getAddress());
    await optimizer.addVault(await vault3.getAddress());
    console.log("Vaults ajoutées à l'optimiseur");
    
    // Trouver la meilleure vault
    const bestVault = await optimizer.findBestVault();
    console.log("Meilleure vault:", bestVault); // Devrait être vault2 (4.5%)
    
    // Déposer des USDC
    const depositAmount = ethers.parseUnits("1000", 6);
    await usdc.approve(await optimizer.getAddress(), depositAmount);
    await optimizer.deposit(depositAmount);
    console.log("1000 USDC déposés dans l'optimiseur");
    
    // Changer les taux
    await vault1.setYieldRate(500); // 5%
    await vault2.setYieldRate(300); // 3%
    console.log("Nouveaux taux: 5%, 3%, 3.8%");
    
    // Vérifier la nouvelle meilleure vault
    const newBestVault = await optimizer.findBestVault();
    console.log("Nouvelle meilleure vault:", newBestVault); // Devrait être vault1 (5%)
    
    // Retirer des USDC
    const withdrawAmount = ethers.parseUnits("500", 6);
    await optimizer.withdraw(withdrawAmount);
    console.log("500 USDC retirés de l'optimiseur");
    
    // Vérifier le solde total
    const totalBalance = await optimizer.getTotalBalance();
    console.log("Solde total dans l'optimiseur:", ethers.formatUnits(totalBalance, 6), "USDC");
}

// Exécution du script principal avec gestion des erreurs
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Erreur lors du déploiement et des tests:");
    console.error(error);
    process.exit(1);
  });