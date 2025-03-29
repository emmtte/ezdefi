require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");

const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  solidity: "0.8.28",
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      chainId: 31337
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337
    },
   sepolia: {
     url: process.env.RPC_URL_SEPOLIA,
     chainId: 11155111,
     accounts: [
      process.env.PRIVATE_KEY_OWNER,
      process.env.PRIVATE_KEY_USER_1,
      process.env.PRIVATE_KEY_USER_2
    ]
    }
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY
    }
  },
  docgen: {
    path: './docs',
    clear: true,
    runOnCompile: true,
  }
};