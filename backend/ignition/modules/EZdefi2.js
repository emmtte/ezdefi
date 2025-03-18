// ignition/modules/EZdefi.js
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("EZdefi", (m) => {
  // Utilisation de 6 décimales comme dans le premier fichier (standard pour USDC)
  const initialSupply = "10000000000000"; // 10M avec 6 décimales
  const userAmount = "10000000000"; // 10K avec 6 décimales
  
  // Déploiement du token USDC mintable
  const usdc = m.contract("MintableUSDC", ["USD Coin", "USDC", initialSupply]);
  
  // Déploiement des vaults
  const aToken = m.contract("aToken", [
    usdc, 
    "Aave USDC Vault", 
    "aUSDC"
  ], { id: "aaveUSDC" });
  
  const cToken = m.contract("aToken", [
    usdc, 
    "Compound USDC Vault", 
    "cUSDC"
  ], { id: "compoundUSDC" });
 
  // Déploiement du YieldOptimizer
  const yieldOptimizer = m.contract("YieldOptimizer", [
    usdc, 
    [aToken, cToken]
  ]);

  // Autorisation des vaults à mint des tokens USDC
  const addMinterAToken = m.call(usdc, "addMinter", [aToken], { id: "minterAaveUSDC" });
  const addMinterCToken = m.call(usdc, "addMinter", [cToken], { id: "minterCompoundUSDC" });

  // Récupération des comptes utilisateurs
  const deployer = m.getAccount(0); // Correspond au "deployer" du premier script
  const user1 = m.getAccount(1);    // Correspond au "user1" du premier script
  const user2 = m.getAccount(2);    // Correspond au "user2" du premier script

  // Transfert aux utilisateurs 1 et 2 comme dans le premier script  
  const transferUser1 = m.call(usdc, "transfer", [user1, userAmount], {
    id: "transfer_user1",
    from: deployer,
    after: [addMinterAToken, addMinterCToken],
  });

  const transferUser2 = m.call(usdc, "transfer", [user2, userAmount], {
    id: "transfer_user2",
    from: deployer,
    after: [addMinterAToken, addMinterCToken],
  });

  // Approbations pour les opérations de user1 et user2
  const approveUser1 = m.call(
    usdc,
    "approve",
    [yieldOptimizer, userAmount],
    {
      id: "approve_user1",
      from: user1,
      after: [transferUser1],
    }
  );

  const approveUser2 = m.call(
    usdc,
    "approve",
    [yieldOptimizer, userAmount],
    {
      id: "approve_user2",
      from: user2,
      after: [transferUser2],
    }
  );
  
  // Retourner tous les contrats et informations importantes
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