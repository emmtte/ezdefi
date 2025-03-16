const { buildModule } = require("@ignition-core/modules");

const YieldOptimizerModule = buildModule("YieldOptimizerModule", (m) => {
  // Déploiement du token de test
  const testToken = m.contract("TestToken");
  
  // Déploiement des mocks
  const aaveMock = m.contract("AaveMock", [testToken]);
  const compoundMock = m.contract("CompoundMock", [testToken]);
  
  // Déploiement de l'optimiseur de rendement
  const yieldOptimizer = m.contract("YieldOptimizer", [
    testToken,
    aaveMock,
    compoundMock
  ]);
  
  return {
    testToken,
    aaveMock,
    compoundMock,
    yieldOptimizer
  };
});

module.exports = YieldOptimizerModule;