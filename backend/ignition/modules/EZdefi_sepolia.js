const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

//npx hardhat ignition deploy ignition/modules/EZdefi.js --network hardhat

module.exports = buildModule("EZdefiModule", (m) => {
  const USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // Adresse USDC Mainnet
  // https://search.onaave.com/?q=aaveV3Ethereum
  const AAVE_LENDING_POOL_ADDRESS = "0x497a1994c46d4f6C864904A9f1fac6328Cb7C8a6"
  //const AAVE_LENDING_POOL_ADDRESS = "0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9"; // Adresse Aave Lending Pool Mainnet
  // https://docs.compound.finance/#networks
  //0xc3d688B66703497DAA19211EEdff47f25384cdc3
  //const COMPOUND_CTOKEN_ADDRESS = "0x39AA39c2Cb3963607f3412c2c36c513E4CbD4815"; // Adresse cUSDC Compound Mainnet
  const COMPOUND_CTOKEN_ADDRESS = "0xc3d688B66703497DAA19211EEdff47f25384cdc3"; // Adresse cUSDC Compound Mainnet

  const EZdefi = m.contract("EZdefi", [
    USDC_ADDRESS,
    AAVE_LENDING_POOL_ADDRESS,
    COMPOUND_CTOKEN_ADDRESS,
  ]);

  return { EZdefi };
});