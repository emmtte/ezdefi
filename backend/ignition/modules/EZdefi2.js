const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("DeployVaultModule", (m) => {
  // Déployer MockUSDC
  const mockUSDC = m.contract("MockUSDC");

  // Déployer MockAave
  const mockAave = m.contract("MockAave");

  // Déployer MockCompound avec l'adresse de MockUSDC comme argument
  const mockCompound = m.contract("MockCompound", [mockUSDC]);

  // Déployer YieldOptimizingVault avec les adresses des mocks comme arguments
  const yieldOptimizingVault = m.contract("YieldOptimizingVault", [
    mockUSDC,
    mockAave,
    mockCompound,
  ]);

  return { mockUSDC, mockAave, mockCompound, yieldOptimizingVault };
});
