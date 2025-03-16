// ignition/modules/deployAaveMock.js
const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

const DeployAaveMock = buildModule("DeployAaveMock", (m) => {
  // Déployer le token sous-jacent
  const testToken = m.contract("TestToken");

  // Déployer le mock Aave en utilisant le token sous-jacent
  const aaveMock = m.contract("AaveMock", [testToken]);

  return { testToken, aaveMock };
});

module.exports = DeployAaveMock;