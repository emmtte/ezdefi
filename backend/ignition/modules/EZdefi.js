// ignition/modules/EZdefi.js
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("ethers");

module.exports = buildModule("EZdefi", (m) => {
  // Utilisation d'ethers pour manipuler les unités
  const initialSupply = ethers.parseUnits("10000000", 6);
  const userAmount = ethers.parseUnits("10000", 6);
  
  // Déploiement du token USDC mintable
  const usdc = m.contract("MintableUSDC", ["USD Coin", "USDC", initialSupply]);
  
  // Provide a unique ID for the first aToken contract
  const aToken = m.contract("aToken", [usdc, "Aave USDC Vault", "aUSDC"], { id: "aaveUSDC" });
  // Provide a unique ID for the second aToken contract
  const cToken = m.contract("aToken", [usdc, "Compound USDC Vault", "cUSDC"], { id: "compoundUSDC" });
 
  // Déploiement du YieldOptimizer
  const yieldOptimizer = m.contract("YieldOptimizer", [usdc, [aToken, cToken]]);

  // Autorisation des vaults à mint des tokens USDC
  const addMinterAToken = m.call(usdc, "addMinter", [aToken], { id: "minterAaveUSDC" });
  const addMinterCToken = m.call(usdc, "addMinter", [cToken], { id: "minterCompoundUSDC" });

  // Configuration des transferts de tokens aux utilisateurs
  // Nous utilisons getAccount pour récupérer dynamiquement les adresses
  const user1 = m.getAccount(1); // Le second compte (index 1) sera user1
  const user2 = m.getAccount(2); // Le troisième compte (index 2) sera user2

  const transferUser1 = m.call(usdc, "transfer", [user1, userAmount], {
    id: "transfer_user1",
    after: [addMinterAToken, addMinterCToken],
  });

  const transferUser2 = m.call(usdc, "transfer", [user2, userAmount], {
    id: "transfer_user2",
    after: [addMinterAToken, addMinterCToken],
  });

  // Approbations pour les opérations
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