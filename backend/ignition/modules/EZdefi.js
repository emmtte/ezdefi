// ignition/modules/EZdefi.js
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");
const { ethers } = require("ethers");

module.exports = buildModule("EZdefi", (m) => {
  // Utilisation d'ethers pour manipuler les unités avec 18 décimales (valeur par défaut d'ERC20)
  const initialSupply = ethers.parseUnits("10000000", 18);
  const userAmount = ethers.parseUnits("100000", 18); // 100000 tokens avec 18 décimales
  
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
  // Récupération des comptes utilisateurs
  const user0 = m.getAccount(0); // Ajout de l'utilisateur 0
  const user1 = m.getAccount(1);
  const user2 = m.getAccount(2);

  // Transfert à l'utilisateur 0
  const transferUser0 = m.call(usdc, "transfer", [user0, userAmount], {
    id: "transfer_user0",
    after: [addMinterAToken, addMinterCToken],
  });

  // Transfert à l'utilisateur 1
  const transferUser1 = m.call(usdc, "transfer", [user1, userAmount], {
    id: "transfer_user1",
    after: [addMinterAToken, addMinterCToken],
  });

  // Transfert à l'utilisateur 2
  const transferUser2 = m.call(usdc, "transfer", [user2, userAmount], {
    id: "transfer_user2",
    after: [addMinterAToken, addMinterCToken],
  });

  // Approbations pour les opérations
  const approveUser0 = m.call(
    usdc,
    "approve",
    [yieldOptimizer, userAmount],
    {
      id: "approve_user0",
      from: user0,
      after: [transferUser0],
    }
  );

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
    transferUser0,
    transferUser1,
    transferUser2,
    approveUser0,
    approveUser1,
    approveUser2,
  };
});