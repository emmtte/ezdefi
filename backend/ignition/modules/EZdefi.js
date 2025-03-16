import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";

const deployEZdefiModule = buildModule("DeployEZdefi", (m) => {
  // Déploiement des mocks
  const MockERC20 = m.contract("MockERC20", ["USD Coin", "USDC", 6]);
  const MockAaveLendingPool = m.contract("MockAaveLendingPool");
  const MockCompoundCToken = m.contract("MockCompoundCToken");

  // Déploiement de EZdefi
  const EZdefi = m.contract("EZdefi", [
    MockERC20,
    MockAaveLendingPool,
    MockCompoundCToken,
  ]);

  // Initialisation des taux (facultatif, mais recommandé pour les tests)
  m.call(MockAaveLendingPool, "setRate", [100]); // Exemple de taux pour Aave
  m.call(MockCompoundCToken, "setRate", [90]); // Exemple de taux pour Compound

  // Mint des tokens USDC pour le déployeur (facultatif, mais recommandé pour les tests)
  m.call(MockERC20, "mint", [m.getAccount(0), 1000000]);

  // Approbation des tokens USDC pour EZdefi (facultatif, mais recommandé pour les tests)
  m.call(MockERC20, "approve", [EZdefi, 1000000]);

  return {
    MockERC20,
    MockAaveLendingPool,
    MockCompoundCToken,
    EZdefi,
  };
});

export default deployEZdefiModule;