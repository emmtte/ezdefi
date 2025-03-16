const { buildModule } = require("@ignition-core/modules");

const CompoundModule = buildModule("CompoundModule", (m) => {
  // Déploiement du token de test
  const testToken = m.contract("TestToken");
  
  // Déploiement du mock Compound avec le token de test comme actif sous-jacent
  const compoundMock = m.contract("CompoundMock", [testToken]);
  
  return {
    testToken,
    compoundMock,
  };
});

module.exports = CompoundModule;