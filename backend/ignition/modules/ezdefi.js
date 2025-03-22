// ignition/modules/ezdefi.js
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("ethers");
const hre = require("hardhat");

module.exports = buildModule("EZdefi", (m) => {
  // Obtenir le nom du réseau directement de l'environnement Hardhat
  const networkName = hre.network.name;
  console.log(`Déploiement sur le réseau: ${networkName}`);
  
  // Utilisation d'ethers pour manipuler les unités avec 18 décimales
  const initialSupply = ethers.parseUnits("10000000", 18);
  const userAmount = ethers.parseUnits("100000", 18);
  
  // Configuration des adresses de déploiement
  let deployerAddress, user1Address, user2Address;
  
  if (networkName === "localhost" || networkName === "hardhat") {
    // Sur localhost, on utilise les adresses des comptes par défaut
    deployerAddress = undefined; // undefined = utiliser le compte par défaut
    user1Address = undefined;
    user2Address = undefined;
    console.log("Utilisation des comptes Hardhat par défaut");
  } else {
    // Sur les réseaux de test/mainnet, on spécifie explicitement les adresses
    // Ignition utilisera les comptes associés à ces adresses dans la config du réseau
    const accounts = hre.config.networks[networkName]?.accounts || [];
    if (Array.isArray(accounts) && accounts.length >= 3) {
      // Dériver les adresses à partir des clés privées
      const wallets = accounts.map(privateKey => new ethers.Wallet(privateKey));
      deployerAddress = wallets[0].address;
      user1Address = wallets[1].address;
      user2Address = wallets[2].address;
      console.log("Utilisation des comptes configurés via clés privées");
      console.log(`Adresse du déployeur: ${deployerAddress}`);
    } else {
      throw new Error("Pas assez de comptes configurés pour le réseau " + networkName);
    }
  }
  
  // Déploiement du token USDC mintable
  const usdc = m.contract("MintableUSDC", ["USD Coin", "USDC", initialSupply], {
    from: deployerAddress
  });
  
  // Déploiement des vaults avec des ID uniques
  const aToken = m.contract("aToken", [usdc, "Aave USDC Vault", "aUSDC"], { 
    id: "aaveUSDC",
    from: deployerAddress
  });
  
  const cToken = m.contract("aToken", [usdc, "Compound USDC Vault", "cUSDC"], { 
    id: "compoundUSDC",
    from: deployerAddress
  });
  
  // Déploiement du YieldOptimizer
  const yieldOptimizer = m.contract("YieldOptimizer", [usdc, [aToken, cToken]], {
    from: deployerAddress
  });

  // Autorisation des vaults à mint des tokens USDC
  const addMinterAToken = m.call(usdc, "addMinter", [aToken], { 
    id: "minterAaveUSDC",
    from: deployerAddress
  });
  
  const addMinterCToken = m.call(usdc, "addMinter", [cToken], { 
    id: "minterCompoundUSDC",
    from: deployerAddress
  });

  // Transfert aux utilisateurs
  const transferUser1 = m.call(usdc, "transfer", [user1Address || m.getAccount(1), userAmount], {
    id: "transfer_user1",
    after: [addMinterAToken, addMinterCToken],
    from: deployerAddress
  });

  const transferUser2 = m.call(usdc, "transfer", [user2Address || m.getAccount(2), userAmount], {
    id: "transfer_user2",
    after: [addMinterAToken, addMinterCToken],
    from: deployerAddress
  });

  // Approbations pour les opérations
  const approveUser1 = m.call(
    usdc,
    "approve",
    [yieldOptimizer, userAmount],
    {
      id: "approve_user1",
      from: user1Address,
      after: [transferUser1],
    }
  );

  const approveUser2 = m.call(
    usdc,
    "approve",
    [yieldOptimizer, userAmount],
    {
      id: "approve_user2",
      from: user2Address,
      after: [transferUser2],
    }
  );
  
  return {
    usdc,
    aToken,
    cToken,
    yieldOptimizer,
    transferUser1,
    transferUser2,
    approveUser1,
    approveUser2,
  };
});